import { Router, Request, Response } from "express";
import * as authController from "../controllers/auth.controller";
import { optionalUserAuth, userAuth } from "../middlewares/current-user";
import { multipleUpload, singleUpload } from "../utils/image-upload";
import passport from "passport";
import { validateAdminTriggeredPasswordReset, validateRegisterUser, validateLoginUser, validateVerifyEmail, validateForgetPassword, validateResetPassword, validateChangePassword, validateUpdateAccountDetails, validatePaymentForVerification, validateUpdateUser, validatePasswordOtp } from "../validations/auth.validation";
import *  as paymentController from "../controllers/payment.controller";
import { resolveFrontendOrigin } from "../utils/frontend-origin";

const router = Router();

router.route("/").get((req: Request, res: Response) => {
  res.json({ message: "Welcome to Emilist" });
});
//unprotected routes
router.route("/sign-up").post(validateRegisterUser, authController.registerUserController);
router.route("/login").post(validateLoginUser, authController.loginController);
router.route("/verify-email").post(validateVerifyEmail, authController.verifyEmailController);
router.route("/forgot-password").post(validateForgetPassword, authController.forgetPasswordController);
router.route("/verify-password-otp").post(validatePasswordOtp, authController.verifyPasswordOtpController);
router.route("/reset-password").post(validateResetPassword, authController.resetPasswordController);
router.route("/admin-triggered-password-reset").post(validateAdminTriggeredPasswordReset, authController.adminTriggeredPasswordResetController);
//file uploads
router.route("/upload-image").post(singleUpload, authController.uploadImage);
router.route("/upload-files").post(multipleUpload, authController.uploadMultipleFiles);

router.route("/resend-otp").post(authController.resendVerificationOtpController);
router.get('/google', (req, res, next) => {
  const frontendOrigin = resolveFrontendOrigin(
    req.query.origin || req.query.returnOrigin || req.get('origin'),
  );
  (req.session as typeof req.session & { oauthFrontendOrigin?: string }).oauthFrontendOrigin = frontendOrigin;

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  const oauthSession = req.session as typeof req.session & { oauthFrontendOrigin?: string };
  const frontendOrigin = resolveFrontendOrigin(oauthSession.oauthFrontendOrigin);

  passport.authenticate(
    'google',
    { session: false },
    (err, user) => {
      if (err || !user) {
        delete oauthSession.oauthFrontendOrigin;
        return res.redirect(`${frontendOrigin}/login`);
      }

      req.user = user;
      res.locals.oauthFrontendOrigin = frontendOrigin;
      delete oauthSession.oauthFrontendOrigin;
      next();
    }
  )(req, res, next);
}, authController.googleRedirectController);
router.route("/add-click").patch(optionalUserAuth, authController.countClicksController);
router.route("/subscribe-newsletter").post( authController.subscribeNewsLetterController);
router.route("/user-details/:userId").get( authController.getUserDetailsController);

//Protected routes
router.get("/log-out", userAuth, authController.logoutController);
router.post("/log-out", userAuth, authController.logoutController);
router.route("/update-profile").patch(userAuth,validateUpdateUser,singleUpload,authController.updateUserController);
router.route("/change-password").patch(userAuth,validateChangePassword, authController.changePasswordController);
router.route("/current-user").get(userAuth,authController.currentUserController);
router.route("/deactivate-user").patch(userAuth,authController.deactivateUserController);
router.route("/get-specific-user").get(userAuth,authController.findUserController);
router.route("/invite-user").get(userAuth,authController.inviteUserController);
router.route("/request-verificaton").get(userAuth,authController.requestVerificationController);
router.route("/insights").get(userAuth, authController.insightsController);
router.route("/update-account-details").patch(userAuth,validateUpdateAccountDetails, authController.updateAccountDetailsController);
router.route("/pay-for-verification").post(userAuth,validatePaymentForVerification , paymentController.payforVerificationController);
router.route("/delete-user/:userId").delete(userAuth,  authController.deleteUserController);
router.route("/get-profile-context").get(userAuth, authController.getProfileContext);
router.route("/add-profile").post(userAuth, singleUpload, authController.saveUserProfile);

export { router as AuthRoute };
