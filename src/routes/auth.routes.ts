import { Router, Request, Response } from "express";
import * as authController from "../controllers/auth.controller"; // Ensure the path is correct

const router = Router();

router.route("/").get((req: Request, res: Response) => {
  res.json({ message: "Welcome to Emilist" });
});

router.route("/sign-up").post(authController.registerUserController);
router.route("/login").post(authController.login);
router.route("/verify-email").post(authController.verifyEmailController);
router.route("/forgot-password").post(authController.forgetPasswordController);
router.route("/reset-password").post(authController.resetPasswordController);

export { router as AuthRoute };
