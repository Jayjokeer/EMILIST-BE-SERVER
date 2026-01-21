import { Router, Request, Response } from "express";
import * as authController from "../controllers/auth.controller";
import { userAuth } from "../middlewares/current-user";
import { multipleUpload, singleUpload } from "../utils/image-upload";
import passport from "passport";
import { validateRegisterUser, validateLoginUser, validateVerifyEmail, validateForgetPassword, validateResetPassword, validateChangePassword, validateUpdateAccountDetails, validatePaymentForVerification } from "../validations/auth.validation";
import *  as paymentController from "../controllers/payment.controller";

const router = Router();

router.route("/").get((req: Request, res: Response) => {
  res.json({ message: "Welcome to Emilist" });
});
//unprotected routes
router.route("/sign-up").post(validateRegisterUser, authController.registerUserController);
router.route("/login").post(validateLoginUser, authController.loginController);
router.route("/verify-email").post(validateVerifyEmail, authController.verifyEmailController);
router.route("/forgot-password").post(validateForgetPassword, authController.forgetPasswordController);
router.route("/reset-password").post(validateResetPassword, authController.resetPasswordController);
//file uploads
router.route("/upload-image").post(singleUpload, authController.uploadImage);
router.route("/upload-files").post(multipleUpload, authController.uploadMultipleFiles);

router.route("/resend-otp").post(authController.resendVerificationOtpController);
router.route('/google').get( passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,

}));

router.route('/google/callback',).get(passport.authenticate('google', { session: false }),
 authController.googleRedirectController);
router.route("/add-click").patch(authController.countClicksController);
router.route("/subscribe-newsletter").post( authController.subscribeNewsLetterController);
router.route("/user-details/:userId").get( authController.getUserDetailsController);

//Protected routes
router.route("/log-out").get(userAuth, authController.logoutController);
router.route("/update-profile").patch(userAuth,singleUpload,authController.updateUserController);
router.route("/change-password").patch(userAuth,validateChangePassword, authController.changePasswordController);
router.route("/current-user").get(userAuth,authController.currentUserController);
router.route("/deactivate-user").patch(userAuth,authController.deactivateUserController);
router.route("/get-specific-user").get(userAuth,authController.findUserController);
router.route("/invite-user").get(userAuth,authController.inviteUserController);
router.route("/request-verificaton").get(userAuth,authController.requestVerificationController);
router.route("/insights").get(userAuth, authController.insightsController);
router.route("/update-account-details").patch(userAuth,validateUpdateAccountDetails, authController.updateAccountDetailsController);
router.route("/pay-for-verification").post(userAuth,validatePaymentForVerification , paymentController.payforVerificationController);

export { router as AuthRoute };
