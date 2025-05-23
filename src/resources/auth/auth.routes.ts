// import { Router } from "express";
// import { authController } from "./auth.module";
// import { authCheck } from "../../middlewares/authCheck.middleware";
// import validation from "../../middlewares/validation.middleware";
// import { userInsertSchema } from "../../lib/db/schema/user";
//
// const authRoutes = Router();
//
// authRoutes.post(
//   "/auth/signup",
//   validation(userInsertSchema),
//   authController.signup,
// );
// authRoutes.post("/auth/login", authController.login);
// authRoutes.post("/auth/logout", authController.logout);
// authRoutes.post("/auth/refresh", authController.refreshTokens);
// authRoutes.post(
//   "/auth/change-password",
//   authCheck,
//   authController.changePassword,
// );
// authRoutes.post(
//   "/auth/reset-password-mail",
//   authController.sendPasswordResetMail,
// );
// authRoutes.post("/auth/reset-password/:token", authController.resetPassword);
//
// export default authRoutes;
