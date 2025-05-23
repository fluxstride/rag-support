import bcrypt from "bcrypt";
import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import validation from "../../middlewares/validation.middleware";
import asyncWrap from "../../utils/asyncWrapper";
import HttpException from "../../utils/http.exception";
import "dotenv/config";
import {
  NewUserParams,
  userInsertSchema,
  users,
} from "../../lib/db/schema/user";
import { db } from "../../lib/db";
import { eq } from "drizzle-orm";
import {
  authCheck,
  AuthenticatedRequest,
} from "../../middlewares/authCheck.middleware";
import nodemailer from "nodemailer";
import { passwordResetTokens } from "../../lib/db/schema/passwordResetTokens";

let refreshTokens: any[] = [];

export function setAuthCookie(
  res: Response,
  name: string,
  value: string,
  maxAgeMs: number,
) {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie(name, value, {
    httpOnly: true,
    secure: isProduction, // only set secure in production
    sameSite: isProduction ? "none" : "lax", // 'none' for cross-site in prod, 'lax' for dev
    maxAge: maxAgeMs,
    path: "/",
  });
}

const generateAccessToken = (payload: any) => {
  return jwt.sign(payload, process.env.SECRETKEY as string, {
    expiresIn: "15s",
    algorithm: "HS256",
  });
};

const generateRefreshToken = (payload: any) => {
  const token = jwt.sign(payload, process.env.SECRETKEY as string, {
    expiresIn: "1d",
    algorithm: "HS256",
  });

  refreshTokens.push(token);
  return token;
};

export class AuthController {
  router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post("/auth/signup", validation(userInsertSchema), this.signup);
    this.router.post("/auth/login", this.login);
    this.router.post("/auth/logout", this.logout);
    this.router.post("/auth/refresh", this.refreshTokens);
    this.router.post("/auth/change-password", authCheck, this.changePassword);
    this.router.post("/auth/reset-password-mail", this.sendPasswordResetMail);
    this.router.post("/auth/reset-password/:token", this.resetPassword);
  }

  private signup = asyncWrap(
    async (req: Request<any, any, NewUserParams>, res: Response) => {
      let userData = req.body;

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));

      console.log({ existingUser });

      if (existingUser) {
        throw new HttpException(
          409,
          `User with the provided email already exists`,
        );
      }

      const passwordHash = bcrypt.hashSync(userData.password, 10);

      let [createdUser] = await db
        .insert(users)
        .values({
          name: userData.name,
          email: userData.email.toLocaleLowerCase(),
          password: passwordHash,
          role: userData.role,
        })
        .returning();

      console.log({ createdUser });

      const payload = {
        uid: createdUser.id,
      };

      const secretKey = process.env.SECRETKEY as string;
      const token = jwt.sign(payload, secretKey, {
        expiresIn: "30m",
      });

      const { password, ...user } = createdUser;

      res.status(201).json({
        success: true,
        user,
        token,
      });
    },
  );

  private login = asyncWrap(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (!existingUser)
      throw new HttpException(401, "Invalid login credentials");

    if (existingUser.is_blocked) {
      throw new HttpException(403, "Account is blocked. Contact support.");
    }

    const MAX_ATTEMPTS = 3;
    const BLOCK_THRESHOLD = 6;
    const WAIT_TIME_MINUTES = 15;

    if (existingUser.login_attempts! >= MAX_ATTEMPTS) {
      const lastAttemptTime = new Date(existingUser.last_failed_login!);
      const now = new Date();
      const minutesSinceLastAttempt =
        (now.getTime() - lastAttemptTime.getTime()) / (1000 * 60);

      if (existingUser.login_attempts! >= BLOCK_THRESHOLD) {
        await db
          .update(users)
          .set({ is_blocked: true })
          .where(eq(users.email, email));
        throw new HttpException(
          403,
          "Account has been blocked after too many failed attempts.",
        );
      }

      if (minutesSinceLastAttempt < WAIT_TIME_MINUTES) {
        const waitTimeLeft =
          WAIT_TIME_MINUTES - Math.floor(minutesSinceLastAttempt);
        throw new HttpException(
          429,
          `Too many failed attempts. Try again in ${waitTimeLeft} minute(s).`,
        );
      } else {
        await db
          .update(users)
          .set({ login_attempts: 0 })
          .where(eq(users.email, email));
        existingUser.login_attempts = 0;
      }
    }

    const validPassword = bcrypt.compareSync(password, existingUser.password);

    if (!validPassword) {
      const newAttempts = existingUser.login_attempts! + 1;
      const isBlocked = newAttempts >= BLOCK_THRESHOLD;

      await db
        .update(users)
        .set({
          login_attempts: newAttempts,
          last_failed_login: new Date(),
          is_blocked: isBlocked,
        })
        .where(eq(users.email, email));

      if (isBlocked) {
        throw new HttpException(
          403,
          "Account has been blocked after too many failed attempts.",
        );
      }

      throw new HttpException(401, "Invalid login credentials");
    }

    await db
      .update(users)
      .set({
        login_attempts: 0,
        last_failed_login: null,
      })
      .where(eq(users.email, email));

    const uid = existingUser.id;
    const payload = { uid };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setAuthCookie(res, "accessToken", accessToken, 15 * 60 * 1000);

    setAuthCookie(res, "refreshToken", refreshToken, 7 * 24 * 60 * 60 * 1000);

    const { password: _, ...user } = existingUser;

    res.status(200).json({
      success: true,
      user,
    });
  });

  private logout = asyncWrap(async (req: Request, res: Response) => {
    res.clearCookie("refreshToken").clearCookie("accessToken");

    res.status(200).json({ success: true });
  });

  private refreshTokens = asyncWrap(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;

    if (!token) {
      throw new HttpException(401, "Unauthorized");
    }

    if (!refreshTokens.includes(token)) {
      throw new HttpException(403, "Fobidden");
    }

    jwt.verify(
      token,
      process.env.SECRETKEY as string,
      (error: any, payload: any) => {
        if (error) {
          throw new HttpException(403, "Forbidden");
        }

        const uid = payload.uid;
        const newAccessToken = generateAccessToken({
          uid,
        });

        res.cookie("accessToken", newAccessToken, {
          maxAge: 1000 * 15,
          httpOnly: true,
          secure: false,
          sameSite: "lax",
        });

        res.json({ success: true });
      },
    );
  });

  private changePassword = asyncWrap(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.uid as string;
      const updateData = req.body;

      console.log(updateData);

      const [user] = await db
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, userId));

      console.log(user);

      if (!user) {
        throw new HttpException(404, "User does not exist");
      }

      const validPassword = bcrypt.compareSync(
        updateData.currentPassword,
        user.password,
      );

      if (!validPassword) {
        throw new HttpException(400, "Incorrect password");
      }

      const passwordHash = bcrypt.hashSync(updateData.newPassword, 10);

      const [updatedProfile] = await db
        .update(users)
        .set({ password: passwordHash })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        });

      res.status(200).json({
        success: true,
        profile: updatedProfile,
      });
    },
  );

  private sendPasswordResetMail = asyncWrap(
    async (req: Request, res: Response) => {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_EMAIL_ADDRESS,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const userEmail = req.body.email;

      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, userEmail));

      if (!user) {
        throw new HttpException(401, "User with thet email does not exit");
      }

      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, user.id));

      const secretKey = process.env.SECRETKEY as string;

      const token = jwt.sign({ userId: user.id }, secretKey, {
        expiresIn: "30m",
      });

      console.log({ token });

      const [passwordResetToken] = await db
        .insert(passwordResetTokens)
        .values({ userId: user.id, token })
        .returning();

      const link = `http://localhost:5173/reset-password/${passwordResetToken.token}`;

      const mailOptions = {
        from: "Password reset",
        to: userEmail,
        subject: `RESET YOUR PASSWORD`,
        html: `<div>
      <p>visit the link below to reset your password.</p>
      <p>${link}</p>
      </div>`,
      };

      await transporter.sendMail(mailOptions);

      res.json({ success: true, message: "Email sent successfully" });
    },
  );

  private resetPassword = asyncWrap(async (req: Request, res: Response) => {
    const resetToken = req.params.token;
    const password = req.body.password;

    const [passwordResetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, resetToken));

    if (!passwordResetToken) {
      throw new HttpException(400, "Invalid password reset token");
    }
    const secretKey = process.env.SECRETKEY as string;
    const payload = jwt.verify(resetToken, secretKey);

    const userId = (payload as { userId: string }).userId;

    const hashedPassword = bcrypt.hashSync(password, 10);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));

    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, passwordResetToken.id));

    res.status(200).json({
      success: true,
    });
  });
}
