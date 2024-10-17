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
router.route("/login").post(authController.loginController);
router.route("/verify-email").post(authController.verifyEmailController);
router.route("/forgot-password").post(authController.forgetPasswordController);
router.route("/reset-password").post(authController.resetPasswordController);
router.route("/upload-image").post(upload.single('image'), authController.uploadImage);
router.route("/resend-otp").post(authController.resendVerificationOtpController);
router.route('/google').get( passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.route('/google/callback',).get( passport.authenticate('google'), authController.googleRedirectController);
//Protected routes
router.route("/log-out").get(userAuth, authController.logoutController);
router.route("/update-profile").patch(userAuth,authController.updateUserController);
router.route("/change-password").patch(userAuth,authController.changePasswordController);
router.route("/current-user").get(userAuth,authController.currentUserController);
router.route("/deactivate-user").patch(userAuth,authController.deactivateUserController);


export { router as AuthRoute };
