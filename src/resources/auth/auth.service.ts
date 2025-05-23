import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { users } from "../../lib/db/schema/user";
import HttpException from "../../utils/http.exception";

let refreshTokens: any[] = [];

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

export class AuthService {
  login = async (loginData: any) => {
    const email = loginData.email;
    const password = loginData.password;

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
    const { password: _, ...user } = existingUser;

    return {
      user,
      accessToken,
      refreshToken,
    };
  };

  signUp = async (signUpData: any) => {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, signUpData.email));

    console.log({ existingUser });

    if (existingUser) {
      throw new HttpException(
        409,
        `User with the provided email already exists`,
      );
    }

    const passwordHash = bcrypt.hashSync(signUpData.password, 10);

    let [createdUser] = await db
      .insert(users)
      .values({
        name: signUpData.name,
        email: signUpData.email.toLocaleLowerCase(),
        password: passwordHash,
        role: signUpData.role,
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

    return {
      token,
      user,
    };
  };
}
