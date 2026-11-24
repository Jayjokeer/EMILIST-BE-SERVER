type HttpMethod = 'get' | 'post' | 'patch' | 'put' | 'delete';

interface RouteDoc {
  path: string;
  method: HttpMethod;
  tag: string;
  summary: string;
  description?: string;
  auth?: boolean;
  multipart?: boolean;
  multipartFileField?: string;
  multipartFileMaxCount?: number;
  bodyExample?: Record<string, unknown>;
  bodyProperties?: Record<string, unknown>;
  requiredBodyFields?: string[];
  queryParams?: string[];
  successStatus?: string;
  responseExample?: unknown;
}

const id = '64e1a2b3c4d5e6f7a8b9c0d1';
const businessId = '64aa1b2c3d4e5f6a7b8c9ab';
const productId = '64bb1b2c3d4e5f6a7b8c9cd';

const querySchema = (name: string) => {
  if (['page', 'limit', 'hours', 'year', 'month'].includes(name)) {
    return { type: 'integer', minimum: name === 'page' || name === 'limit' ? 1 : undefined };
  }
  if (/^(?:startDate|endDate|date)$/i.test(name)) return { type: 'string', format: 'date' };
  if (/Id$/.test(name)) return { type: 'string', pattern: '^[a-fA-F0-9]{24}$' };
  return { type: 'string' };
};

const operationIdFor = (route: RouteDoc) => `${route.method}_${route.path}`
  .replace(/[{}]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '_')
  .replace(/^_|_$/g, '');

/**
 * Routes that were historically missing from the hand-written Swagger spec.
 * Keep this list in sync with src/routes. The larger Jobs/Wallet/Promo sections
 * remain hand-written in swagger.ts because they have richer, endpoint-specific
 * schemas and examples there.
 */
const routes: RouteDoc[] = [
  // Authentication and user profile
  { path: '/auth', method: 'get', tag: 'Auth', summary: 'API welcome message', auth: false },
  { path: '/auth/sign-up', method: 'post', tag: 'Auth', summary: 'Register a user', description: 'Registers a user. referralCode is optional and attributes a QR/referral-link registration to the inviter whose uniqueId matches the code.', auth: false, bodyExample: { email: 'jane@example.com', password: 'Password123!', referralCode: 'Toks13356' } },
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
  { path: '/support/requests', method: 'post', tag: 'new-admin', summary: 'Submit a customer support request with optional uploaded image attachments', description: 'Send multipart/form-data. Add each JPG, PNG, or WEBP image under the attachments field; do not send attachment URLs. Up to 10 images of 10 MB each are accepted.', multipart: true, multipartFileField: 'attachments', multipartFileMaxCount: 10, requiredBodyFields: ['subject', 'description'], bodyProperties: { subject: { type: 'string', minLength: 3, maxLength: 150 }, description: { type: 'string', minLength: 3, maxLength: 5000 }, category: { type: 'string' }, priority: { type: 'string' }, linkedType: { type: 'string', enum: ['job', 'customer', 'listing', 'payment', 'order'] }, linkedRecordId: { type: 'string' } }, bodyExample: { subject: 'Payment not reflected', description: 'My completed job payment is not visible in my wallet.', category: 'payment', priority: 'normal', linkedType: 'payment', linkedRecordId: id } },
  { path: '/support/requests', method: 'get', tag: 'Support', summary: 'List the authenticated user support tickets', queryParams: ['page', 'limit', 'status', 'category'] },
  { path: '/support/requests/{requestId}', method: 'get', tag: 'Support', summary: 'Fetch an owned support ticket and its conversation' },
  { path: '/support/requests/{requestId}/replies', method: 'post', tag: 'new-admin', summary: 'Reply to an owned support ticket with optional uploaded image attachments', multipart: true, multipartFileField: 'attachments', multipartFileMaxCount: 10, requiredBodyFields: ['message'], bodyProperties: { message: { type: 'string', maxLength: 5000 } }, bodyExample: { message: 'Here is another photo showing the unfinished work.' } },
  { path: '/support/job-invoice-disputes', method: 'post', tag: 'Support', summary: 'Raise a support dispute with uploaded image evidence for a job milestone invoice', description: 'The job owner may use owner_unsatisfied_work or owner_additional_cost_reason. The accepted artisan may use artisan_additional_cost_unpaid after the original amount was paid without the additional amount, or artisan_invoice_unpaid_overdue after the invoice remains unpaid for 7 days. Open disputes prevent contract closure.', multipart: true, multipartFileField: 'attachments', multipartFileMaxCount: 10, requiredBodyFields: ['jobId', 'milestoneId', 'disputeType', 'reason'], bodyProperties: { jobId: { type: 'string' }, milestoneId: { type: 'string' }, invoiceId: { type: 'string' }, subject: { type: 'string', maxLength: 150 }, reason: { type: 'string', minLength: 10, maxLength: 5000 }, disputeType: { type: 'string', enum: ['owner_unsatisfied_work', 'owner_additional_cost_reason', 'artisan_additional_cost_unpaid', 'artisan_invoice_unpaid_overdue'] } }, bodyExample: { jobId: id, milestoneId: id, invoiceId: id, disputeType: 'owner_unsatisfied_work', subject: 'Work does not meet the agreed requirements', reason: 'The completed work does not match the agreed milestone requirements.' } },
  { path: '/jobs/{jobId}/review-owner', method: 'post', tag: 'Jobs', summary: 'Allow the accepted artisan to review the job owner after contract closure', description: 'Only the accepted artisan may submit one review per job. A successful response includes hasReviewedJobOwner=true and canReviewJobOwner=false. GET /jobs/fetch-job-by-id returns the same flags plus jobOwnerReview so the frontend can hide or disable the review action before submission.', bodyExample: { rating: 5, comment: 'Clear requirements and prompt communication.', rateCommunication: 5, isRecommendOwner: true } },

  // Business/expert profiles
  { path: '/business/register-business', method: 'post', tag: 'Business', summary: 'Register a business/expert profile', multipart: true },
  { path: '/business/update-business/{businessId}', method: 'patch', tag: 'Business', summary: 'Update a business profile', multipart: true },
  { path: '/business/fetch-single-business/{businessId}', method: 'get', tag: 'Business', summary: 'Fetch a business profile with at most the three newest enriched reviews', auth: false, queryParams: ['userId'] },
  { path: '/business/fetch-user-business', method: 'get', tag: 'Business', summary: "Fetch all businesses belonging to the authenticated user" },
  { path: '/business/delete-business/{businessId}/image/{imageId}', method: 'delete', tag: 'Business', summary: 'Delete a business image' },
  { path: '/business/fetch-all-business', method: 'get', tag: 'Business', summary: 'Fetch all businesses', auth: false, queryParams: ['page', 'limit', 'search', 'userId'] },
  { path: '/business/delete-business/{businessId}', method: 'delete', tag: 'Business', summary: 'Delete a business' },
  { path: '/business/like-business/{businessId}', method: 'patch', tag: 'Business', summary: 'Like a business' },
  { path: '/business/unlike-business/{businessId}', method: 'patch', tag: 'Business', summary: 'Unlike a business' },
  { path: '/business/fetch-other-business-by-user/{userId}', method: 'get', tag: 'Business', summary: "Fetch all businesses belonging to a user", auth: false },
  { path: '/business/fetch-similar-business-by-user/{businessId}', method: 'get', tag: 'Business', summary: 'Fetch similar businesses', auth: false },
  { path: '/business/fetch-business-reviews/{businessId}', method: 'get', tag: 'Business', summary: 'Fetch paginated enriched business reviews (compatibility route)', auth: false, queryParams: ['page', 'limit', 'sortBy'] },
  { path: '/business/{businessId}/reviews', method: 'get', tag: 'Business', summary: 'Fetch all enriched reviews for a business with pagination and rating statistics', auth: false, queryParams: ['page', 'limit', 'sortBy'] },
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
  {
    path: '/chat/send-message/{receiverId}',
    method: 'post',
    tag: 'Chat',
    summary: 'Send a text, image, file, or audio message',
    description: 'Accepts multipart/form-data. Supply `content`, one or more `attachments`, or both. Attachments support images, PDF/documents/spreadsheets/text files, and browser audio recordings. Existing JSON clients may continue sending `{ "content": "..." }` when no attachment is required.',
    multipart: true,
    multipartFileField: 'attachments',
    multipartFileMaxCount: 10,
    bodyProperties: { content: { type: 'string', maxLength: 5000 } },
    bodyExample: { content: 'Hello, are you available?' },
    responseExample: { message: 'success', data: { _id: id, senderId: id, receiverId: id, chatId: id, content: 'Hello, are you available?', attachments: [], readAt: null, createdAt: '2026-11-17T10:00:00.000Z' } },
  },
  {
    path: '/chat/fetch-message/{userId}',
    method: 'get',
    tag: 'Chat',
    summary: 'Fetch paginated messages with another user',
    description: 'Messages are returned oldest-to-newest within each page. Page 1 contains the newest page of messages so older history can be prepended when subsequent pages are loaded.',
    queryParams: ['page', 'limit'],
    responseExample: { message: 'success', data: { chatId: id, participant: { _id: id, firstName: 'Jane', lastName: 'Doe', fullName: 'Jane Doe', userName: 'jane', displayImage: 'https://example.com/jane.jpg' }, messages: [], currentPage: 1, totalPages: 1, totalMessages: 0, limit: 20 } },
  },
  {
    path: '/chat/fetch-all-chat',
    method: 'get',
    tag: 'Chat',
    summary: 'Fetch the searchable, paginated inbox',
    queryParams: ['page', 'limit', 'search'],
    responseExample: { message: 'success', data: { conversations: [{ chatId: id, participant: { _id: id, fullName: 'Jane Doe', displayImage: 'https://example.com/jane.jpg' }, participants: [], lastMessage: { _id: id, content: 'Hello', readAt: null }, unreadCount: 1 }], unreadCount: 1, currentPage: 1, totalPages: 1, totalConversations: 1, limit: 20 } },
  },
  {
    path: '/chat/chats/{chatId}/read',
    method: 'patch',
    tag: 'Chat',
    summary: 'Mark all received messages in a conversation as read',
    description: 'Marks unread messages addressed to the authenticated user and emits the `messagesRead` Socket.IO event to the sender.',
    responseExample: { message: 'success', data: { chatId: id, markedCount: 2, messageIds: [id], readAt: '2026-11-17T10:05:00.000Z' } },
  },
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
  { path: '/transaction/verify-paystack-payment/{reference}', method: 'get', tag: 'Transactions', summary: 'Verify or reconcile a Paystack payment after redirect', auth: false },
  { path: '/transaction/fetch-user-earning', method: 'get', tag: 'Transactions', summary: 'Fetch user earnings' },
  { path: '/transaction/fetch-vat', method: 'get', tag: 'Transactions', summary: 'Fetch the current VAT rate', auth: false },

  // User Reports and Insights
  {
    path: '/reports',
    method: 'get',
    tag: 'Reports',
    summary: 'Fetch the complete user Reports and Insights dashboard',
    description: 'Returns Jobs, Applications, Finance, Trade, Insights, promotion duration, click tracking, and target progress for one validated date range and currency. Use year/month, a named range, or startDate/endDate.',
    queryParams: ['year', 'month', 'range', 'startDate', 'endDate', 'currency'],
    responseExample: { message: 'success', data: { filters: { year: 2026, month: 4, range: 'month', currency: 'NGN', label: '1 Apr 2026 - 30 Apr 2026' }, jobs: { total: 13, active: 8, pending: 3, completed: 2, overdue: 0 }, applications: { applicants: { total: 800, hired: 3, rehired: 2, flagged: 0 }, myApplications: { total: 10, hired: 2, rehired: 1, flagged: 0 } }, finance: { currency: 'NGN', earnings: { total: 150000, categories: { jobs: 85000, materials: 35000, referrals: 30000, others: 0 } }, expenses: { total: 150000, categories: { jobs: 85000, materials: 35000, promotions: 30000, others: 0 } } }, trade: { orders: { total: 19, completed: 14, pending: 2, cancelled: 2, returned: 1 }, sales: { total: 49, completed: 40, ongoing: 5, cancelled: 2, returned: 2 } }, insights: { overview: { impressions: 8, reach: 8, saves: 3, shares: 2, clicks: 8, contacts: 2 }, promotionDuration: { totalDays: 30, daysRemaining: 7 }, targets: { configured: true, progress: { overall: 18 } } } } },
  },
  { path: '/reports/export', method: 'get', tag: 'Reports', summary: 'Download the filtered user report as CSV', description: 'Uses the same year, month, range, startDate, endDate and currency filters as GET /reports and streams a UTF-8 CSV attachment.', queryParams: ['year', 'month', 'range', 'startDate', 'endDate', 'currency'] },
  { path: '/reports/targets', method: 'get', tag: 'Reports', summary: 'Fetch target goals, actual values, and progress', queryParams: ['year', 'month', 'range', 'startDate', 'endDate', 'currency'] },
  { path: '/reports/targets', method: 'put', tag: 'Reports', summary: 'Create or update a monthly or yearly report target', description: 'Upserts the target for the authenticated user, duration, period, and currency so editing does not create duplicates.', bodyExample: { duration: 'monthly', year: 2026, month: 4, currency: 'NGN', job: 2, amount: 150000, referrals: 15, invites: 24 }, successStatus: '200' },
  { path: '/reports/events', method: 'post', tag: 'Reports', summary: 'Record a report impression, click, share, or contact action', description: 'Publicly callable with optional bearer auth. For job, material, and business resources, ownership is resolved server-side from resourceId. For profile events, subjectUserId is required.', auth: false, bodyExample: { type: 'impression', resourceType: 'job', resourceId: id } },

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
  { path: '/orders/sales', method: 'get', tag: 'Orders', summary: "Fetch the authenticated seller's material sales", description: 'Returns one row per seller-owned product line, even when an order contains products from multiple merchants. Each row includes the immutable product snapshot, buyer contact details, delivery address, line pricing, tracking timeline, latest step, and allowedDeliveryStatusUpdates. Use pagination.total for the Sales heading and allowedDeliveryStatusUpdates to decide whether to show the dispatch button.', queryParams: ['page', 'limit', 'sortBy', 'status', 'paymentStatus', 'search'], responseExample: { message: 'success', data: { sales: [{ saleId: id, orderId: id, orderNumber: id, orderDate: '2026-02-17T10:00:00.000Z', quantity: 15, quantityMetric: 'bags', paymentStatus: 'paid', deliveryStatus: 'outForDelivery', deliveryDate: '2026-02-19T00:00:00.000Z', deliveredAt: null, deliveryAddress: '12 Sample Close, Yaba, Lagos', product: { id: productId, name: 'Cement', brand: 'Dangote', category: 'Building Materials', thumbnail: 'https://example.com/cement.jpg', unitPrice: 9000 }, pricing: { currency: 'NGN', subtotalAmount: 135000, discountAmount: 0, taxAmount: 0, totalAmount: 135000 }, buyer: { id, name: 'Ada Okafor', email: 'ada.okafor@example.com', phone: '+2348012345678', image: null }, latestStep: { status: 'outForDelivery', label: 'Out for delivery', isCompleted: true, isCurrent: true, activatedAt: '2026-02-18T09:00:00.000Z', updatedBy: 'seller' }, orderSteps: [{ status: 'orderConfirmed', label: 'Order confirmed', responsibleParty: 'system', isCompleted: true, isCurrent: false, activatedAt: '2026-02-17T10:00:00.000Z' }, { status: 'outForDelivery', label: 'Out for delivery', responsibleParty: 'seller', isCompleted: true, isCurrent: true, activatedAt: '2026-02-18T09:00:00.000Z' }, { status: 'delivered', label: 'Delivered', responsibleParty: 'buyer', isCompleted: false, isCurrent: false }], allowedDeliveryStatusUpdates: [] }], pagination: { total: 1, currentPage: 1, pageSize: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false }, filters: { sortBy: 'latest', status: null, paymentStatus: null, search: null } } } },
  { path: '/orders/bulk-cancel', method: 'post', tag: 'Orders', summary: 'Cancel multiple orders', bodyExample: { orderIds: [id], reason: 'No longer needed' }, successStatus: '200' },
  { path: '/orders/{id}', method: 'get', tag: 'Orders', summary: 'Fetch an order with its complete delivery timeline', description: 'Available to the buyer and sellers whose materials are included in the order. orderSteps always contains the standard steps. Reached steps include activatedAt; future steps intentionally omit it. allowedDeliveryStatusUpdates tells the current frontend user which transition button to display.', responseExample: { message: 'success', data: { _id: id, viewerRole: 'buyer', deliveryStatus: 'outForDelivery', paymentStatus: 'paid', allowedDeliveryStatusUpdates: ['delivered'], orderSteps: [{ status: 'orderConfirmed', label: 'Order confirmed', responsibleParty: 'system', isCompleted: true, isCurrent: false, activatedAt: '2026-11-20T09:00:00.000Z', updatedBy: 'system' }, { status: 'outForDelivery', label: 'Out for delivery', responsibleParty: 'seller', isCompleted: true, isCurrent: true, activatedAt: '2026-11-20T12:00:00.000Z', updatedBy: 'seller' }, { status: 'delivered', label: 'Delivered', responsibleParty: 'buyer', isCompleted: false, isCurrent: false }] } } },
  { path: '/orders/{id}/status', method: 'patch', tag: 'Orders', summary: 'Advance an order to the next delivery step', description: 'The seller can move a paid order from orderConfirmed to outForDelivery. The buyer moves it from outForDelivery to delivered and may then acknowledge receipt by moving delivered to received. Every accepted transition records its time and actor in orderSteps.', requiredBodyFields: ['status'], bodyProperties: { status: { type: 'string', enum: ['outForDelivery', 'delivered', 'received'] }, note: { type: 'string', maxLength: 500 } }, bodyExample: { status: 'outForDelivery', note: 'Package handed to the courier' }, successStatus: '200', responseExample: { message: 'success', data: { _id: id, viewerRole: 'seller', deliveryStatus: 'outForDelivery', allowedDeliveryStatusUpdates: [], orderSteps: [{ status: 'orderConfirmed', label: 'Order confirmed', responsibleParty: 'system', isCompleted: true, isCurrent: false, activatedAt: '2026-11-20T09:00:00.000Z' }, { status: 'outForDelivery', label: 'Out for delivery', responsibleParty: 'seller', isCompleted: true, isCurrent: true, activatedAt: '2026-11-20T12:00:00.000Z', note: 'Package handed to the courier', updatedBy: 'seller', updatedByUserId: id }, { status: 'delivered', label: 'Delivered', responsibleParty: 'buyer', isCompleted: false, isCurrent: false }, { status: 'received', label: 'Received', responsibleParty: 'buyer', isCompleted: false, isCurrent: false }] } } },
  { path: '/orders/{id}/cancel', method: 'post', tag: 'Orders', summary: 'Cancel an order', bodyExample: { reason: 'No longer needed' }, successStatus: '200' },
  { path: '/orders/{id}/return', method: 'post', tag: 'Orders', summary: 'Request an order return', bodyExample: { reason: 'Item was damaged' }, successStatus: '200' },
  { path: '/orders/{id}/reorder', method: 'post', tag: 'Orders', summary: 'Reorder an order' },
  { path: '/orders/{id}/rate-merchant', method: 'post', tag: 'Orders', summary: 'Rate an order merchant', bodyExample: { rating: 5, comment: 'Excellent service' }, successStatus: '200' },
  { path: '/orders/{id}/track', method: 'get', tag: 'Orders', summary: 'Track an order', description: 'Returns the same normalized orderSteps timeline used by the order-detail endpoint. timeline is retained as a backwards-compatible alias of orderSteps and contains the same entries.', responseExample: { message: 'success', data: { deliveryStatus: 'outForDelivery', deliveryDate: null, deliveredAt: null, viewerRole: 'buyer', allowedDeliveryStatusUpdates: ['delivered'], orderSteps: [{ status: 'orderConfirmed', label: 'Order confirmed', responsibleParty: 'system', isCompleted: true, isCurrent: false, activatedAt: '2026-11-20T09:00:00.000Z' }, { status: 'outForDelivery', label: 'Out for delivery', responsibleParty: 'seller', isCompleted: true, isCurrent: true, activatedAt: '2026-11-20T12:00:00.000Z', updatedBy: 'seller' }, { status: 'delivered', label: 'Delivered', responsibleParty: 'buyer', isCompleted: false, isCurrent: false }], timeline: [{ status: 'orderConfirmed', label: 'Order confirmed', isCompleted: true, activatedAt: '2026-11-20T09:00:00.000Z' }, { status: 'outForDelivery', label: 'Out for delivery', isCompleted: true, activatedAt: '2026-11-20T12:00:00.000Z' }, { status: 'delivered', label: 'Delivered', isCompleted: false }] } } },

  // Administration
  { path: '/admin/dashboard', method: 'get', tag: 'Admin', summary: 'Fetch admin dashboard' },
  { path: '/admin/reports', method: 'get', tag: 'new-admin', summary: 'Fetch report charts for churn, acquisition, jobs, active users, material sales, and subscriptions', queryParams: ['startDate', 'endDate'] },
  { path: '/admin/reports/export', method: 'post', tag: 'new-admin', summary: 'Download a selected report as PDF, CSV, or Markdown', bodyExample: { report: 'job_success', startDate: '2026-10-01', endDate: '2026-10-31', format: 'pdf' }, successStatus: '200' },
  { path: '/admin/settings', method: 'get', tag: 'new-admin', summary: 'Fetch platform settings, plans, spotlight candidates, and admin role rows', queryParams: ['search'] },
  { path: '/admin/settings/platform', method: 'patch', tag: 'new-admin', summary: 'Update platform commission and deposit/withdrawal limits (super admin)', bodyExample: { platformCommissionPercent: 5, withdrawalCurrency: 'NGN', minimumWithdrawalAmount: 2000, maximumWithdrawalAmount: 5000000, minimumDepositAmount: 1000 } },
  { path: '/admin/settings/subscriptions', method: 'patch', tag: 'new-admin', summary: 'Update subscription prices and availability (super admin)', bodyExample: { plans: [{ name: 'Basic', price: 0, isActive: false }, { name: 'Silver', price: 24000, isActive: true }] } },
  { path: '/admin/settings/spotlight', method: 'put', tag: 'new-admin', summary: 'Publish the expert and merchant of the week (super admin)', bodyExample: { expertUserId: id, merchantUserId: id } },
  { path: '/admin/current-user', method: 'get', tag: 'new-admin', summary: 'Fetch the currently authenticated admin for frontend session hydration', description: 'Returns only safe administrator identity, role, permissions, account, onboarding, and MFA state. Passwords, password history, invitation/reset tokens, and the MFA secret are never returned.', responseExample: { message: 'success', data: { id, fullName: 'Ayodeji Agboola E.', email: 'ayodeji@emilist.com', mobile: '+2348012345678', profileImage: null, department: 'Product', jobTitle: 'Product Designer', permissions: [], role: 'admin', status: 'Active', onboardingStatus: 'active', isEmailVerified: true, mfaEnabled: true, mfaVerifiedAt: '2026-11-19T08:00:00.000Z', lastLoginAt: '2026-11-19T08:00:00.000Z' } } },
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
  { path: '/admin/update-job-payment/{jobId}', method: 'patch', tag: 'Admin', summary: 'Settle a confirmed job payment and credit the artisan wallet', bodyExample: { status: 'paid', milestoneId: id } },
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
  { path: '/admin/support-requests/summary', method: 'get', tag: 'new-admin', summary: 'Fetch support dashboard cards and their current-versus-previous seven-day trends', responseExample: { message: 'success', data: { ticketCount: 12, unassignedTickets: 3, highPriorityTickets: 2, overdueTickets: 1, pendingTickets: 4, averageResolution: { seconds: 3900, hours: 1, minutes: 5, resolvedInPeriod: 5, period: '7d' }, slaHours: 24, cards: { totalTickets: { key: 'totalTickets', title: 'Total Tickets', value: 12, displayValue: '12', description: 'All support requests', trend: { percentage: 50, signedPercentage: 50, direction: 'up', isImprovement: false, comparison: 'previous_7_days', currentPeriodValue: 6, previousPeriodValue: 4 } }, unassignedTickets: { key: 'unassignedTickets', title: 'Unassigned Tickets', value: 3, displayValue: '3', description: 'Open tickets with no admin or team assigned' }, highPriorityTickets: { key: 'highPriorityTickets', title: 'High Priority Tickets', value: 2, displayValue: '2', description: 'Unresolved high, critical, or urgent tickets' }, overdueTickets: { key: 'overdueTickets', title: 'Overdue Tickets', value: 1, displayValue: '1', description: 'Unresolved tickets older than the 24-hour SLA' }, awaitingCustomerResponse: { key: 'awaitingCustomerResponse', title: 'Awaiting Customer Response', value: 4, displayValue: '4', description: 'Tickets currently waiting for a customer reply' }, averageResolutionTime: { key: 'averageResolutionTime', title: 'Average Resolution Time', value: 3900, displayValue: '1h 5m', unit: 'seconds', resolvedInPeriod: 5 } } } } },
  { path: '/admin/support-requests/assignees', method: 'get', tag: 'new-admin', summary: 'Fetch active admins and support teams for assignment controls' },
  { path: '/admin/support-requests', method: 'get', tag: 'new-admin', summary: 'Search and filter support tickets by status, priority, category, assignee, and team', description: 'cards and counts contain global dashboard metrics. Every card includes a display-ready value and seven-day trend metadata. pagination.total is the number matching the current filters/search and may therefore be smaller than counts.total.', queryParams: ['page', 'limit', 'search', 'status', 'priority', 'category', 'assignedAdminId', 'team'], responseExample: { message: 'success', data: { requests: [{ _id: id, ticketCode: 'TKT-D323BB', subject: 'Wallet funding', category: 'financial', priority: 'critical', status: 'open', displayStatus: 'overdue', isOverdue: true, queueSeconds: 376774 }], cards: { totalTickets: { key: 'totalTickets', title: 'Total Tickets', value: 12, displayValue: '12', description: 'All support requests', trend: { percentage: 50, signedPercentage: 50, direction: 'up', isImprovement: false, comparison: 'previous_7_days', currentPeriodValue: 6, previousPeriodValue: 4 } }, unassignedTickets: { key: 'unassignedTickets', title: 'Unassigned Tickets', value: 3, displayValue: '3' }, highPriorityTickets: { key: 'highPriorityTickets', title: 'High Priority Tickets', value: 2, displayValue: '2' }, overdueTickets: { key: 'overdueTickets', title: 'Overdue Tickets', value: 1, displayValue: '1' }, awaitingCustomerResponse: { key: 'awaitingCustomerResponse', title: 'Awaiting Customer Response', value: 4, displayValue: '4' }, averageResolutionTime: { key: 'averageResolutionTime', title: 'Average Resolution Time', value: 3900, displayValue: '1h 5m', unit: 'seconds', resolvedInPeriod: 5 } }, counts: { total: 12, open: 4, inProgress: 2, pendingCustomer: 1, pendingResolution: 1, resolved: 4, overdue: 2 }, pagination: { page: 1, limit: 10, total: 1, pages: 1 } } } },
  { path: '/admin/support-requests/{requestId}', method: 'get', tag: 'new-admin', summary: 'Open ticket details, requester, linked record, conversation, attachments, private notes, and history' },
  { path: '/admin/support-requests/{requestId}/assignment', method: 'patch', tag: 'new-admin', summary: 'Assign or escalate a ticket to an admin/team and update its priority', bodyExample: { assignedAdminId: id, assignedTeam: 'Finance Team', priority: 'high' } },
  { path: '/admin/support-requests/{requestId}/replies', method: 'post', tag: 'new-admin', summary: 'Reply to the customer with optional uploaded image attachments', description: 'Send multipart/form-data. Add each JPG, PNG, or WEBP image under the attachments field; do not send attachment URLs. Up to 10 images of 10 MB each are accepted.', multipart: true, multipartFileField: 'attachments', multipartFileMaxCount: 10, requiredBodyFields: ['message'], bodyProperties: { message: { type: 'string', minLength: 1, maxLength: 5000 } }, bodyExample: { message: 'We checked the transfer and will update you shortly.' } },
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
    parameters.push({ name, in: 'query', required: false, schema: querySchema(name) });
  }

  const acceptsBody = route.method === 'post' || route.method === 'patch' || route.method === 'put';
  const operation: Record<string, unknown> = {
    tags: [route.tag],
    summary: route.summary,
    description: route.description || route.summary,
    operationId: operationIdFor(route),
    security: route.auth === false ? [] : [{ bearerAuth: [] }],
    ...(parameters.length > 0 ? { parameters } : {}),
    responses: {
      [route.successStatus ?? (route.method === 'post' ? '201' : '200')]: {
        description: 'Successful response',
        ...(route.responseExample ? { content: { 'application/json': { example: route.responseExample } } } : {}),
      },
      ...(route.auth === false ? {} : { '401': { description: 'Unauthorized' } }),
      '400': { description: 'Invalid request parameters or payload' },
      ...(route.auth === false ? {} : { '403': { description: 'Authenticated but not permitted to perform this action' } }),
      '404': { description: 'Requested resource was not found' },
      '500': { description: 'Unexpected server error' },
    },
  };

  if (acceptsBody) {
    const contentType = route.multipart ? 'multipart/form-data' : 'application/json';
    const multipartProperties = route.multipartFileField ? {
      [route.multipartFileField]: {
        type: 'array',
        maxItems: route.multipartFileMaxCount ?? 10,
        items: { type: 'string', format: 'binary' },
        description: 'Upload files using multipart/form-data; URL strings are not accepted.',
      },
    } : {};
    operation.requestBody = {
      required: Boolean(route.bodyExample || route.multipart),
      content: {
        [contentType]: {
          schema: {
            type: 'object',
            additionalProperties: true,
            ...(route.requiredBodyFields?.length ? { required: route.requiredBodyFields } : {}),
            properties: { ...(route.bodyProperties || {}), ...multipartProperties },
          },
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

