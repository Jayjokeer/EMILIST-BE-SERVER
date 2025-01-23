"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoute = void 0;
const express_1 = require("express");
const authController = __importStar(require("../controllers/auth.controller"));
const current_user_1 = require("../middlewares/current-user");
const image_upload_1 = require("../utils/image-upload");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
exports.AuthRoute = router;
router.route("/").get((req, res) => {
    res.json({ message: "Welcome to Emilist" });
});
//unprotected routes
router.route("/sign-up").post(authController.registerUserController);
router.route("/login").post(authController.loginController);
router.route("/verify-email").post(authController.verifyEmailController);
router.route("/forgot-password").post(authController.forgetPasswordController);
router.route("/reset-password").post(authController.resetPasswordController);
//file uploads
router.route("/upload-image").post(image_upload_1.singleUpload, authController.uploadImage);
router.route("/upload-files").post(image_upload_1.multipleUpload, authController.uploadMultipleFiles);
router.route("/resend-otp").post(authController.resendVerificationOtpController);
router.route('/google').get(passport_1.default.authenticate('google', {
    scope: ['profile', 'email'],
}));
router.route('/google/callback').get(passport_1.default.authenticate('google'), authController.googleRedirectController);
router.route("/add-click").patch(authController.countClicksController);
router.route("/subscribe-newsletter").post(authController.subscribeNewsLetterController);
router.route("/user-details/:userId").get(authController.getUserDetailsController);
//Protected routes
router.route("/log-out").get(current_user_1.userAuth, authController.logoutController);
router.route("/update-profile").patch(current_user_1.userAuth, image_upload_1.singleUpload, authController.updateUserController);
router.route("/change-password").patch(current_user_1.userAuth, authController.changePasswordController);
router.route("/current-user").get(current_user_1.userAuth, authController.currentUserController);
router.route("/deactivate-user").patch(current_user_1.userAuth, authController.deactivateUserController);
router.route("/get-specific-user").get(current_user_1.userAuth, authController.findUserController);
router.route("/invite-user").get(current_user_1.userAuth, authController.inviteUserController);
router.route("/request-verificaton").get(current_user_1.userAuth, authController.requestVerificationController);
router.route("/insights").get(current_user_1.userAuth, authController.insightsController);
