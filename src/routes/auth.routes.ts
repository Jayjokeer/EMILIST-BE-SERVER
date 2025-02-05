import { Router, Request, Response } from "express";
import * as authController from "../controllers/auth.controller";
import { userAuth } from "../middlewares/current-user";
import { multipleUpload, singleUpload } from "../utils/image-upload";
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
//file uploads
router.route("/upload-image").post(singleUpload, authController.uploadImage);
router.route("/upload-files").post(multipleUpload, authController.uploadMultipleFiles);

router.route("/resend-otp").post(authController.resendVerificationOtpController);
router.route('/google').get( passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.route('/google/callback',).get( passport.authenticate('google'), authController.googleRedirectController);
router.route("/add-click").patch(authController.countClicksController);
router.route("/subscribe-newsletter").post( authController.subscribeNewsLetterController);
router.route("/user-details/:userId").get( authController.getUserDetailsController);

//Protected routes
router.route("/log-out").get(userAuth, authController.logoutController);
router.route("/update-profile").patch(userAuth,singleUpload,authController.updateUserController);
router.route("/change-password").patch(userAuth,authController.changePasswordController);
router.route("/current-user").get(userAuth,authController.currentUserController);
router.route("/deactivate-user").patch(userAuth,authController.deactivateUserController);
router.route("/get-specific-user").get(userAuth,authController.findUserController);
router.route("/invite-user").get(userAuth,authController.inviteUserController);
router.route("/request-verificaton").get(userAuth,authController.requestVerificationController);
router.route("/insights").get(userAuth, authController.insightsController);
router.route("/update-account-details").patch(userAuth, authController.updateAccountDetailsController);

export { router as AuthRoute };
