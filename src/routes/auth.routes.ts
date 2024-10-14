import { Router, Request, Response } from "express";
import * as authController from "../controllers/auth.controller";
import { userAuth } from "../middlewares/current-user";
import { upload } from "../utils/image-upload";
import passport from "passport";


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
router.route("/upload-image").post(upload.single('image'), authController.uploadImage);
router.route("/resend-otp").post(authController.resendVerificationOtpController);
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.route('/google/callback',).get( passport.authenticate('google'), authController.googleRedirectController);

//Protected routes
router.route("/update-profile").post(userAuth,authController.updateUserController);
router.route("/change-password").post(userAuth,authController.changePasswordController);
router.route("/current-user").get(userAuth,authController.currentUserController);

export { router as AuthRoute };
