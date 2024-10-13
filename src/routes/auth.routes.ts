import { Router, Request, Response } from "express";
import * as authController from "../controllers/auth.controller"; // Ensure the path is correct
import { userAuth } from "../middlewares/current-user";

const router = Router();

router.route("/").get((req: Request, res: Response) => {
  res.json({ message: "Welcome to Emilist" });
});
//unprotected routes
router.route("/sign-up").post(authController.registerUserController);
router.route("/login").post(authController.login);
router.route("/verify-email").post(authController.verifyEmailController);
router.route("/forgot-password").post(authController.forgetPasswordController);
router.route("/reset-password").post(authController.resetPasswordController);
//Protected routes
router.route("/update-profile").post(userAuth,authController.updateUserController);
router.route("/change-password").post(userAuth,authController.changePasswordController);
router.route("/current-user").get(userAuth,authController.currentUserController);

export { router as AuthRoute };
