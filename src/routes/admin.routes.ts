import { Router, Request, Response } from "express";
import { adminAuth, superAdminAuth } from "../middlewares/current-user";
import * as adminController from "../controllers/admin.controller";
import {
  validateAddUserAdmin,
  validateAdminAuthenticator,
  validateAdminInvitationToken,
  validateAdminLogin,
  validateAdminMfaLogin,
  validateAdminMfaEnrollment,
  validateAdminPasswordSetup,
  validateAdminPasswordResetComplete,
  validateAdminPasswordResetMfa,
  validateAdminPasswordResetRequest,
  validateAdminCustomerMessage,
  validateCreateCustomer,
  validateCustomerReactivation,
  validateCustomerSuspension,
  validateCustomerWalletAdjustment,
  validateUpdateCustomerProfile,
  validateCreateAdminInvitation,
  validateAdminJobAction,
  validateUpdateSupportRequest,
  validateAdminMaterialDelist,
  validateAdminOrderReturn,
  validateAdminWithdrawalDecision,
  validateJobPaymentAdmin,
} from "../validations/admin.validation";
import { multipleUpload, singleUpload } from "../utils/image-upload";
import { validateJob } from "../validations/job.validation";
import * as walletController from "../controllers/wallet.controller";


const router = Router();

router.route("/dashboard").get(adminAuth, adminController.adminDashboardController);
router.route("/overview").get(adminAuth, adminController.adminOverviewController);
router.route("/jobs/summary").get(adminAuth, adminController.adminJobSummaryController);
router.route("/jobs").get(adminAuth, adminController.adminJobsController);
router.route("/jobs/:jobId/details").get(adminAuth, adminController.adminJobDetailsController);
router.route("/jobs/:jobId/applicants").get(adminAuth, adminController.adminJobApplicantsController);
router.route("/jobs/:jobId/invoices").get(adminAuth, adminController.adminJobInvoicesController);
router.route("/jobs/:jobId/invoices/:invoiceId/download").get(adminAuth, adminController.downloadAdminJobInvoiceController);
router.route("/jobs/:jobId/payments").get(adminAuth, adminController.adminJobPaymentsController);
router.route("/jobs/:jobId/payments/:paymentId/receipt").get(adminAuth, adminController.downloadAdminJobPaymentReceiptController);
router.route("/jobs/:jobId/actions").post(adminAuth, validateAdminJobAction, adminController.adminJobActionController);
router.route("/support-requests").get(adminAuth, adminController.supportRequestsController);
router.route("/support-requests/:requestId").get(adminAuth, adminController.supportRequestController);
router.route("/support-requests/:requestId").patch(adminAuth, validateUpdateSupportRequest, adminController.updateSupportRequestController);
router.route("/materials/summary").get(adminAuth, adminController.adminMaterialSummaryController);
router.route("/materials/products").get(adminAuth, adminController.adminMaterialsController);
router.route("/materials/products/:productId/details").get(adminAuth, adminController.adminMaterialDetailsController);
router.route("/materials/products/:productId/reviews").get(adminAuth, adminController.adminMaterialReviewsController);
router.route("/materials/products/:productId/orders").get(adminAuth, adminController.adminMaterialProductOrdersController);
router.route("/materials/products/:productId/delist").post(adminAuth, validateAdminMaterialDelist, adminController.delistAdminMaterialController);
router.route("/materials/orders").get(adminAuth, adminController.adminMaterialOrdersController);
router.route("/materials/orders/:orderId/details").get(adminAuth, adminController.adminMaterialOrderDetailsController);
router.route("/materials/orders/:orderId/returns").post(adminAuth, validateAdminOrderReturn, adminController.initiateAdminMaterialOrderReturnController);
router.route("/payments/summary").get(adminAuth, adminController.adminPaymentSummaryController);
router.route("/payments").get(adminAuth, adminController.adminPaymentsController);
router.route("/payments/withdrawals").get(adminAuth, adminController.adminWithdrawalsController);
router.route("/payments/withdrawals/:transactionId/approve").post(adminAuth, validateAdminWithdrawalDecision, adminController.approveAdminWithdrawalController);
router.route("/payments/withdrawals/:transactionId/decline").post(adminAuth, validateAdminWithdrawalDecision, adminController.declineAdminWithdrawalController);
router.route("/payments/:transactionId/details").get(adminAuth, adminController.adminPaymentDetailsController);
router.route("/payments/:transactionId/pdf").get(adminAuth, adminController.downloadAdminPaymentPdfController);
router.route("/users").get(adminAuth, adminController.fetchAllUsersAdminController);
router.route("/verify-user").patch(adminAuth, adminController.verifyUserAdminController);
router.route("/fetch-userDetails/:userId").get(adminAuth, adminController.fetchUserDetails);
router.route("/suspend-user/:userId").patch(adminAuth, adminController.suspendUserAdminController);
router.route("/add-user").post(adminAuth,validateAddUserAdmin, adminController.addUserAdminController);
router.route("/fetch-jobs").get(adminAuth, adminController.fetchJobsAdminController);
router.route("/fetch-job/:jobId").get(adminAuth, adminController.fetchSingleJobAdminController);
router.route("/create-job").post(adminAuth,multipleUpload,validateJob,adminController.createJobAdminController);
router.route("/fetch-all-materials").get(adminAuth,adminController.fetchAllMaterialsAdminController);
router.route("/fetch-material/:materialId").get(adminAuth,adminController.fetchSingleMaterialController);
router.route("/fetch-all-transactions").get(adminAuth,adminController.fetchAllTransactionsAdminController);
router.route("/fetch-transaction/:transactionId").get(adminAuth,adminController.fetchSingleTransactionAdminController);
router.route("/fetch-all-subscriptions").get(adminAuth,adminController.fetchSubscriptionsController);
router.route("/update-vat").patch(adminAuth, adminController.updateVatController);
router.route("/approve-withdrawal/:transactionId").patch(adminAuth, adminController.approveWithdrawalController);
router.route("/decline-withdrawal/:transactionId").patch(adminAuth, adminController.declineWithdrawalController);
router.route("/verify-bank-transfer").post(adminAuth,walletController.verifyBankTransferWalletFunding);
router.route("/fetch-private-experts").get(adminAuth,adminController.fetchAllPrivateExpertsController);
router.route("/fetch-private-expert/:id").get(adminAuth,adminController.fetchPrivateExpertByIdController);
router.route("/update-job-payment/:jobId").patch(adminAuth,validateJobPaymentAdmin, adminController.updateJobPaymentStatusController);
router.route("/add-category").post(adminAuth,adminController.addCategoriesController);
router.route("/fetch-category/:id").get(adminController.fetchSingleCategoryController);
router.route("/delete-category/:id").delete(adminAuth,adminController.deleteCategoryController);
router.route("/fetch-all-categories").get(adminController.fetchAllCategoriesController );
router.route("/fetch-user-account-details/:userId").get(adminAuth, adminController.fetchUserAccountDetailsController );
router.route("/fetch-user-subscriptions/:userId").get(adminAuth, adminController.fetchUserSubscriptionsController );
router.route("/fetch-all-verifications").get(adminAuth, adminController.fetchAllVerificationsController );
router.route("/create-admin").post(superAdminAuth, validateCreateAdminInvitation, adminController.createAdminController);
router.route("/onboarding/invitation/:token").get(adminController.inspectAdminInvitationController);
router.route("/onboarding/password").post(validateAdminPasswordSetup, adminController.setAdminOnboardingPasswordController);
router.route("/onboarding/authenticator/setup").post(validateAdminInvitationToken, adminController.getAdminAuthenticatorSetupController);
router.route("/onboarding/authenticator/activate").post(validateAdminAuthenticator, adminController.activateAdminAccountController);
router.route("/login").post(validateAdminLogin, adminController.loginAdminController);
router.route("/login/mfa").post(validateAdminMfaLogin, adminController.verifyAdminLoginMfaController);
router.route("/login/mfa/enroll").post(validateAdminMfaEnrollment, adminController.activateLegacyAdminMfaController);
router.route("/change-status-admin").patch(superAdminAuth,adminController.changeStatusAdmin);
router.route("/password-reset/request").post(validateAdminPasswordResetRequest, adminController.forgetPasswordController);
router.route("/password-reset/verify-authenticator").post(validateAdminPasswordResetMfa, adminController.verifyAdminPasswordResetMfaController);
router.route("/password-reset/complete").post(validateAdminPasswordResetComplete, adminController.resetPasswordController);
router.route("/password-reset/:token").get(adminController.inspectAdminPasswordResetController);
router.route("/forgot-password").patch(validateAdminPasswordResetRequest, adminController.forgetPasswordController);
router.route("/password-reset").patch(validateAdminPasswordResetComplete, adminController.resetPasswordController);
router.route("/fetch-admins").get(superAdminAuth,adminController.fetchAdminsController);
router.route("/customers/summary").get(adminAuth, adminController.customerSummaryController);
router.route("/customers").get(adminAuth, adminController.customersController);
router.route("/customers").post(adminAuth, singleUpload, validateCreateCustomer, adminController.createCustomerController);
router.route("/customers/:customerId/overview").get(adminAuth, adminController.customerOverviewController);
router.route("/customers/:customerId/details").get(adminAuth, adminController.customerDetailsController);
router.route("/customers/:customerId/services").get(adminAuth, adminController.customerServicesController);
router.route("/customers/:customerId/jobs").get(adminAuth, adminController.customerJobsController);
router.route("/customers/:customerId/listings").get(adminAuth, adminController.customerListingsController);
router.route("/customers/:customerId/orders").get(adminAuth, adminController.customerOrdersController);
router.route("/customers/:customerId/sales").get(adminAuth, adminController.customerSalesController);
router.route("/customers/:customerId/transactions").get(adminAuth, adminController.customerTransactionsController);
router.route("/customers/:customerId/subscriptions").get(adminAuth, adminController.customerSubscriptionsController);
router.route("/customers/:customerId/profile").patch(adminAuth, validateUpdateCustomerProfile, adminController.updateCustomerProfileController);
router.route("/customers/:customerId/messages").post(adminAuth, validateAdminCustomerMessage, adminController.sendCustomerMessageController);
router.route("/customers/:customerId/password-reset").post(adminAuth, adminController.triggerCustomerPasswordResetController);
router.route("/customers/:customerId/suspensions").post(adminAuth, validateCustomerSuspension, adminController.suspendCustomerController);
router.route("/customers/:customerId/reactivate").post(adminAuth, validateCustomerReactivation, adminController.reactivateCustomerController);
router.route("/customers/:customerId/wallet-adjustments").post(adminAuth, validateCustomerWalletAdjustment, adminController.adjustCustomerWalletController);
router.route("/customers/:customerId/audit-history").get(adminAuth, adminController.customerAuditHistoryController);


export { router as AdminRoute };
