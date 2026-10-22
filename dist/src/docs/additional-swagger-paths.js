"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.additionalSwaggerPaths = void 0;
const id = '64e1a2b3c4d5e6f7a8b9c0d1';
const businessId = '64aa1b2c3d4e5f6a7b8c9ab';
const productId = '64bb1b2c3d4e5f6a7b8c9cd';
/**
 * Routes that were historically missing from the hand-written Swagger spec.
 * Keep this list in sync with src/routes. The larger Jobs/Wallet/Promo sections
 * remain hand-written in swagger.ts because they have richer, endpoint-specific
 * schemas and examples there.
 */
const routes = [
    // Authentication and user profile
    { path: '/auth', method: 'get', tag: 'Auth', summary: 'API welcome message', auth: false },
    { path: '/auth/sign-up', method: 'post', tag: 'Auth', summary: 'Register a user', auth: false, bodyExample: { userName: 'jane', email: 'jane@example.com', password: 'Password123!' } },
    { path: '/auth/login', method: 'post', tag: 'Auth', summary: 'Log in', auth: false, bodyExample: { email: 'jane@example.com', password: 'Password123!' }, successStatus: '200' },
    { path: '/auth/verify-email', method: 'post', tag: 'Auth', summary: 'Verify email address', auth: false, bodyExample: { email: 'jane@example.com', otp: '123456' }, successStatus: '200' },
    { path: '/auth/forgot-password', method: 'post', tag: 'Auth', summary: 'Request password reset OTP', auth: false, bodyExample: { email: 'jane@example.com' }, successStatus: '200' },
    { path: '/auth/verify-password-otp', method: 'post', tag: 'Auth', summary: 'Verify password reset OTP', auth: false, bodyExample: { email: 'jane@example.com', otp: '123456' }, successStatus: '200' },
    { path: '/auth/reset-password', method: 'post', tag: 'Auth', summary: 'Reset password', auth: false, bodyExample: { email: 'jane@example.com', password: 'NewPassword123!', confirmPassword: 'NewPassword123!' }, successStatus: '200' },
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
    { path: '/auth/current-user', method: 'get', tag: 'Auth', summary: 'Fetch the authenticated user' },
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
    // Business/expert profiles
    { path: '/business/register-business', method: 'post', tag: 'Business', summary: 'Register a business/expert profile', multipart: true },
    { path: '/business/update-business/{businessId}', method: 'patch', tag: 'Business', summary: 'Update a business profile', multipart: true },
    { path: '/business/fetch-single-business/{businessId}', method: 'get', tag: 'Business', summary: 'Fetch a business profile', auth: false, queryParams: ['userId'] },
    { path: '/business/fetch-user-business', method: 'get', tag: 'Business', summary: "Fetch the authenticated user's business" },
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
    { path: '/notification/fetch-user-notification', method: 'get', tag: 'Notifications', summary: 'Fetch user notifications', queryParams: ['page', 'limit'] },
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
    { path: '/subscription/get-plans', method: 'get', tag: 'Subscriptions', summary: 'Fetch subscription plans', auth: false },
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
    { path: '/admin/verify-bank-transfer', method: 'post', tag: 'Admin', summary: 'Verify bank-transfer wallet funding', bodyExample: { reference: 'PAYSTACK_REFERENCE' }, successStatus: '200' },
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
    { path: '/admin/create-admin', method: 'post', tag: 'Admin', summary: 'Create an administrator (super admin)', bodyExample: { fullName: 'Admin User', email: 'admin@example.com', password: 'Password123!' } },
    { path: '/admin/login', method: 'post', tag: 'Admin', summary: 'Admin login', auth: false, bodyExample: { email: 'admin@example.com', password: 'Password123!' }, successStatus: '200' },
    { path: '/admin/change-status-admin', method: 'patch', tag: 'Admin', summary: 'Change administrator status (super admin)', bodyExample: { adminId: id, status: 'active' } },
    { path: '/admin/forgot-password', method: 'patch', tag: 'Admin', summary: 'Request admin password reset', auth: false, bodyExample: { email: 'admin@example.com' } },
    { path: '/admin/password-reset', method: 'patch', tag: 'Admin', summary: 'Reset admin password', auth: false, bodyExample: { email: 'admin@example.com', otp: '123456', password: 'NewPassword123!' } },
    { path: '/admin/fetch-admins', method: 'get', tag: 'Admin', summary: 'Fetch administrators (super admin)', queryParams: ['page', 'limit', 'search'] },
];
const operationFor = (route) => {
    const parameters = [];
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
    const operation = {
        tags: [route.tag],
        summary: route.summary,
        security: route.auth === false ? [] : [{ bearerAuth: [] }],
        ...(parameters.length > 0 ? { parameters } : {}),
        responses: {
            [route.successStatus ?? (route.method === 'post' ? '201' : '200')]: { description: 'Successful response' },
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
exports.additionalSwaggerPaths = routes.reduce((paths, route) => {
    paths[route.path] ??= {};
    paths[route.path][route.method] = operationFor(route);
    return paths;
}, {});
