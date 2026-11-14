type HttpMethod = 'get' | 'post' | 'patch' | 'put' | 'delete';

interface RouteDoc {
  path: string;
  method: HttpMethod;
  tag: string;
  summary: string;
  auth?: boolean;
  multipart?: boolean;
  bodyExample?: Record<string, unknown>;
  queryParams?: string[];
  successStatus?: string;
  responseExample?: unknown;
}

const id = '64e1a2b3c4d5e6f7a8b9c0d1';
const businessId = '64aa1b2c3d4e5f6a7b8c9ab';
const productId = '64bb1b2c3d4e5f6a7b8c9cd';

/**
 * Routes that were historically missing from the hand-written Swagger spec.
 * Keep this list in sync with src/routes. The larger Jobs/Wallet/Promo sections
 * remain hand-written in swagger.ts because they have richer, endpoint-specific
 * schemas and examples there.
 */
const routes: RouteDoc[] = [
  // Authentication and user profile
  { path: '/auth', method: 'get', tag: 'Auth', summary: 'API welcome message', auth: false },
  { path: '/auth/sign-up', method: 'post', tag: 'Auth', summary: 'Register a user', auth: false, bodyExample: { userName: 'jane', email: 'jane@example.com', password: 'Password123!' } },
  { path: '/auth/login', method: 'post', tag: 'Auth', summary: 'Log in', auth: false, bodyExample: { email: 'jane@example.com', password: 'Password123!' }, successStatus: '200' },
  { path: '/auth/verify-email', method: 'post', tag: 'Auth', summary: 'Verify email address', auth: false, bodyExample: { email: 'jane@example.com', otp: '123456' }, successStatus: '200' },
  { path: '/auth/forgot-password', method: 'post', tag: 'Auth', summary: 'Request password reset OTP', auth: false, bodyExample: { email: 'jane@example.com' }, successStatus: '200' },
  { path: '/auth/verify-password-otp', method: 'post', tag: 'Auth', summary: 'Verify password reset OTP', auth: false, bodyExample: { email: 'jane@example.com', otp: '123456' }, successStatus: '200' },
  { path: '/auth/reset-password', method: 'post', tag: 'Auth', summary: 'Reset password', auth: false, bodyExample: { email: 'jane@example.com', password: 'NewPassword123!', confirmPassword: 'NewPassword123!' }, successStatus: '200' },
  { path: '/auth/admin-triggered-password-reset', method: 'post', tag: 'new-admin', summary: 'Complete a customer password reset issued by an admin', auth: false, bodyExample: { token: 'ONE_TIME_ADMIN_TOKEN', password: 'NewPassword123!', confirmPassword: 'NewPassword123!' }, successStatus: '200' },
  { path: '/auth/upload-image', method: 'post', tag: 'Auth', summary: 'Upload one image', auth: false, multipart: true },
  { path: '/auth/upload-files', method: 'post', tag: 'Auth', summary: 'Upload multiple files', auth: false, multipart: true },
  { path: '/auth/resend-otp', method: 'post', tag: 'Auth', summary: 'Resend verification OTP', auth: false, bodyExample: { email: 'jane@example.com' }, successStatus: '200' },
  { path: '/auth/google', method: 'get', tag: 'Auth', summary: 'Start Google OAuth login', auth: false },
  { path: '/auth/google/callback', method: 'get', tag: 'Auth', summary: 'Google OAuth callback', auth: false },
  { path: '/auth/add-click', method: 'patch', tag: 'Auth', summary: 'Increment shared-link click count', auth: false },
  { path: '/auth/subscribe-newsletter', method: 'post', tag: 'Auth', summary: 'Subscribe to newsletter', auth: false, bodyExample: { email: 'jane@example.com' }, successStatus: '200' },
  { path: '/auth/user-details/{userId}', method: 'get', tag: 'Auth', summary: 'Fetch public user details', auth: false },
  { path: '/auth/log-out', method: 'get', tag: 'Auth', summary: 'Log out' },
  { path: '/auth/update-profile', method: 'patch', tag: 'Auth', summary: 'Update the authenticated user profile', multipart: true, bodyExample: { firstName: 'Jane', lastName: 'Doe', gender: 'female', countryCode: '+234', languages: ['English'], houseAddress: '12 Admiralty Way', mobile: '8012345678', city: 'Lagos', state: 'Lagos', country: 'Nigeria', bio: 'Experienced professional' } },
  { path: '/auth/change-password', method: 'patch', tag: 'Auth', summary: 'Change password', bodyExample: { oldPassword: 'Password123!', newPassword: 'NewPassword123!', confirmPassword: 'NewPassword123!' } },
  { path: '/auth/current-user', method: 'get', tag: 'Auth', summary: 'Fetch the authenticated user with completed profile and expert summaries' },
  { path: '/auth/deactivate-user', method: 'patch', tag: 'Auth', summary: 'Deactivate the authenticated user' },
  { path: '/auth/get-specific-user', method: 'get', tag: 'Auth', summary: 'Find a user', queryParams: ['identifier'] },
  { path: '/auth/invite-user', method: 'get', tag: 'Auth', summary: 'Invite a user', queryParams: ['email'] },
  { path: '/auth/request-verificaton', method: 'get', tag: 'Auth', summary: 'Request account verification' },
  { path: '/auth/insights', method: 'get', tag: 'Auth', summary: 'Fetch user insights' },
  { path: '/auth/update-account-details', method: 'patch', tag: 'Auth', summary: 'Update payout account details', bodyExample: { password: 'Password123!', number: '0123456789', bank: 'GTBank', holdersName: 'Jane Doe' } },
  { path: '/auth/pay-for-verification', method: 'post', tag: 'Auth', summary: 'Pay for account verification', bodyExample: { paymentMethod: 'Card', currency: 'NGN', redirectUrl: 'https://example.com/payment/callback' } },
  { path: '/auth/delete-user/{userId}', method: 'delete', tag: 'Auth', summary: 'Delete a user' },
  { path: '/auth/get-profile-context', method: 'get', tag: 'Auth', summary: 'Get profile onboarding context', queryParams: ['newBusiness'] },
  { path: '/auth/add-profile', method: 'post', tag: 'Auth', summary: 'Create or edit a user profile', multipart: true, bodyExample: { firstName: 'Jane', lastName: 'Doe', countryCode: '+234', mobile: '8012345678', languages: ['English', 'Yoruba'], houseAddress: '12 Admiralty Way', city: 'Lagos', state: 'Lagos', country: 'Nigeria', bio: 'Experienced professional' }, successStatus: '200' },
  { path: '/support/requests', method: 'post', tag: 'new-admin', summary: 'Submit a customer support request for the admin support workflow', bodyExample: { subject: 'Payment not reflected', description: 'My completed job payment is not visible in my wallet.', category: 'payment', priority: 'normal', linkedType: 'payment', linkedRecordId: id } },
  { path: '/support/requests/{requestId}/replies', method: 'post', tag: 'new-admin', summary: 'Reply to an owned support ticket with optional attachments', bodyExample: { message: 'The transfer reference is 123456.', attachments: [] } },

  // Business/expert profiles
  { path: '/business/register-business', method: 'post', tag: 'Business', summary: 'Register a business/expert profile', multipart: true },
  { path: '/business/update-business/{businessId}', method: 'patch', tag: 'Business', summary: 'Update a business profile', multipart: true },
  { path: '/business/fetch-single-business/{businessId}', method: 'get', tag: 'Business', summary: 'Fetch a business profile', auth: false, queryParams: ['userId'] },
  { path: '/business/fetch-user-business', method: 'get', tag: 'Business', summary: "Fetch all businesses belonging to the authenticated user" },
  { path: '/business/delete-business/{businessId}/image/{imageId}', method: 'delete', tag: 'Business', summary: 'Delete a business image' },
  { path: '/business/fetch-all-business', method: 'get', tag: 'Business', summary: 'Fetch all businesses', auth: false, queryParams: ['page', 'limit', 'search', 'userId'] },
  { path: '/business/delete-business/{businessId}', method: 'delete', tag: 'Business', summary: 'Delete a business' },
  { path: '/business/like-business/{businessId}', method: 'patch', tag: 'Business', summary: 'Like a business' },
  { path: '/business/unlike-business/{businessId}', method: 'patch', tag: 'Business', summary: 'Unlike a business' },
  { path: '/business/fetch-other-business-by-user/{userId}', method: 'get', tag: 'Business', summary: "Fetch all businesses belonging to a user", auth: false },
  { path: '/business/fetch-similar-business-by-user/{businessId}', method: 'get', tag: 'Business', summary: 'Fetch similar businesses', auth: false },
  { path: '/business/fetch-business-reviews/{businessId}', method: 'get', tag: 'Business', summary: 'Fetch business reviews', auth: false, queryParams: ['page', 'limit', 'sortBy'] },
  { path: '/business/mark-helpul-review/{reviewId}', method: 'patch', tag: 'Business', summary: 'Mark a business review as helpful', auth: false, bodyExample: { isHelpful: true } },
  { path: '/business/mute-business/{businessId}', method: 'patch', tag: 'Business', summary: 'Mute or unmute a business' },
  { path: '/business/delete-business-item/{businessId}/{itemId}/{itemType}', method: 'delete', tag: 'Business', summary: 'Delete a certification, membership, insurance, or service item' },

  // Cart
  { path: '/cart/add-to-cart', method: 'post', tag: 'Cart', summary: 'Add a product to cart', bodyExample: { productId, quantity: 1 } },
  { path: '/cart/reduce-quantity/{productId}', method: 'patch', tag: 'Cart', summary: 'Reduce cart item quantity' },
  { path: '/cart/increase-quantity/{productId}', method: 'patch', tag: 'Cart', summary: 'Increase cart item quantity' },
  { path: '/cart/remove-from-cart/{productId}', method: 'patch', tag: 'Cart', summary: 'Remove a product from cart' },
  { path: '/cart/clear', method: 'delete', tag: 'Cart', summary: 'Clear the cart' },
  { path: '/cart/get-cart-items', method: 'get', tag: 'Cart', summary: 'Fetch cart items' },

  // Chat and notifications
  { path: '/chat/send-message/{receiverId}', method: 'post', tag: 'Chat', summary: 'Send a message', bodyExample: { message: 'Hello, are you available?' } },
  { path: '/chat/fetch-message/{userId}', method: 'get', tag: 'Chat', summary: 'Fetch messages with a user', queryParams: ['page', 'limit'] },
  { path: '/chat/fetch-all-chat', method: 'get', tag: 'Chat', summary: 'Fetch all conversations', queryParams: ['page', 'limit'] },
  { path: '/notification/fetch-user-notification', method: 'get', tag: 'Notifications', summary: 'Fetch navigable user notifications', queryParams: ['page', 'limit'], responseExample: { message: 'success', data: { notifications: [{ _id: id, title: 'Job Application', message: 'Jane Doe applied to your job', type: 'job', level: 'info', resourceId: id, jobId: id, action: 'application_received', metadata: { jobId: id, applicationId: id }, target: { type: 'job', id, idField: 'jobId', action: 'application_received' }, isRead: false }], unreadCount: 1, totalPages: 1, currentPage: 1, totalNotifications: 1 } } },
  { path: '/notification/mark-as-read/{notificationId}', method: 'patch', tag: 'Notifications', summary: 'Mark a notification as read' },
  { path: '/notification/clear-notification/{notificationId}', method: 'delete', tag: 'Notifications', summary: 'Delete a notification' },

  // Products/materials
  { path: '/material/create-product', method: 'post', tag: 'Materials', summary: 'Create a product', multipart: true },
  { path: '/material/fetch-product/{productId}', method: 'get', tag: 'Materials', summary: 'Fetch a product', auth: false },
  { path: '/material/update-product/{productId}', method: 'patch', tag: 'Materials', summary: 'Update a product', multipart: true },
  { path: '/material/fetch-all-products', method: 'get', tag: 'Materials', summary: 'Fetch all products', auth: false, queryParams: ['page', 'limit', 'search', 'category'] },
  { path: '/material/delete-product/{productId}', method: 'delete', tag: 'Materials', summary: 'Delete a product' },
  { path: '/material/delete-product/{productId}/image/{imageId}', method: 'delete', tag: 'Materials', summary: 'Delete a product image' },
  { path: '/material/fetch-user-products', method: 'get', tag: 'Materials', summary: "Fetch the authenticated user's products", queryParams: ['page', 'limit'] },
  { path: '/material/like-product/{productId}', method: 'get', tag: 'Materials', summary: 'Like a product' },
  { path: '/material/unlike-product/{productId}', method: 'get', tag: 'Materials', summary: 'Unlike a product' },
  { path: '/material/fetch-liked-products', method: 'get', tag: 'Materials', summary: 'Fetch liked products', queryParams: ['page', 'limit'] },
  { path: '/material/add-review', method: 'post', tag: 'Materials', summary: 'Review a product', bodyExample: { productId, rating: 5, comment: 'Excellent product' } },
  { path: '/material/pay-for-product', method: 'post', tag: 'Materials', summary: 'Pay for products', bodyExample: { paymentMethod: 'Card', currency: 'NGN', redirectUrl: 'https://example.com/payment/callback' } },
  { path: '/material/add-product-discount/{productId}', method: 'patch', tag: 'Materials', summary: 'Add a product discount', bodyExample: { discount: 10 } },
  { path: '/material/fetch-similar-products/{productId}', method: 'get', tag: 'Materials', summary: 'Fetch similar products', auth: false },
  { path: '/material/fetch-other-products-by-user/{userId}', method: 'get', tag: 'Materials', summary: "Fetch a user's other products", auth: false },
  { path: '/material/fetch-product-reviews/{productId}', method: 'get', tag: 'Materials', summary: 'Fetch product reviews', auth: false, queryParams: ['page', 'limit', 'sortBy'] },
  { path: '/material/flag-product/{productId}', method: 'post', tag: 'Materials', summary: 'Flag a product', bodyExample: { reason: 'Misleading listing' }, successStatus: '200' },
  { path: '/material/unflag-product/{productId}', method: 'patch', tag: 'Materials', summary: 'Remove a product flag' },
  { path: '/material/review/{reviewId}/helpful', method: 'post', tag: 'Materials', summary: 'Toggle product review helpful status', successStatus: '200' },

  // Transactions not covered by the detailed transaction section
  { path: '/transaction/fetch-single-transaction/{transactionId}', method: 'get', tag: 'Transactions', summary: 'Fetch a transaction (admin)' },
  { path: '/transaction/fetch-all-transactions-by-status', method: 'get', tag: 'Transactions', summary: 'Fetch transactions by status (admin)', queryParams: ['status', 'page', 'limit'] },
  { path: '/transaction/verify-paystack-payment/{reference}', method: 'get', tag: 'Transactions', summary: 'Verify a Paystack payment', auth: false },
  { path: '/transaction/fetch-user-earning', method: 'get', tag: 'Transactions', summary: 'Fetch user earnings' },
  { path: '/transaction/fetch-vat', method: 'get', tag: 'Transactions', summary: 'Fetch the current VAT rate', auth: false },

  // Private expert, targets, and subscriptions
  { path: '/expert/create-private-expert', method: 'post', tag: 'Private Experts', summary: 'Create a private expert', auth: false, multipart: true },
  { path: '/target/create-target', method: 'post', tag: 'Targets', summary: 'Create a performance target', bodyExample: { name: 'Monthly revenue', target: 500000 } },
  { path: '/target/fetch-target-metrics', method: 'get', tag: 'Targets', summary: 'Fetch target metrics' },
  { path: '/subscription/get-user-subscription', method: 'get', tag: 'Subscriptions', summary: 'Fetch the active user subscription' },
  { path: '/subscription/get-all-user-subscriptions', method: 'get', tag: 'Subscriptions', summary: 'Fetch user subscription history' },
  { path: '/subscription/subscribe-plan', method: 'post', tag: 'Subscriptions', summary: 'Subscribe to a plan', bodyExample: { planId: id, paymentMethod: 'Card', currency: 'NGN', redirectUrl: 'https://example.com/payment/callback' } },
  { path: '/subscription/create-plan', method: 'post', tag: 'Subscriptions', summary: 'Create a subscription plan (admin)', bodyExample: { name: 'Premium', price: 10000, currency: 'NGN' } },
  { path: '/subscription/get-plans', method: 'get', tag: 'Subscriptions', summary: 'Fetch monthly or yearly subscription plans (defaults to monthly)', auth: false, queryParams: ['duration'] },
  { path: '/subscription/promote/{id}', method: 'post', tag: 'Subscriptions', summary: 'Promote a job or business', bodyExample: { type: 'job', duration: 7 } },

  // Orders
  { path: '/orders', method: 'get', tag: 'Orders', summary: 'Fetch my orders', queryParams: ['page', 'limit', 'status', 'search'] },
  { path: '/orders/bulk-cancel', method: 'post', tag: 'Orders', summary: 'Cancel multiple orders', bodyExample: { orderIds: [id], reason: 'No longer needed' }, successStatus: '200' },
  { path: '/orders/{id}', method: 'get', tag: 'Orders', summary: 'Fetch an order' },
  { path: '/orders/{id}/cancel', method: 'post', tag: 'Orders', summary: 'Cancel an order', bodyExample: { reason: 'No longer needed' }, successStatus: '200' },
  { path: '/orders/{id}/return', method: 'post', tag: 'Orders', summary: 'Request an order return', bodyExample: { reason: 'Item was damaged' }, successStatus: '200' },
  { path: '/orders/{id}/reorder', method: 'post', tag: 'Orders', summary: 'Reorder an order' },
  { path: '/orders/{id}/rate-merchant', method: 'post', tag: 'Orders', summary: 'Rate an order merchant', bodyExample: { rating: 5, comment: 'Excellent service' }, successStatus: '200' },
  { path: '/orders/{id}/track', method: 'get', tag: 'Orders', summary: 'Track an order' },

  // Administration
  { path: '/admin/dashboard', method: 'get', tag: 'Admin', summary: 'Fetch admin dashboard' },
  { path: '/admin/reports', method: 'get', tag: 'new-admin', summary: 'Fetch report charts for churn, acquisition, jobs, active users, material sales, and subscriptions', queryParams: ['startDate', 'endDate'] },
  { path: '/admin/reports/export', method: 'post', tag: 'new-admin', summary: 'Download a selected report as PDF, CSV, or Markdown', bodyExample: { report: 'job_success', startDate: '2026-10-01', endDate: '2026-10-31', format: 'pdf' }, successStatus: '200' },
  { path: '/admin/settings', method: 'get', tag: 'new-admin', summary: 'Fetch platform settings, plans, spotlight candidates, and admin role rows', queryParams: ['search'] },
  { path: '/admin/settings/platform', method: 'patch', tag: 'new-admin', summary: 'Update platform commission and deposit/withdrawal limits (super admin)', bodyExample: { platformCommissionPercent: 5, withdrawalCurrency: 'NGN', minimumWithdrawalAmount: 2000, maximumWithdrawalAmount: 5000000, minimumDepositAmount: 1000 } },
  { path: '/admin/settings/subscriptions', method: 'patch', tag: 'new-admin', summary: 'Update subscription prices and availability (super admin)', bodyExample: { plans: [{ name: 'Basic', price: 0, isActive: false }, { name: 'Silver', price: 24000, isActive: true }] } },
  { path: '/admin/settings/spotlight', method: 'put', tag: 'new-admin', summary: 'Publish the expert and merchant of the week (super admin)', bodyExample: { expertUserId: id, merchantUserId: id } },
  { path: '/admin/profile', method: 'get', tag: 'new-admin', summary: 'Fetch the signed-in admin profile and paginated activity log (defaults to the last 24 hours)', queryParams: ['page', 'limit', 'hours'] },
  { path: '/admin/profile', method: 'patch', tag: 'new-admin', summary: 'Update the signed-in admin profile', multipart: true, bodyExample: { fullName: 'Ayodeji Agboola E.', mobile: '+2348012345678', department: 'Product', jobTitle: 'Product Designer' } },
  { path: '/admin/users', method: 'get', tag: 'Admin', summary: 'Fetch users', queryParams: ['page', 'limit', 'search', 'status'] },
  { path: '/admin/verify-user', method: 'patch', tag: 'Admin', summary: 'Verify a user', bodyExample: { userId: id, isVerified: true } },
  { path: '/admin/fetch-userDetails/{userId}', method: 'get', tag: 'Admin', summary: 'Fetch user details' },
  { path: '/admin/suspend-user/{userId}', method: 'patch', tag: 'Admin', summary: 'Suspend or activate a user', bodyExample: { status: 'suspended' } },
  { path: '/admin/add-user', method: 'post', tag: 'Admin', summary: 'Create a user', bodyExample: { userName: 'jane', email: 'jane@example.com', password: 'Password123!' } },
  { path: '/admin/fetch-jobs', method: 'get', tag: 'Admin', summary: 'Fetch all jobs', queryParams: ['page', 'limit', 'search', 'status'] },
  { path: '/admin/fetch-job/{jobId}', method: 'get', tag: 'Admin', summary: 'Fetch a job' },
  { path: '/admin/create-job', method: 'post', tag: 'Admin', summary: 'Create a job', multipart: true },
  { path: '/admin/fetch-all-materials', method: 'get', tag: 'Admin', summary: 'Fetch all materials', queryParams: ['page', 'limit', 'search'] },
  { path: '/admin/fetch-material/{materialId}', method: 'get', tag: 'Admin', summary: 'Fetch a material' },
  { path: '/admin/fetch-all-transactions', method: 'get', tag: 'Admin', summary: 'Fetch all transactions', queryParams: ['page', 'limit', 'status'] },
  { path: '/admin/fetch-transaction/{transactionId}', method: 'get', tag: 'Admin', summary: 'Fetch a transaction' },
  { path: '/admin/fetch-all-subscriptions', method: 'get', tag: 'Admin', summary: 'Fetch all subscriptions', queryParams: ['page', 'limit'] },
  { path: '/admin/update-vat', method: 'patch', tag: 'Admin', summary: 'Update VAT', bodyExample: { vat: 7.5 } },
  { path: '/admin/verify-bank-transfer', method: 'post', tag: 'Admin', summary: 'Approve or decline bank-transfer wallet funding', bodyExample: { transactionId: id, status: 'Approved' }, successStatus: '200' },
  { path: '/admin/fetch-private-experts', method: 'get', tag: 'Admin', summary: 'Fetch private experts', queryParams: ['page', 'limit', 'search'] },
  { path: '/admin/fetch-private-expert/{id}', method: 'get', tag: 'Admin', summary: 'Fetch a private expert' },
  { path: '/admin/update-job-payment/{jobId}', method: 'patch', tag: 'Admin', summary: 'Update job payment status', bodyExample: { paymentStatus: 'paid' } },
  { path: '/admin/add-category', method: 'post', tag: 'Admin', summary: 'Create a category', bodyExample: { name: 'Plumbing' } },
  { path: '/admin/fetch-category/{id}', method: 'get', tag: 'Admin', summary: 'Fetch a category', auth: false },
  { path: '/admin/delete-category/{id}', method: 'delete', tag: 'Admin', summary: 'Delete a category' },
  { path: '/admin/fetch-all-categories', method: 'get', tag: 'Admin', summary: 'Fetch all categories', auth: false },
  { path: '/admin/fetch-user-account-details/{userId}', method: 'get', tag: 'Admin', summary: 'Fetch user account details' },
  { path: '/admin/fetch-user-subscriptions/{userId}', method: 'get', tag: 'Admin', summary: 'Fetch user subscriptions' },
  { path: '/admin/fetch-all-verifications', method: 'get', tag: 'Admin', summary: 'Fetch verification requests', queryParams: ['page', 'limit', 'status'] },
  { path: '/admin/create-admin', method: 'post', tag: 'new-admin', summary: 'Invite an administrator (super admin)', bodyExample: { firstName: 'Jane', lastName: 'Doe', email: 'jane@emilist.com', mobile: '+2348012345678', department: 'Operations', jobTitle: 'Growth Manager', role: 'admin' } },
  { path: '/admin/onboarding/invitation/{token}', method: 'get', tag: 'new-admin', summary: 'Inspect an admin invitation and determine the next onboarding step', auth: false },
  { path: '/admin/onboarding/password', method: 'post', tag: 'new-admin', summary: 'Create the invited admin password and begin authenticator setup', auth: false, bodyExample: { token: 'INVITATION_TOKEN', password: 'StrongPassword1!', confirmPassword: 'StrongPassword1!' }, successStatus: '200' },
  { path: '/admin/onboarding/authenticator/setup', method: 'post', tag: 'new-admin', summary: 'Resume authenticator enrollment for an accepted invitation', auth: false, bodyExample: { token: 'INVITATION_TOKEN' }, successStatus: '200' },
  { path: '/admin/onboarding/authenticator/activate', method: 'post', tag: 'new-admin', summary: 'Verify the authenticator code, activate the account, and sign in', auth: false, bodyExample: { token: 'INVITATION_TOKEN', code: '123456' }, successStatus: '200' },
  { path: '/admin/login', method: 'post', tag: 'new-admin', summary: 'Verify admin credentials and issue an MFA challenge', auth: false, bodyExample: { email: 'admin@example.com', password: 'Password123!' }, successStatus: '200' },
  { path: '/admin/login/mfa', method: 'post', tag: 'new-admin', summary: 'Complete admin sign-in with an authenticator code', auth: false, bodyExample: { challengeToken: 'SHORT_LIVED_CHALLENGE_TOKEN', code: '123456' }, successStatus: '200' },
  { path: '/admin/login/mfa/enroll', method: 'post', tag: 'new-admin', summary: 'Enroll a legacy admin in mandatory MFA and complete sign-in', auth: false, bodyExample: { enrollmentToken: 'SHORT_LIVED_ENROLLMENT_TOKEN', code: '123456' }, successStatus: '200' },
  { path: '/admin/change-status-admin', method: 'patch', tag: 'Admin', summary: 'Change administrator status (super admin)', bodyExample: { adminId: id, status: 'active' } },
  { path: '/admin/password-reset/request', method: 'post', tag: 'new-admin', summary: 'Email a one-time 30-minute admin password reset link', auth: false, bodyExample: { email: 'admin@example.com' }, successStatus: '200' },
  { path: '/admin/password-reset/{token}', method: 'get', tag: 'new-admin', summary: 'Inspect a password reset link and load safe admin context', auth: false },
  { path: '/admin/password-reset/verify-authenticator', method: 'post', tag: 'new-admin', summary: 'Verify MFA before allowing an admin password reset', auth: false, bodyExample: { token: 'ONE_TIME_EMAIL_TOKEN', code: '123456' }, successStatus: '200' },
  { path: '/admin/password-reset/complete', method: 'post', tag: 'new-admin', summary: 'Set a new non-reused admin password', auth: false, bodyExample: { authorizationToken: 'MFA_VERIFIED_TOKEN', password: 'NewPassword123!', confirmPassword: 'NewPassword123!' }, successStatus: '200' },
  { path: '/admin/forgot-password', method: 'patch', tag: 'new-admin', summary: 'Compatibility alias: email a one-time admin reset link', auth: false, bodyExample: { email: 'admin@example.com' } },
  { path: '/admin/password-reset', method: 'patch', tag: 'new-admin', summary: 'Compatibility alias: complete an MFA-authorized password reset', auth: false, bodyExample: { authorizationToken: 'MFA_VERIFIED_TOKEN', password: 'NewPassword123!', confirmPassword: 'NewPassword123!' } },
  { path: '/admin/fetch-admins', method: 'get', tag: 'Admin', summary: 'Fetch administrators (super admin)', queryParams: ['page', 'limit', 'search'] },
  { path: '/admin/overview', method: 'get', tag: 'new-admin', summary: 'Fetch the range-aware operational overview dashboard', queryParams: ['range'] },
  { path: '/admin/jobs/summary', method: 'get', tag: 'new-admin', summary: 'Fetch active, applicant, overdue, paused, and completed job totals' },
  { path: '/admin/jobs', method: 'get', tag: 'new-admin', summary: 'Search and filter the admin jobs table', queryParams: ['page', 'limit', 'search', 'status'] },
  { path: '/admin/jobs/{jobId}/details', method: 'get', tag: 'new-admin', summary: 'Fetch the admin Job Details tab including owner, expert, media, and milestones' },
  { path: '/admin/jobs/{jobId}/applicants', method: 'get', tag: 'new-admin', summary: 'Fetch applicants, expert profiles, ratings, and the hired application', queryParams: ['page', 'limit', 'status'] },
  { path: '/admin/jobs/{jobId}/invoices', method: 'get', tag: 'new-admin', summary: 'Fetch milestone and additional invoice cards and invoice totals' },
  { path: '/admin/jobs/{jobId}/invoices/{invoiceId}/download', method: 'get', tag: 'new-admin', summary: 'Download an admin-view job invoice as a PDF' },
  { path: '/admin/jobs/{jobId}/payments', method: 'get', tag: 'new-admin', summary: 'Fetch job payment rows, completed/upcoming values, and payment totals' },
  { path: '/admin/jobs/{jobId}/payments/{paymentId}/receipt', method: 'get', tag: 'new-admin', summary: 'Download or print a job payment receipt as a PDF' },
  { path: '/admin/jobs/{jobId}/actions', method: 'post', tag: 'new-admin', summary: 'Apply a state-valid audited job action', bodyExample: { action: 'pause', reason: 'Paused while reported work is reviewed' }, successStatus: '200' },
  { path: '/admin/support-requests/summary', method: 'get', tag: 'new-admin', summary: 'Fetch unassigned, high-priority, overdue, pending-customer, and average-resolution metrics' },
  { path: '/admin/support-requests/assignees', method: 'get', tag: 'new-admin', summary: 'Fetch active admins and support teams for assignment controls' },
  { path: '/admin/support-requests', method: 'get', tag: 'new-admin', summary: 'Search and filter support tickets by status, priority, category, assignee, and team', queryParams: ['page', 'limit', 'search', 'status', 'priority', 'category', 'assignedAdminId', 'team'] },
  { path: '/admin/support-requests/{requestId}', method: 'get', tag: 'new-admin', summary: 'Open ticket details, requester, linked record, conversation, attachments, private notes, and history' },
  { path: '/admin/support-requests/{requestId}/assignment', method: 'patch', tag: 'new-admin', summary: 'Assign or escalate a ticket to an admin/team and update its priority', bodyExample: { assignedAdminId: id, assignedTeam: 'Finance Team', priority: 'high' } },
  { path: '/admin/support-requests/{requestId}/replies', method: 'post', tag: 'new-admin', summary: 'Reply to the customer and attach optional uploaded files', bodyExample: { message: 'We checked the transfer and will update you shortly.', attachments: [] } },
  { path: '/admin/support-requests/{requestId}/notes', method: 'post', tag: 'new-admin', summary: 'Add a private note visible only to administrators', bodyExample: { content: 'Review previous wallet adjustments before responding.' } },
  { path: '/admin/support-requests/{requestId}/resolve', method: 'post', tag: 'new-admin', summary: 'Resolve a ticket with a required resolution summary', bodyExample: { resolution: 'The deposit was reconciled and credited to the customer wallet.' } },
  { path: '/admin/support-requests/{requestId}', method: 'patch', tag: 'new-admin', summary: 'Update ticket status, assignment, priority, or resolution', bodyExample: { status: 'pending_customer', note: 'Waiting for the customer to provide a transfer reference.' } },
  { path: '/admin/materials/summary', method: 'get', tag: 'new-admin', summary: 'Fetch material summary cards with current-versus-previous-period changes', queryParams: ['range'] },
  { path: '/admin/materials/products', method: 'get', tag: 'new-admin', summary: 'Search and filter the admin Product Catalog table', queryParams: ['page', 'limit', 'search', 'status', 'category', 'merchantId'] },
  { path: '/admin/materials/products/{productId}/details', method: 'get', tag: 'new-admin', summary: 'Fetch material listing, stock, merchant, product ratings, and recent comments', queryParams: ['page', 'limit', 'search'] },
  { path: '/admin/materials/products/{productId}/reviews', method: 'get', tag: 'new-admin', summary: 'Fetch searchable product reviews, rating distribution, and merchant rating', queryParams: ['page', 'limit', 'search'] },
  { path: '/admin/materials/products/{productId}/orders', method: 'get', tag: 'new-admin', summary: 'Fetch orders containing a specific material listing', queryParams: ['page', 'limit', 'search', 'deliveryStatus', 'paymentStatus'] },
  { path: '/admin/materials/products/{productId}/delist', method: 'post', tag: 'new-admin', summary: 'Remove a material listing from the marketplace with an audited reason', bodyExample: { reason: 'Listing information requires merchant correction' }, successStatus: '200' },
  { path: '/admin/materials/orders', method: 'get', tag: 'new-admin', summary: 'Search and filter the admin material Orders table', queryParams: ['page', 'limit', 'search', 'deliveryStatus', 'paymentStatus'] },
  { path: '/admin/materials/orders/{orderId}/details', method: 'get', tag: 'new-admin', summary: 'Fetch order, selected product, buyer, merchant, delivery, and review details', queryParams: ['productId', 'page', 'limit', 'search'] },
  { path: '/admin/materials/orders/{orderId}/returns', method: 'post', tag: 'new-admin', summary: 'Initiate an audited order return with stock restoration and applicable refund', bodyExample: { reason: 'Buyer reported that delivered goods did not match the order' }, successStatus: '200' },
  { path: '/admin/payments/summary', method: 'get', tag: 'new-admin', summary: 'Fetch escrow, user balance, withdrawal, failure, and gross-volume cards', queryParams: ['range', 'currency'] },
  { path: '/admin/payments', method: 'get', tag: 'new-admin', summary: 'Search and filter the normalized admin transaction table', queryParams: ['page', 'limit', 'search', 'status', 'type', 'paymentMethod', 'serviceType', 'currency', 'startDate', 'endDate'] },
  { path: '/admin/payments/withdrawals', method: 'get', tag: 'new-admin', summary: 'Fetch and filter withdrawal requests', queryParams: ['page', 'limit', 'search', 'status', 'currency', 'startDate', 'endDate'] },
  { path: '/admin/payments/withdrawals/{transactionId}/approve', method: 'post', tag: 'new-admin', summary: 'Approve a pending withdrawal and initiate its Paystack transfer', bodyExample: { reason: 'Payout details and available balance verified' }, successStatus: '200' },
  { path: '/admin/payments/withdrawals/{transactionId}/decline', method: 'post', tag: 'new-admin', summary: 'Decline a pending withdrawal and release held funds', bodyExample: { reason: 'Payout account could not be verified' }, successStatus: '200' },
  { path: '/admin/payments/{transactionId}/details', method: 'get', tag: 'new-admin', summary: 'Fetch normalized transaction details and linked records' },
  { path: '/admin/payments/{transactionId}/pdf', method: 'get', tag: 'new-admin', summary: 'Download the transaction receipt as a PDF' },
  { path: '/admin/customers/summary', method: 'get', tag: 'new-admin', summary: 'Fetch customer totals for active, KYC-pending, inactive, expert, and merchant cards' },
  { path: '/admin/customers', method: 'get', tag: 'new-admin', summary: 'Search and filter the customer table', queryParams: ['page', 'limit', 'search', 'status', 'kyc', 'type', 'profileComplete'] },
  { path: '/admin/customers', method: 'post', tag: 'new-admin', summary: 'Create a customer profile manually and email a password setup link', multipart: true, bodyExample: { userName: 'tkwills75', email: 'tokunbo@example.com', firstName: 'Tokunbo', lastName: 'Williams', countryCode: '+234', mobile: '8012345678', languages: ['English'], houseAddress: '7 Funds Street', city: 'Surulere', state: 'Lagos State', country: 'Nigeria', bio: 'Project manager' } },
  { path: '/admin/customers/{customerId}/overview', method: 'get', tag: 'new-admin', summary: 'Fetch customer header, rating, tags, wallets, and balance change' },
  { path: '/admin/customers/{customerId}/details', method: 'get', tag: 'new-admin', summary: 'Fetch the User Details tab' },
  { path: '/admin/customers/{customerId}/services', method: 'get', tag: 'new-admin', summary: 'Fetch service profiles, credentials, images, and service metrics' },
  { path: '/admin/customers/{customerId}/jobs', method: 'get', tag: 'new-admin', summary: 'Fetch jobs owned by or applied to by the customer', queryParams: ['page', 'limit', 'search', 'status'] },
  { path: '/admin/customers/{customerId}/listings', method: 'get', tag: 'new-admin', summary: "Fetch the customer's marketplace listings", queryParams: ['page', 'limit', 'search', 'status'] },
  { path: '/admin/customers/{customerId}/orders', method: 'get', tag: 'new-admin', summary: 'Fetch orders placed by the customer', queryParams: ['page', 'limit', 'status'] },
  { path: '/admin/customers/{customerId}/sales', method: 'get', tag: 'new-admin', summary: 'Fetch product sales where the customer is the merchant', queryParams: ['page', 'limit', 'search', 'status'] },
  { path: '/admin/customers/{customerId}/transactions', method: 'get', tag: 'new-admin', summary: 'Fetch normalized customer inflow and outflow transactions', queryParams: ['page', 'limit', 'search', 'status', 'type'] },
  { path: '/admin/customers/{customerId}/subscriptions', method: 'get', tag: 'new-admin', summary: 'Fetch current/history subscriptions, available plans, and receipts', queryParams: ['page', 'limit'] },
  { path: '/admin/customers/{customerId}/profile', method: 'patch', tag: 'new-admin', summary: 'Edit permitted customer contact and address fields', bodyExample: { countryCode: '+234', mobile: '8012345678', languages: ['English'], houseAddress: '7 Funds Street', city: 'Surulere', state: 'Lagos State', country: 'Nigeria' } },
  { path: '/admin/customers/{customerId}/messages', method: 'post', tag: 'new-admin', summary: 'Send an in-app notification and email to a customer', bodyExample: { subject: 'Account update', message: 'Please review your account information.' } },
  { path: '/admin/customers/{customerId}/password-reset', method: 'post', tag: 'new-admin', summary: 'Email a one-time 30-minute password reset link to a customer', successStatus: '200' },
  { path: '/admin/customers/{customerId}/suspensions', method: 'post', tag: 'new-admin', summary: 'Suspend a customer with type, approved reason, and context', bodyExample: { type: 'temporary', reason: 'Policy Violation', context: 'Supporting context', expiresAt: '2026-12-01T00:00:00.000Z' }, successStatus: '200' },
  { path: '/admin/customers/{customerId}/reactivate', method: 'post', tag: 'new-admin', summary: 'Reactivate a suspended customer with a reason', bodyExample: { reason: 'Review completed and access restored' }, successStatus: '200' },
  { path: '/admin/customers/{customerId}/wallet-adjustments', method: 'post', tag: 'new-admin', summary: 'Credit or debit a wallet idempotently with an audit reason', bodyExample: { direction: 'credit', amount: 9000, currency: 'NGN', reason: 'Approved account correction', idempotencyKey: 'frontend-generated-uuid' }, successStatus: '200' },
  { path: '/admin/customers/{customerId}/audit-history', method: 'get', tag: 'new-admin', summary: 'Fetch customer admin action history', queryParams: ['page', 'limit'] },
];

const operationFor = (route: RouteDoc): Record<string, unknown> => {
  const parameters: Record<string, unknown>[] = [];
  for (const match of route.path.matchAll(/\{([^}]+)\}/g)) {
    parameters.push({
      name: match[1],
      in: 'path',
      required: true,
      schema: { type: 'string' },
    });
  }
  for (const name of route.queryParams ?? []) {
    parameters.push({ name, in: 'query', required: false, schema: { type: 'string' } });
  }

  const acceptsBody = route.method === 'post' || route.method === 'patch' || route.method === 'put';
  const operation: Record<string, unknown> = {
    tags: [route.tag],
    summary: route.summary,
    security: route.auth === false ? [] : [{ bearerAuth: [] }],
    ...(parameters.length > 0 ? { parameters } : {}),
    responses: {
      [route.successStatus ?? (route.method === 'post' ? '201' : '200')]: {
        description: 'Successful response',
        ...(route.responseExample ? { content: { 'application/json': { example: route.responseExample } } } : {}),
      },
      ...(route.auth === false ? {} : { '401': { description: 'Unauthorized' } }),
    },
  };

  if (acceptsBody) {
    const contentType = route.multipart ? 'multipart/form-data' : 'application/json';
    operation.requestBody = {
      required: false,
      content: {
        [contentType]: {
          schema: { type: 'object', additionalProperties: true },
          ...(route.bodyExample ? { example: route.bodyExample } : {}),
        },
      },
    };
  }

  return operation;
};

export const additionalSwaggerPaths = routes.reduce<Record<string, Record<string, unknown>>>((paths, route) => {
  paths[route.path] ??= {};
  paths[route.path][route.method] = operationFor(route);
  return paths;
}, {});

