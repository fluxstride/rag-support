import { Router, Request, Response } from "express";
import {
  authCheck,
  AuthenticatedRequest,
} from "../../middlewares/authCheck.middleware";
import asyncWrap from "../../utils/asyncWrapper";
import HttpException from "../../utils/http.exception";
import multer from "multer";
import { users } from "../../lib/db/schema/user";
import { db } from "../../lib/db";
import { eq, getTableColumns } from "drizzle-orm";

export class ProfileController {
  router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    // const storage = multer.memoryStorage();
    // const upload = multer({ storage });

    this.router.get("/profile/me", authCheck, this.getProfile);

    this.router.patch("/profile/:userId", authCheck, this.updateProfile);

    this.router.delete("/profile/:id", authCheck, this.deleteProfile);
  }

  private getProfile = asyncWrap(
    async (req: AuthenticatedRequest, res: Response) => {
      const id = req.uid as string;
      console.log({ cookies: req.cookies });

      const { password, ...rest } = getTableColumns(users);
      const [profile] = await db
        .select(rest)
        .from(users)
        .where(eq(users.id, id));

      if (!profile) {
        throw new HttpException(404, "User does not exist");
      }

      res.status(200).json({ success: true, profile });
    },
  );

  public async deleteProfile(req: AuthenticatedRequest, res: Response) {
    const id = req.params.id;

    await db.delete(users).where(eq(users.id, id));

    res.status(200).json({
      message: "user has been deleted",
    });
  }

  public updateProfile = asyncWrap(async (req: Request, res: Response) => {
    console.log({ cookies: req.cookies });

    const userId = req.params.userId;
    const updateData = req.body;

    const [userExitst] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!userExitst) {
      throw new HttpException(404, "User does not exist");
    }

    const [updatedProfile] = await db
      .update(users)
      .set({ name: updateData.name, email: updateData.email })
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
  });
}
