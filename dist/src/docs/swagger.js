"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
/**
 * Emilist API - Swagger / OpenAPI 3.0 specification
 * -------------------------------------------------
 * This document describes all endpoints under the JOBS section.
 * The interactive UI is served at:  GET /api-docs
 *
 * Auth: protected endpoints require an `Authorization: Bearer <token>` header.
 *       Obtain a token from `POST /api/v1/auth/login`.
 */
exports.swaggerSpec = {
    openapi: "3.0.3",
    info: {
        title: "Emilist API",
        version: "1.0.0",
        description: `Backend API for the Emilist platform.

## Jobs section
Interactive documentation & examples for every endpoint under \`/api/v1/jobs\`.

### Authentication
1. Call \`POST /api/v1/auth/login\` with \`{ "email": "...", "password": "..." }\`.
2. Copy the returned \`token\` (JWT).
3. Click **Authorize** (top right) and paste it as \`Bearer <token>\`.

### File uploads
Endpoints marked as \`multipart/form-data\` expect the file(s) under the field
\`files\` (multiple) or \`image\` (single) and all other fields as form values.
`,
    },
    servers: [
        { url: "http://localhost:7000/api/v1", description: "Local development server" },
    ],
    tags: [
        {
            name: "Jobs",
            description: "Everything related to creating, listing, applying to and managing jobs.",
        },
        {
            name: "Dashboard",
            description: "Home/overview screen for the logged-in user.",
        },
        {
            name: "Business",
            description: "Business/expert profiles - the marketplace listings behind the \"Hire experts\" screen.",
        },
        {
            name: "Materials",
            description: "Product/material listings - the marketplace listings behind the \"Explore materials\" screen.",
        },
        {
            name: "Promo Codes",
            description: "Seller-owned, product-scoped promo codes and buyer application to the cart.",
        },
        {
            name: "Wallet",
            description: "Wallet management, funding via Paystack and payout bank accounts.",
        },
        {
            name: "Transactions",
            description: "User transaction history, chart summary, statement download and admin withdrawal approvals.",
        },
        {
            name: "Webhooks",
            description: "Paystack webhook receiver (signature-verified, no bearer auth).",
        },
    ],
    security: [{ bearerAuth: [] }],
    paths: {
        "/promo": {
            post: {
                tags: ["Promo Codes"],
                summary: "Create a product-scoped promo code (seller)",
                description: `Creates a promo code owned by the calling seller and scoped to specific product(s) in their inventory. It can only ever discount those products - never the whole cart. Omit \`code\` to auto-generate a globally unique one.`,
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            example: {
                                code: "SAVE20",
                                productIds: ["64e1a2b3c4d5e6f7a8b9c0d3"],
                                discountPercentage: 20,
                                expiryDate: "2026-12-31T23:59:59.000Z",
                                isSingleUse: false,
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Promo code created",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        _id: "64f1a2b3c4d5e6f7a8b9c0aa",
                                        code: "SAVE20",
                                        discountPercentage: 20,
                                        expiryDate: "2026-12-31T23:59:59.000Z",
                                        isActive: true,
                                        isSingleUse: false,
                                        useCount: 0,
                                        sellerId: "64e1a2b3c4d5e6f7a8b9c0d2",
                                        productIds: ["64e1a2b3c4d5e6f7a8b9c0d3"],
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "Validation error, product not owned by seller, or code already taken" },
                    "401": { description: "Unauthorized - missing or invalid token" },
                },
            },
            get: {
                tags: ["Promo Codes"],
                summary: "Fetch the seller's promo codes",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "List of the seller's promo codes (usage counts + scoped products)" },
                    "401": { description: "Unauthorized - missing or invalid token" },
                },
            },
        },
        "/promo/{id}": {
            patch: {
                tags: ["Promo Codes"],
                summary: "Update a promo code (seller, own codes only)",
                description: `Update \`discountPercentage\`, \`expiryDate\`, \`isActive\` and/or \`productIds\`. The promo \`code\` itself cannot be changed.`,
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Promo code id" }],
                requestBody: {
                    required: true,
                    content: { "application/json": { example: { isActive: false } } },
                },
                responses: {
                    "200": { description: "Updated promo code" },
                    "403": { description: "Not the owner of the promo code" },
                    "404": { description: "Promo code not found" },
                },
            },
            delete: {
                tags: ["Promo Codes"],
                summary: "Delete a promo code (seller, own codes only)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    "200": { description: "Promo code deleted" },
                    "403": { description: "Not the owner of the promo code" },
                    "404": { description: "Promo code not found" },
                },
            },
        },
        "/promo/admin": {
            post: {
                tags: ["Promo Codes"],
                summary: "Create a promo code on behalf of a seller (admin)",
                description: `Same rules as the seller endpoint, but \`sellerId\` is provided by the admin and must own all \`productIds\`.`,
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            example: {
                                sellerId: "64e1a2b3c4d5e6f7a8b9c0d2",
                                productIds: ["64e1a2b3c4d5e6f7a8b9c0d3"],
                                discountPercentage: 15,
                                expiryDate: "2026-12-31T23:59:59.000Z",
                            },
                        },
                    },
                },
                responses: {
                    "201": { description: "Promo code created" },
                    "400": { description: "Validation error or product ownership failure" },
                    "401": { description: "Admin access only" },
                },
            },
        },
        "/dashboard/overview": {
            get: {
                tags: ["Dashboard"],
                summary: "Fetch the logged-in user's dashboard overview",
                description: `Powers the "Hello, {name}" home screen: new job applications, upcoming
payments, job completion rate, a job-completion donut breakdown, and a spotlighted service
provider.

Notes on the metrics:
- \`newJobApplications.count\` is the number of applications currently pending review across
  the user's posted jobs; \`newToday\`/\`percentChangeToday\` compare applications received today
  vs. yesterday.
- \`upcomingPayments\` sums unpaid milestone amounts (grouped by currency) whose computed due
  date falls within the next 7 days, across the user's active/paused jobs.
- \`jobCompletionRate.percentChangeToday\` is a percentage-**point** change vs. this time
  yesterday (not a relative percent).
- \`jobCompletion\` gives completed/pending/overdue as percentages of all the user's jobs (for
  the donut chart legend).
- \`spotlight\` is the highest-rated Business profile (by average review rating, tie-broken by
  review count) other than the user's own — a "top-rated now" pick, not a stored weekly rotation.`,
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Dashboard overview",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        user: { _id: "64e1a2b3c4d5e6f7a8b9c0d1", fullName: "Toks Williams", uniqueId: "Toks13356", displayImage: "https://.../avatar.jpg" },
                                        newJobApplications: { count: 32, newToday: 4, percentChangeToday: 13 },
                                        upcomingPayments: { amount: 3200000, currency: "NGN", totalsByCurrency: { NGN: 3200000 }, period: "this week" },
                                        jobCompletionRate: { rate: 85, percentChangeToday: -4 },
                                        jobCompletion: { completed: 48, pending: 41, overdue: 11, period: "This week" },
                                        spotlight: {
                                            businessId: "64aa1b2c3d4e5f6a7b8c9ab",
                                            businessName: "Cole Furniture Works",
                                            services: ["Furniture Maker"],
                                            expertType: "verified",
                                            user: { _id: "64e1a2b3c4d5e6f7a8b9c0d2", fullName: "Richard Cole E.", userName: "richardcole", displayImage: "https://.../richard.jpg", level: "three" },
                                            averageRating: 4.8,
                                            totalReviews: 380,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized - missing or invalid token", content: { "application/json": { example: { message: "Kindly login" } } } },
                    "404": { description: "User not found" },
                    "500": { description: "Server error" },
                },
            },
        },
        "/cart/apply-discount-code": {
            post: {
                tags: ["Promo Codes"],
                summary: "Apply a promo code to the cart (buyer)",
                description: `Applies a product-scoped promo code to the active cart. The code only discounts the scoped product(s); one code per seller and no product overlap between applied codes. The response contains the full cart with per-item \`promoDiscountAmount\`, per-code \`appliedPromos\` and the discounted \`orderSummary\`.`,
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { "application/json": { example: { code: "SAVE20" } } },
                },
                responses: {
                    "200": {
                        description: "Promo code applied - updated cart with promo breakdown",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        message: "Promo code SAVE20 applied",
                                        appliedPromos: [
                                            {
                                                code: "SAVE20",
                                                discountPercentage: 20,
                                                discountAmount: 2000,
                                                products: [{ productId: "64e1a2b3c4d5e6f7a8b9c0d3", productName: "Cement", quantity: 2, unitPrice: 5000, lineTotal: 10000, discountAmount: 2000 }],
                                            },
                                        ],
                                        promoDiscountAmount: 2000,
                                        orderSummary: { subtotalAmount: 15000, discountAmount: 2000, taxAmount: 0, shippingAmount: 0, totalAmount: 13000 },
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "Cart empty, code already applied, no scoped product in cart, same-seller code applied, or product overlap" },
                    "404": { description: "Invalid or expired promo code" },
                },
            },
        },
        "/cart/remove-promo-code/{code}": {
            delete: {
                tags: ["Promo Codes"],
                summary: "Remove an applied promo code from the cart (buyer)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "code", in: "path", required: true, schema: { type: "string" }, description: "Promo code (case-insensitive)" }],
                responses: {
                    "200": { description: "Promo code removed - updated cart with promo breakdown" },
                    "404": { description: "Code not applied to the cart" },
                },
            },
        },
        "/cart/checkout": {
            post: {
                tags: ["Promo Codes"],
                summary: "Checkout the active cart (buyer)",
                description: `Creates a pending order from the active cart. Promo codes applied via \`/cart/apply-discount-code\` are the source of truth (an optional inline \`code\` is still accepted). Discounts apply per scoped product line only; tax is charged per product line at the product's own \`taxPercentage\` (0 = tax free) on the post-promo amount; delivery fee is currently 0. Each order line snapshots \`discountAmount\`, \`promoCode\`, \`taxPercentage\` and \`taxAmount\`.`,
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: false,
                    content: {
                        "application/json": {
                            example: { shippingAddress: "12 Admiralty Way, Lekki, Lagos", orderNote: "Please call on arrival" },
                        },
                    },
                },
                responses: {
                    "201": { description: "Order created (or the existing pending order for the cart returned)" },
                    "400": { description: "Cart empty or a product is out of stock" },
                    "404": { description: "Invalid inline promo code" },
                },
            },
        },
        "/business/fetch-all-experts": {
            get: {
                tags: ["Business"],
                summary: "Fetch all experts/businesses (public marketplace listing)",
                description: `Returns a paginated list of experts (Business profiles), with every filter shown on
the "Hire experts" marketplace screen: service category, payment range, service location, notice
period, experience level, and expert rating.

Each expert in the response includes \`category\` (first listed service), \`location\`
("City, Country"), \`experienceLevel\` (\`apprentice\`/\`junior\`/\`intermediate\`/\`senior\`, derived
from the owning user's \`level\`), \`averageRating\`, \`totalReviews\`, \`completedJobs\`, \`liked\`
(when \`userId\` is passed) and \`isCompared\`.

Note: \`minRating\`, \`minReviews\` and \`experienceLevel\` are applied after pagination (they depend
on computed/populated fields), so \`totalPages\`/\`totalBusinesses\` reflect the pre-filter count.`,
                security: [],
                parameters: [
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 }, description: "Page number" },
                    { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 }, description: "Items per page" },
                    { name: "search", in: "query", required: false, schema: { type: "string" }, description: "Free-text search across business name, bio, services and location" },
                    { name: "userId", in: "query", required: false, schema: { type: "string" }, description: "Requesting user's id - used to compute `liked`/`isCompared` and exclude muted businesses" },
                    { name: "serviceCategory", in: "query", required: false, schema: { type: "string" }, description: "SERVICE CATEGORY filter (multi-select). Comma-separated or repeated, e.g. `serviceCategory=Plumber,Bricklayer`" },
                    { name: "minPayment", in: "query", required: false, schema: { type: "number" }, description: "PAYMENT range - minimum `startingPrice`" },
                    { name: "maxPayment", in: "query", required: false, schema: { type: "number" }, description: "PAYMENT range - maximum `startingPrice`" },
                    { name: "location", in: "query", required: false, schema: { type: "string" }, description: "SERVICE LOCATION filter (multi-select). Comma-separated or repeated, e.g. `location=Lagos`" },
                    { name: "noticePeriod", in: "query", required: false, schema: { type: "string" }, description: "NOTICE PERIOD filter (multi-select). Comma-separated or repeated, e.g. `noticePeriod=Immediately,1 day`" },
                    { name: "experienceLevel", in: "query", required: false, schema: { type: "string", enum: ["apprentice", "junior", "intermediate", "senior"] }, description: "EXPERIENCE LEVEL filter (multi-select). Comma-separated or repeated, e.g. `experienceLevel=intermediate,senior`" },
                    { name: "minRating", in: "query", required: false, schema: { type: "number" }, description: "EXPERT RATING filter - minimum average rating (1-5)" },
                    { name: "minReviews", in: "query", required: false, schema: { type: "number" }, description: "Minimum number of reviews" },
                    { name: "expertType", in: "query", required: false, schema: { type: "string", enum: ["EmiPreferred", "Verified"] }, description: "Filter by expert type (drives the verified badge)" },
                    { name: "currency", in: "query", required: false, schema: { type: "string" }, description: "Filter by currency" },
                ],
                responses: {
                    "200": {
                        description: "Paginated list of experts",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        currentPage: 1,
                                        totalPages: 1,
                                        totalBusinesses: 1,
                                        experts: [
                                            {
                                                _id: "64aa1b2c3d4e5f6a7b8c9ab",
                                                businessName: "Yaro Masonry Ltd",
                                                services: ["Bricklayer"],
                                                category: "Bricklayer",
                                                expertType: "Verified",
                                                isVerified: true,
                                                startingPrice: 7000,
                                                currency: "NGN",
                                                rateUnit: "day",
                                                noticePeriod: "Immediately",
                                                businessCity: "Lagos",
                                                businessCountry: "Nigeria",
                                                location: "Lagos, Nigeria",
                                                displayImage: "https://.../yaro.jpg",
                                                experienceLevel: "senior",
                                                userId: { _id: "64e1a2b3c4d5e6f7a8b9c0d2", fullName: "Yaro Bello", userName: "yarobello", profileImage: "https://.../yaro-avatar.jpg", level: "four" },
                                                averageRating: 4.2,
                                                totalReviews: 51,
                                                completedJobs: 105,
                                                liked: false,
                                                isCompared: false,
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    "500": { description: "Server error" },
                },
            },
        },
        "/business/compare-business/{businessId}": {
            patch: {
                tags: ["Business"],
                summary: "Add/remove an expert to the authenticated user's compare list (toggle)",
                description: `Toggles \`businessId\` in the current user's \`comparedBusinesses\` list - the
"Compare Experts" tray. Call again with the same id to remove it.`,
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "businessId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the Business", example: "64aa1b2c3d4e5f6a7b8c9ab" },
                ],
                responses: {
                    "200": { description: "Compare list updated", content: { "application/json": { example: { message: "success", data: { message: "Compared businesses updated successfully", comparedBusinesses: ["64aa1b2c3d4e5f6a7b8c9ab"] } } } } },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Business not found" },
                },
            },
        },
        "/business/fetch-compared-business": {
            get: {
                tags: ["Business"],
                summary: "Fetch the experts on the authenticated user's compare list",
                description: `Powers the "Compare Experts" screen (up to however many businesses are in
\`comparedBusinesses\`). Each entry includes everything needed for the comparison table: \`category\`
(service), \`location\`, \`experienceLevel\` + \`experienceLevelLabel\` (e.g. "Senior (5 yrs+)",
derived from the owning user's \`level\`), \`averageRating\`, \`totalReviews\`, \`completedJobs\`,
\`noticePeriod\`, \`languages\`, \`insurance\`, and \`credentials\` - a flattened bullet list built from
\`certification\`/\`membership\` (e.g. "Painters Association of Nigeria Certified", "Painters
Association of Nigeria President").`,
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Experts currently in the compare list",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        enhancedBusinesses: [
                                            {
                                                _id: "64aa1b2c3d4e5f6a7b8c9ab",
                                                businessName: "Mike Adeyemi",
                                                services: ["Painter"],
                                                category: "Painter",
                                                startingPrice: 15000,
                                                currency: "NGN",
                                                rateUnit: "day",
                                                noticePeriod: "4 days",
                                                businessCity: "Lagos",
                                                businessCountry: "Nigeria",
                                                location: "Lagos, Nigeria",
                                                languages: ["English", "French"],
                                                insurance: [{ issuingOrganisation: "AXA Mansard", coverage: "Property Insurance" }],
                                                certification: [{ issuingOrganisation: "Painters Association of Nigeria" }],
                                                membership: [{ organisation: "Painters Association of Nigeria", positionHeld: "Member" }, { organisation: "Painters Association of Nigeria", positionHeld: "President" }],
                                                credentials: ["Painters Association of Nigeria Certified", "Painters Association of Nigeria Member", "Painters Association of Nigeria President"],
                                                experienceLevel: "senior",
                                                experienceLevelLabel: "Senior (5 yrs+)",
                                                userId: { _id: "64e1a2b3c4d5e6f7a8b9c0d2", fullName: "Mike Adeyemi", profileImage: "https://.../mike.jpg", level: "four" },
                                                averageRating: 4.7,
                                                totalReviews: 140,
                                                completedJobs: 45,
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                    "404": { description: "User not found" },
                },
            },
        },
        "/wallet/create-wallet": {
            post: {
                tags: ["Wallet"],
                summary: "Create a wallet (currency, isDefault)",
                description: `One wallet per currency per user. Setting \`isDefault: true\` unsets the previous default.`,
                security: [{ bearerAuth: [] }],
                requestBody: { required: true, content: { "application/json": { example: { currency: "NGN", isDefault: true } } } },
                responses: {
                    "201": {
                        description: "Wallet created",
                        content: { "application/json": { example: { message: "success", data: { _id: "64f1a2b3c4d5e6f7a8b9c0ab", balance: 0, currency: "NGN", isDefault: true } } } },
                    },
                    "400": { description: "Wallet for the currency already exists" },
                    "401": { description: "Unauthorized - missing or invalid token" },
                },
            },
        },
        "/wallet/fetch-wallets": {
            get: {
                tags: ["Wallet"],
                summary: "List all wallets for the authenticated user",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Wallets",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: { wallets: [{ walletId: "64f1a2b3c4d5e6f7a8b9c0ab", balance: 15000, currency: "NGN", isDefault: true, createdAt: "2026-08-31T10:00:00.000Z" }] },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized - missing or invalid token" },
                },
            },
        },
        "/wallet/fetch-wallet/{walletId}": {
            get: {
                tags: ["Wallet"],
                summary: "Get single wallet detail (balance + default payout bank account)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "walletId", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    "200": {
                        description: "Wallet detail",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        walletId: "64f1a2b3c4d5e6f7a8b9c0ab",
                                        balance: 15000,
                                        currency: "NGN",
                                        isDefault: true,
                                        createdAt: "2026-08-31T10:00:00.000Z",
                                        bankAccount: { bankAccountId: "64f1a2b3c4d5e6f7a8b9c0ac", bankName: "GTBank", accountNumber: "0123456789", accountName: "JOHN DOE", currency: "NGN", isDefault: true },
                                    },
                                },
                            },
                        },
                    },
                    "404": { description: "Wallet not found" },
                    "401": { description: "Unauthorized - missing or invalid token" },
                },
            },
        },
        "/wallet/set-default-wallet/{walletId}": {
            patch: {
                tags: ["Wallet"],
                summary: "Set a wallet as default (previous default is unset)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "walletId", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    "200": { description: "Updated wallet (walletId, balance, currency, isDefault)" },
                    "404": { description: "Wallet not found" },
                    "401": { description: "Unauthorized - missing or invalid token" },
                },
            },
        },
        "/wallet/fetch-payment-methods": {
            get: {
                tags: ["Wallet"],
                summary: "List available funding payment methods",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Payment methods",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        paymentMethods: [
                                            { id: "Card", name: "Card", description: "Pay with your card via Paystack" },
                                            { id: "BankTransfer", name: "BankTransfer", description: "Fund via manual bank transfer with receipt" },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized - missing or invalid token" },
                },
            },
        },
        "/wallet/fetch-banks": {
            get: {
                tags: ["Wallet"],
                summary: "List Paystack banks (for the add-bank-account screen)",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Banks",
                        content: { "application/json": { example: { message: "success", data: { banks: [{ bankCode: "058", bankName: "GTBank" }] } } } },
                    },
                    "401": { description: "Unauthorized - missing or invalid token" },
                },
            },
        },
        "/material/compare-product/{productId}": {
            patch: {
                tags: ["Materials"],
                summary: "Add/remove a product to the authenticated user's compare list (toggle)",
                description: `Toggles \`productId\` in the current user's \`comparedProducts\` list - the
"Compare Materials" tray. Call again with the same id to remove it.`,
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "productId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the Product", example: "64bb1b2c3d4e5f6a7b8c9cd" },
                ],
                responses: {
                    "200": { description: "Compare list updated", content: { "application/json": { example: { message: "success", data: { message: "Compared products updated successfully", comparedProducts: ["64bb1b2c3d4e5f6a7b8c9cd"] } } } } },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Product not found" },
                },
            },
        },
        "/material/fetch-compared-products": {
            get: {
                tags: ["Materials"],
                summary: "Fetch the products on the authenticated user's compare list",
                description: `Powers the "Compare Materials" screen. Each entry includes everything needed for
the comparison table: \`deliveryTime\`, \`location\` (built from \`deliveryLocations\`),
\`merchantRating\`/\`merchantTotalReviews\` (the seller's average rating across ALL their products -
the "Merchant Ratings" row), \`averageRating\`/\`totalReviews\` (this specific product's own rating -
the "Product Reviews" row), and a static \`disclaimer\` string.`,
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Products currently in the compare list",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        enhancedProducts: [
                                            {
                                                _id: "64bb1b2c3d4e5f6a7b8c9cd",
                                                name: "Dangote Cement",
                                                price: 9000,
                                                currency: "NGN",
                                                priceMetric: "bag",
                                                totalUnitsSold: 25400,
                                                deliveryTime: "immediately",
                                                deliveryLocations: [{ state: "Lagos", lga: "Ajah" }],
                                                location: "Ajah, Lagos",
                                                images: [{ imageUrl: "https://.../cement.jpg", isPrimary: true }],
                                                merchantName: "Ajah Building Materials",
                                                userId: { _id: "64e1a2b3c4d5e6f7a8b9c0d3", fullName: "Ajah Building Materials", profileImage: "https://.../merchant.jpg" },
                                                merchantRating: 4.7,
                                                merchantTotalReviews: 140,
                                                averageRating: 4.0,
                                                totalReviews: 140,
                                                disclaimer: "Prices, availability and delivery times are set by the merchant and may change without notice. Emilist does not guarantee product quality - please review the merchant's ratings and reviews before purchasing.",
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                    "404": { description: "User not found" },
                },
            },
        },
        "/wallet/initiate-wallet-funding": {
            post: {
                tags: ["Wallet"],
                summary: "Fund a wallet (Paystack card flow)",
                description: `Creates a pending CREDIT transaction and, for \`Card\` + NGN, initializes a Paystack transaction. Redirect the user to \`authorizationUrl\`; the wallet is credited by the Paystack webhook (or the legacy verify endpoint) keyed by \`reference\`.`,
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            example: { currency: "NGN", amount: 5000, paymentMethod: "Card", walletId: "64f1a2b3c4d5e6f7a8b9c0ab", redirectUrl: "https://app.emilist.com/wallet" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Funding initiated",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        authorizationUrl: "https://checkout.paystack.com/abc123",
                                        reference: "PS-1693500000000X8Y2",
                                        transactionId: "64f1a2b3c4d5e6f7a8b9c0ad",
                                        amount: 5000,
                                        currency: "NGN",
                                        status: "pending",
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "Validation error or missing redirectUrl for card payments" },
                    "404": { description: "Wallet not found" },
                },
            },
        },
        "/wallet/fetch-bank-accounts": {
            get: {
                tags: ["Wallet"],
                summary: "List the user's saved payout bank accounts",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Bank accounts",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: { bankAccounts: [{ bankAccountId: "64f1a2b3c4d5e6f7a8b9c0ac", bankName: "GTBank", accountNumber: "0123456789", accountName: "JOHN DOE", currency: "NGN", isDefault: true }] },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized - missing or invalid token" },
                },
            },
        },
        "/wallet/add-bank-account": {
            post: {
                tags: ["Wallet"],
                summary: "Add a payout bank account (resolved via Paystack)",
                description: `Resolves the account name via Paystack \`/bank/resolve\`, creates a reusable transfer recipient and stores the account. NGN only.`,
                security: [{ bearerAuth: [] }],
                requestBody: { required: true, content: { "application/json": { example: { bankCode: "058", accountNumber: "0123456789", currency: "NGN" } } } },
                responses: {
                    "201": {
                        description: "Bank account saved",
                        content: {
                            "application/json": {
                                example: { message: "success", data: { bankAccountId: "64f1a2b3c4d5e6f7a8b9c0ac", bankName: "GTBank", accountNumber: "0123456789", accountName: "JOHN DOE", currency: "NGN", isDefault: true } },
                            },
                        },
                    },
                    "400": { description: "Unknown bank code or account already added" },
                    "401": { description: "Unauthorized - missing or invalid token" },
                },
            },
        },
        "/wallet/withdraw-funds": {
            post: {
                tags: ["Wallet"],
                summary: "Request a withdrawal from a wallet (admin approval required)",
                description: `Validates the balance and debits (holds) the amount immediately, creating a \`pending\` DEBIT transaction with \`serviceType: "Withdrawal"\`. An admin must approve (Paystack transfer goes out) or decline (amount refunded). If the transfer later fails or is reversed, the hold is refunded automatically.`,
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { "application/json": { example: { amount: 5000, currency: "NGN", bankAccountId: "64f1a2b3c4d5e6f7a8b9c0ac" } } },
                },
                responses: {
                    "201": {
                        description: "Withdrawal request submitted (awaiting admin approval)",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        transactionId: "64f1a2b3c4d5e6f7a8b9c0ae",
                                        reference: "WD-1693500000000X8Y2",
                                        amount: 5000,
                                        currency: "NGN",
                                        status: "pending",
                                        balance: 10000,
                                        counterparty: "GTBank - JOHN DOE",
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "Insufficient balance or validation error (minimum withdrawal 1000)" },
                    "404": { description: "Wallet or bank account not found" },
                },
            },
        },
        "/jobs/fetch-all-jobs": {
            get: {
                tags: ["Jobs"],
                summary: "Fetch all jobs (public marketplace listing)",
                description: `Returns a paginated list of all jobs, with optional filters matching the marketplace
"Find jobs" screen: job category, payment range, job location, notice period (job urgency),
experience level, and employer (poster) rating.

Each job in the response includes \`applicantsCount\`, \`milestonesCount\`, \`liked\` (when
\`userId\` is passed) and \`posterRating\` (\`{ averageRating, totalReviews }\`, derived from the
poster's Business reviews, 0/0 when they don't run a Business).

Only **listed** jobs appear here — jobs delisted by the poster (\`isListed = false\`) are excluded.`,
                security: [],
                parameters: [
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 }, description: "Page number" },
                    { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 }, description: "Items per page" },
                    { name: "search", in: "query", required: false, schema: { type: "string" }, description: "Free-text search" },
                    { name: "title", in: "query", required: false, schema: { type: "string" }, description: "Filter by title" },
                    { name: "location", in: "query", required: false, schema: { type: "string" }, description: "Filter by a single location (legacy)" },
                    { name: "category", in: "query", required: false, schema: { type: "string" }, description: "Filter by a single job category (legacy)" },
                    { name: "service", in: "query", required: false, schema: { type: "string" }, description: "Filter by service" },
                    { name: "userId", in: "query", required: false, schema: { type: "string" }, description: "Requesting user's id - used to compute `liked` and exclude muted jobs" },
                    { name: "categories", in: "query", required: false, schema: { type: "string" }, description: "JOB CATEGORY filter (multi-select). Comma-separated or repeated, e.g. `categories=Plumber,Carpenter`" },
                    { name: "locations", in: "query", required: false, schema: { type: "string" }, description: "JOB LOCATION filter (multi-select). Comma-separated or repeated, e.g. `locations=Yaba,Shomolu`" },
                    { name: "minBudget", in: "query", required: false, schema: { type: "number" }, description: "PAYMENT range - minimum amount (checked across budget/totalBudget/estimatedBudget/recurringBudget)" },
                    { name: "maxBudget", in: "query", required: false, schema: { type: "number" }, description: "PAYMENT range - maximum amount" },
                    { name: "jobUrgency", in: "query", required: false, schema: { type: "string", enum: ["right_now", "in_future", "regularly"] }, description: "NOTICE PERIOD filter" },
                    { name: "experienceLevel", in: "query", required: false, schema: { type: "string" }, description: "EXPERIENCE LEVEL filter (multi-select). Comma-separated or repeated, e.g. `experienceLevel=intermediate,senior`" },
                    { name: "minRating", in: "query", required: false, schema: { type: "number" }, description: "EMPLOYER RATING filter - minimum average rating (1-5) of the job poster's Business profile" },
                ],
                responses: {
                    "200": {
                        description: "Paginated list of jobs",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        currentPage: 1,
                                        totalPages: 1,
                                        totalJobs: 1,
                                        jobs: [
                                            {
                                                _id: "64f5c0a1b2c3d4e5f6a7b8c9",
                                                title: "Fix leaking kitchen sink",
                                                description: "Kitchen sink has been leaking for 2 days.",
                                                jobCategory: "Plumbing",
                                                service: "Repair",
                                                jobUrgency: "right_now",
                                                location: { address: "12 Admiralty Way, Lekki, Lagos" },
                                                type: "regular",
                                                status: "pending",
                                                isListed: true,
                                                userId: { _id: "64e1a2b3c4d5e6f7a8b9c0d1", userName: "arthurphillips", fullName: "Arthur Phillips", profileImage: "https://.../avatar.jpg", level: "intermediate" },
                                                applicantsCount: 13,
                                                milestonesCount: 3,
                                                liked: false,
                                                posterRating: { averageRating: 4.2, totalReviews: 51 },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    "500": { description: "Server error" },
                },
            },
        },
        "/transaction/fetch-all-user-transactions": {
            get: {
                tags: ["Transactions"],
                summary: "List the user's transactions with filters and pagination",
                description: `Filter by \`status\`, \`type\` and free-text \`search\` (transaction reference/id or counterparty). Item shape: transactionId, walletId, currency, amount, transactionType, status, counterparty, date, balance, reference, description, paymentMethod. Mapping: CREDIT->inflow, DEBIT->outflow; completed->successful, declined->failed, processing->pending.`,
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "status", in: "query", schema: { type: "string", enum: ["all", "pending", "failed", "successful"] }, description: "Defaults to all" },
                    { name: "type", in: "query", schema: { type: "string", enum: ["inflow", "outflow"] } },
                    { name: "search", in: "query", schema: { type: "string" }, description: "Matches reference, transaction id, counterparty or description" },
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 100 } },
                ],
                responses: {
                    "200": {
                        description: "Paginated transactions",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        transactions: [
                                            { transactionId: "64f1a2b3c4d5e6f7a8b9c0ad", walletId: "64f1a2b3c4d5e6f7a8b9c0ab", currency: "NGN", amount: 5000, transactionType: "inflow", status: "successful", counterparty: "Wallet funding via Card", date: "2026-08-31T10:00:00.000Z", balance: 15000, reference: "PS-1693500000000X8Y2", description: "Wallet funding via Card", paymentMethod: "Card" },
                                        ],
                                        totalTransactions: 24,
                                        totalPages: 3,
                                        page: 1,
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized - missing or invalid token" },
                },
            },
        },
        "/transaction/fetch-transaction-summary": {
            get: {
                tags: ["Transactions"],
                summary: "Transaction summary for charting",
                description: `Rolling window of \`range\` months ending this month: monthly inflow/outflow totals, total transaction count and % change of total volume vs the previous equal-length period.`,
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "range", in: "query", required: true, schema: { type: "string", enum: ["1M", "3M", "6M", "1Y"] } }],
                responses: {
                    "200": {
                        description: "Summary",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        range: "3M",
                                        totalTransactions: 24,
                                        inflowTotal: 100000,
                                        outflowTotal: 40000,
                                        percentageChange: 12.5,
                                        monthly: [{ month: "Jul 2026", inflow: 50000, outflow: 20000 }],
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized - missing or invalid token" },
                },
            },
        },
        "/transaction/fetch-my-transaction/{transactionId}": {
            get: {
                tags: ["Transactions"],
                summary: "Get single transaction detail (owner only)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "transactionId", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    "200": { description: "Serialized transaction detail (same shape as list items)" },
                    "404": { description: "Transaction not found (or not owned by the caller)" },
                    "401": { description: "Unauthorized - missing or invalid token" },
                },
            },
        },
        "/transaction/download-statement": {
            get: {
                tags: ["Transactions"],
                summary: "Download a transaction statement (pdf or csv)",
                description: `Only \`pdf\` and \`csv\` are supported - any other format returns 400. Streams the file with \`Content-Disposition: attachment\` and the correct \`Content-Type\`.`,
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "format", in: "query", required: true, schema: { type: "string", enum: ["pdf", "csv"] } },
                    { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
                    { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
                    { name: "status", in: "query", schema: { type: "string", enum: ["all", "pending", "failed", "successful"] } },
                ],
                responses: {
                    "200": {
                        description: "Statement file (application/pdf or text/csv attachment)",
                        content: {
                            "application/pdf": { schema: { type: "string", format: "binary" } },
                            "text/csv": { schema: { type: "string" } },
                        },
                    },
                    "400": { description: "Unsupported format or invalid filters" },
                    "401": { description: "Unauthorized - missing or invalid token" },
                },
            },
        },
        "/jobs/fetch-listed-jobs": {
            get: {
                tags: ["Jobs"],
                summary: "Fetch jobs listed by the current user",
                description: "Returns a paginated list of jobs created by the authenticated user.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
                    { name: "search", in: "query", required: false, schema: { type: "string" } },
                    { name: "title", in: "query", required: false, schema: { type: "string" } },
                    { name: "location", in: "query", required: false, schema: { type: "string" } },
                    { name: "category", in: "query", required: false, schema: { type: "string" } },
                    { name: "service", in: "query", required: false, schema: { type: "string" } },
                ],
                responses: {
                    "200": { description: "Paginated list of the user's jobs (includes `isListed` state)", content: { "application/json": { example: { message: "success", data: { page: 1, limit: 10, totalJobs: 1, jobs: [{ _id: "64f5c0a1b2c3d4e5f6a7b8c9", title: "Fix leaking kitchen sink", status: "pending", isListed: true }] } } } } },
                    "401": { description: "Unauthorized", content: { "application/json": { example: { message: "Kindly login" } } } },
                    "500": { description: "Server error" },
                },
            },
        },
        "/admin/approve-withdrawal/{transactionId}": {
            patch: {
                tags: ["Transactions"],
                summary: "Approve a pending withdrawal (admin)",
                description: `Marks the withdrawal \`processing\` and initiates the Paystack transfer to the saved recipient. If the transfer cannot be initiated, the withdrawal is marked \`failed\`, the held amount is refunded to the wallet, and a 400 is returned.`,
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "transactionId", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    "200": {
                        description: "Withdrawal approved (status: processing)",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: { transactionId: "64f1a2b3c4d5e6f7a8b9c0ae", reference: "WD-1693500000000X8Y2", status: "processing", transferCode: "TRF_2lm8x5p", amount: 5000, currency: "NGN" },
                                },
                            },
                        },
                    },
                    "400": { description: "Not a withdrawal, already processed, or Paystack transfer failed" },
                    "404": { description: "Transaction or bank account not found" },
                    "401": { description: "Admin access only" },
                },
            },
        },
        "/admin/decline-withdrawal/{transactionId}": {
            patch: {
                tags: ["Transactions"],
                summary: "Decline a pending withdrawal (admin)",
                description: `Marks the withdrawal \`declined\` and refunds the held amount to the wallet.`,
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "transactionId", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    "200": {
                        description: "Withdrawal declined (balance reflects the refund)",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: { transactionId: "64f1a2b3c4d5e6f7a8b9c0ae", reference: "WD-1693500000000X8Y2", status: "declined", amount: 5000, currency: "NGN", balance: 15000 },
                                },
                            },
                        },
                    },
                    "400": { description: "Not a withdrawal or already processed" },
                    "404": { description: "Transaction not found" },
                    "401": { description: "Admin access only" },
                },
            },
        },
        "/webhooks/paystack": {
            post: {
                tags: ["Webhooks"],
                summary: "Paystack webhook receiver",
                description: `Signature-verified (HMAC-SHA512 over the raw body via the \`x-paystack-signature\` header) - no bearer auth. Handles \`charge.success\` (credits the wallet, idempotent by reference), \`charge.failed\`, \`transfer.success\` and \`transfer.failed\`/\`transfer.reversed\` (refunds the withdrawal hold). Always acknowledges with 200 once the signature is valid.`,
                security: [],
                parameters: [
                    { name: "x-paystack-signature", in: "header", required: true, schema: { type: "string" }, description: "Paystack HMAC-SHA512 signature of the raw body" },
                ],
                requestBody: {
                    required: true,
                    content: { "application/json": { example: { event: "charge.success", data: { reference: "PS-1693500000000X8Y2", amount: 500000, status: "success" } } } },
                },
                responses: {
                    "200": { description: "Acknowledged", content: { "application/json": { example: { status: true } } } },
                    "401": { description: "Invalid signature" },
                },
            },
        },
        "/jobs/fetch-job-by-id": {
            get: {
                tags: ["Jobs"],
                summary: "Fetch a single job by id (public)",
                description: `Returns full details of a single job, including populated user/application info,
the milestones panel (each with computed \`dueDate\`), \`applicantsCount\`, and the job poster's
review summary and comments (\`reviews\`: average rating, star distribution, and a paginated list
of reviews/comments pulled from the poster's Business profile).`,
                security: [],
                parameters: [
                    { name: "id", in: "query", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the job", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
                    { name: "reviewsPage", in: "query", required: false, schema: { type: "integer", default: 1 }, description: "Page number for the poster's reviews/comments list" },
                    { name: "reviewsLimit", in: "query", required: false, schema: { type: "integer", default: 5 }, description: "Items per page for the poster's reviews/comments list" },
                ],
                responses: {
                    "200": {
                        description: "Job details",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        job: {
                                            _id: "64f5c0a1b2c3d4e5f6a7b8c9",
                                            title: "Fix leaking kitchen sink",
                                            description: "Kitchen sink has been leaking for 2 days.",
                                            jobCategory: "Plumbing",
                                            service: "Repair",
                                            jobUrgency: "right_now",
                                            location: { address: "12 Admiralty Way, Lekki, Lagos", lat: 6.4281, lng: 3.4219 },
                                            type: "regular",
                                            budget: 85000,
                                            status: "active",
                                            startDate: "2025-01-10T09:30:00.000Z",
                                            dueDate: "2025-01-24T09:30:00.000Z",
                                            userId: { _id: "64e1a2b3c4d5e6f7a8b9c0d1", userName: "john_doe", email: "john@example.com" },
                                            applications: [],
                                            applicantsCount: 13,
                                            milestonesCount: 3,
                                            milestones: [
                                                {
                                                    _id: "64fb0a1b2c3d4e5f6a7b8c9b",
                                                    timeFrame: { number: 7, period: "days" },
                                                    achievement: "Complete cabinet and chair repairs",
                                                    amount: 150000,
                                                    currency: "NGN",
                                                    status: "active",
                                                    paymentStatus: "unpaid",
                                                    dueDate: "2025-01-17T09:30:00.000Z",
                                                },
                                            ],
                                        },
                                        totalJobsPosted: 8,
                                        totalArtisansHired: 5,
                                        reviews: {
                                            averageRating: 4.2,
                                            numberOfRatings: 51,
                                            ratingDistribution: { "5": 30, "4": 12, "3": 5, "2": 2, "1": 2 },
                                            reviews: [
                                                {
                                                    _id: "64fb1a1b2c3d4e5f6a7b8c9c",
                                                    rating: 5,
                                                    comment: "Great work, very professional.",
                                                    createdAt: "2025-01-05T09:30:00.000Z",
                                                    user: { _id: "64e1a2b3c4d5e6f7a8b9c0d1", firstName: "Jane", lastName: "Doe", displayImage: "https://.../avatar.jpg" },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "404": { description: "Id required or job not found", content: { "application/json": { example: { message: "Id required!" } } } },
                    "500": { description: "Server error" },
                },
            },
        },
        "/jobs/like-job/{jobId}": {
            post: {
                tags: ["Jobs"],
                summary: "Like a job",
                description: "Adds the job to the authenticated user's liked jobs.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "jobId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the job", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
                ],
                responses: {
                    "201": { description: "Job liked successfully", content: { "application/json": { example: { message: "success", data: { _id: "64fc0a1b2c3d4e5f6a7b8c9a", job: "64f5c0a1b2c3d4e5f6a7b8c9", user: "64e1a2b3c4d5e6f7a8b9c0d1" } } } } },
                    "400": { description: "Job previously liked", content: { "application/json": { example: { message: "Job previously liked!" } } } },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Job not found", content: { "application/json": { example: { message: "Job not found!" } } } },
                },
            },
        },
        "/jobs/fetch-liked-jobs": {
            get: {
                tags: ["Jobs"],
                summary: "Fetch liked jobs",
                description: "Returns a paginated list of jobs liked by the authenticated user.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
                ],
                responses: {
                    "200": { description: "Paginated list of liked jobs", content: { "application/json": { example: { message: "success", data: { page: 1, limit: 10, jobs: [] } } } } },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/jobs/unlike-job/{jobId}": {
            post: {
                tags: ["Jobs"],
                summary: "Unlike a job",
                description: "Removes the job from the authenticated user's liked jobs.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "jobId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the job", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
                ],
                responses: {
                    "200": { description: "Job unliked", content: { "application/json": { example: { message: "success", data: { message: "Job unliked successfully" } } } } },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/jobs/apply-job": {
            post: {
                tags: ["Jobs"],
                summary: "Apply for a job",
                description: `Submits an application (project) for a pending job.

- \`type: biddable\`  → \`maximumPrice\` and \`milestones[]\` are required.
- \`type: regular\`   → those fields are forbidden.`,
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ApplyJobPayload" },
                            examples: {
                                regular: {
                                    summary: "Apply to a regular job",
                                    value: {
                                        jobId: "64f5c0a1b2c3d4e5f6a7b8c9",
                                        businessId: "64aa1b2c3d4e5f6a7b8c9ab",
                                        type: "regular",
                                    },
                                },
                                biddable: {
                                    summary: "Apply to a biddable job with a price & milestones",
                                    value: {
                                        jobId: "64f5c0a1b2c3d4e5f6a7b8c9",
                                        businessId: "64aa1b2c3d4e5f6a7b8c9ab",
                                        type: "biddable",
                                        maximumPrice: 75000,
                                        milestones: [
                                            { milestoneId: "64fb0a1b2c3d4e5f6a7b8c9b", amount: 40000, achievement: "Replace sink and connect pipes" },
                                            { milestoneId: "64fb0a1b2c3d4e5f6a7b8c9c", amount: 35000, achievement: "Test and clean up" },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Application submitted",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        _id: "64fc0a1b2c3d4e5f6a7b8c9a",
                                        job: "64f5c0a1b2c3d4e5f6a7b8c9",
                                        user: "64e1a2b3c4d5e6f7a8b9c0d1",
                                        creator: "64d1a2b3c4d5e6f7a8b9c0d1",
                                        businessId: "64aa1b2c3d4e5f6a7b8c9ab",
                                        status: "pending",
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "Bad request (e.g. applying to your own / non-pending job)", content: { "application/json": { example: { message: "You cannot apply to your own job!" } } } },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Job or business not found" },
                },
            },
        },
        "/jobs/withdraw-job-application/{projectId}": {
            delete: {
                tags: ["Jobs"],
                summary: "Withdraw a job application",
                description: "Withdraws a pending application (project) submitted by the user.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "projectId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the application/project", example: "64fc0a1b2c3d4e5f6a7b8c9a" },
                ],
                responses: {
                    "200": { description: "Application withdrawn", content: { "application/json": { example: { message: "success", data: "Application withdrawn" } } } },
                    "400": { description: "Can only withdraw a pending application", content: { "application/json": { example: { message: "You can only withdraw a pending application!" } } } },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Application not found" },
                },
            },
        },
        "/jobs/delete-job/{jobId}": {
            delete: {
                tags: ["Jobs"],
                summary: "Delete a job (no accepted applicant)",
                description: `Deletes a job created by the user and cleans up its applications.

Allowed only while the job has **no accepted applicant** (i.e. \`acceptedApplicationId\` is not set) —
covers \`pending\` and paused-before-acceptance jobs. Once an applicant has been accepted, use
\`delist-job\` to hide the job instead of deleting it.`,
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "jobId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the job", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
                ],
                responses: {
                    "200": { description: "Job deleted", content: { "application/json": { example: { message: "success", data: "Job deleted successfully" } } } },
                    "400": { description: "Job already has an accepted applicant", content: { "application/json": { example: { message: "You can only delete a job with no accepted applicant!" } } } },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Job not found" },
                },
            },
        },
        "/jobs/update-job/{jobId}": {
            put: {
                tags: ["Jobs"],
                summary: "Update a job (no accepted applicant)",
                description: `Updates a job created by the user.

Allowed only while the job has **no accepted applicant** (i.e. \`acceptedApplicationId\` is not set) —
covers \`pending\` and paused-before-acceptance jobs. Once an applicant has been accepted, editing is blocked.

Send files (up to 10) under the \`files\` field; they are appended to the existing job files.
All body fields are optional. If \`jobUrgency\` is changed, old conditional fields are cleared.
Object/array fields may be sent as JSON strings in multipart form data; empty optional fields are ignored.`,
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "jobId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the job", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { type: "object", properties: { files: { type: "array", items: { type: "string", format: "binary" }, description: "New files to append" }, title: { type: "string" }, description: { type: "string" }, jobUrgency: { type: "string", enum: ["right_now", "in_future", "regularly"] }, totalBudget: { type: "object", properties: { currency: { type: "string" }, amount: { type: "number" } } } } },
                            encoding: { files: { contentType: "application/octet-stream" } },
                            example: {
                                title: "Fix leaking kitchen sink (updated)",
                                description: "Updated description - need the work done by Friday.",
                                jobUrgency: "right_now",
                                jobDuration: { value: 2, unit: "days" },
                                totalBudget: { currency: "NGN", amount: 90000 },
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Job updated", content: { "application/json": { example: { message: "success", data: { _id: "64f5c0a1b2c3d4e5f6a7b8c9", title: "Fix leaking kitchen sink (updated)", status: "pending" } } } } },
                    "400": { description: "Job already has an accepted applicant", content: { "application/json": { example: { message: "You can only edit a job with no accepted applicant!" } } } },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Job not found" },
                },
            },
        },
        "/jobs/fetch-applicants": {
            get: {
                tags: ["Jobs"],
                summary: "Fetch job applicants (job poster view)",
                description: `Returns the applicants (applications/Projects) received on the logged-in user's jobs.

- Only the **job poster** sees applicants (results are scoped to jobs the user created).
- Optionally filter by \`jobId\` (must be one of the user's jobs) and/or application \`status\`.
- Each applicant includes their profile, application status, applied/accepted/rejected dates,
  bid details (biddable jobs) and quote.`,
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "jobId", in: "query", required: false, schema: { type: "string" }, description: "Filter by a specific job (ObjectId)", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
                    { name: "status", in: "query", required: false, schema: { type: "string", enum: ["pending", "accepted", "rejected", "completed", "cancelled"] }, description: "Filter by application status", example: "pending" },
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
                ],
                responses: {
                    "200": {
                        description: "Paginated list of applicants",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        total: 2,
                                        page: 1,
                                        limit: 10,
                                        applicants: [
                                            {
                                                _id: "64fc0a1b2c3d4e5f6a7b8c9a",
                                                job: { _id: "64f5c0a1b2c3d4e5f6a7b8c9", title: "Fix leaking kitchen sink", status: "pending", jobCategory: "Plumbing", service: "Repair" },
                                                user: { _id: "64e1a2b3c4d5e6f7a8b9c0d1", fullName: "Jane Artisan", userName: "jane_the_pro", email: "jane@example.com", profileImage: "https://cdn.emilist.com/avatar.jpg", level: "intermediate" },
                                                status: "pending",
                                                appliedAt: "2025-01-12T10:00:00.000Z",
                                                biddableDetails: { maximumPrice: 75000, milestones: [{ milestoneId: "64fb0a1b2c3d4e5f6a7b8c9b", amount: 40000, achievement: "Replace sink and connect pipes" }] },
                                                quote: null,
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                    "500": { description: "Server error" },
                },
            },
        },
        "/jobs/list-job/{jobId}": {
            patch: {
                tags: ["Jobs"],
                summary: "List a job (make it appear in public search)",
                description: "Sets `isListed = true` so the job appears again when users search for jobs. The poster must own the job.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "jobId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the job", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
                ],
                responses: {
                    "200": { description: "Job listed", content: { "application/json": { example: { message: "success", data: "Job listed successfully" } } } },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Job not found" },
                },
            },
        },
        "/jobs/delist-job/{jobId}": {
            patch: {
                tags: ["Jobs"],
                summary: "Delist a job (hide from public search)",
                description: "Sets `isListed = false` so the job stops appearing when users search for jobs. The poster must own the job. Works for jobs in any state (including active).",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "jobId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the job", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
                ],
                responses: {
                    "200": { description: "Job delisted", content: { "application/json": { example: { message: "success", data: "Job delisted successfully" } } } },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Job not found" },
                },
            },
        },
        "/jobs/update-application-status/{projectId}": {
            patch: {
                tags: ["Jobs"],
                summary: "Update a job application status",
                description: `Allows the job creator to accept, reject, pause or unpause an application.

Allowed \`status\` values: \`pending\`, \`accepted\`, \`rejected\`, \`pause\`, \`unpause\`.`,
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "projectId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the application/project", example: "64fc0a1b2c3d4e5f6a7b8c9a" },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["pending", "accepted", "rejected", "pause", "unpause", "cancelled"] } } },
                            example: { status: "accepted" },
                        },
                    },
                },
                responses: {
                    "200": { description: "Application status updated", content: { "application/json": { example: { message: "success", data: { _id: "64f5c0a1b2c3d4e5f6a7b8c9", status: "active", acceptedApplicationId: "64fc0a1b2c3d4e5f6a7b8c9a" } } } } },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Application or job not found" },
                },
            },
        },
        "/jobs/fetch-jobs-by-status": {
            get: {
                tags: ["Jobs"],
                summary: "Fetch the user's jobs filtered by status",
                description: "Returns the current user's jobs filtered by `status`, enriched with milestone progress, due dates and overdue flags.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "status", in: "query", required: true, schema: { type: "string", enum: ["pending", "completed", "active", "paused", "overdue"] }, description: "Job status to filter by", example: "active" },
                ],
                responses: {
                    "200": {
                        description: "Jobs matching the status",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: [
                                        {
                                            _id: "64f5c0a1b2c3d4e5f6a7b8c9",
                                            title: "Fix leaking kitchen sink",
                                            status: "active",
                                            milestoneProgress: "1/3",
                                            overallDueDate: "2025-01-20T09:30:00.000Z",
                                            currentMilestoneDueDate: "2025-01-13T09:30:00.000Z",
                                            isOverdue: false,
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/jobs/remove-job/{jobId}/file/{fileId}": {
            delete: {
                tags: ["Jobs"],
                summary: "Remove a file from a job",
                description: "Removes a file attachment from a job using the file id.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "jobId", in: "path", required: true, schema: { type: "string" }, example: "64f5c0a1b2c3d4e5f6a7b8c9" },
                    { name: "fileId", in: "path", required: true, schema: { type: "string" }, description: "ObjectId of the file inside job.jobFiles", example: "64fc0a1b2c3d4e5f6a7b8c9a" },
                ],
                responses: {
                    "200": { description: "File removed", content: { "application/json": { example: { message: "success", data: "Image deleted successfully" } } } },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Job not found" },
                },
            },
        },
        "/jobs/accept-direct-job/{projectId}": {
            patch: {
                tags: ["Jobs"],
                summary: "Accept or reject a direct job",
                description: `The invited expert accepts or rejects a direct job.

- \`accepted\` → job becomes \`active\`, first milestone becomes \`active\`.
- \`rejected\` → job returns to \`pending\` and type becomes \`regular\`.`,
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "projectId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the direct application/project", example: "64fc0a1b2c3d4e5f6a7b8c9a" },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { type: "object", required: ["status", "businessId"], properties: { status: { type: "string", enum: ["accepted", "rejected"] }, businessId: { type: "string" } } },
                            example: { status: "accepted", businessId: "64aa1b2c3d4e5f6a7b8c9ab" },
                        },
                    },
                },
                responses: {
                    "200": { description: "Status changed", content: { "application/json": { example: { message: "success", data: "Status changed successfully" } } } },
                    "400": { description: "Unauthorized expert", content: { "application/json": { example: { message: "Unauthorized!" } } } },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Application or job not found" },
                },
            },
        },
        "/jobs/fetch-applied-jobs-by-status": {
            get: {
                tags: ["Jobs"],
                summary: "Fetch jobs the user has applied to (by status)",
                description: "Returns a paginated list of jobs the current user applied to, optionally filtered by application `status`.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "status", in: "query", required: false, schema: { type: "string", enum: ["pending", "accepted", "rejected", "completed", "pause", "unpause", "cancelled"] }, description: "Application status filter", example: "pending" },
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
                    { name: "search", in: "query", required: false, schema: { type: "string" } },
                    { name: "title", in: "query", required: false, schema: { type: "string" } },
                    { name: "location", in: "query", required: false, schema: { type: "string" } },
                    { name: "category", in: "query", required: false, schema: { type: "string" } },
                    { name: "service", in: "query", required: false, schema: { type: "string" } },
                ],
                responses: {
                    "200": { description: "Paginated list of applied jobs", content: { "application/json": { example: { message: "success", data: { page: 1, limit: 10, jobs: [] } } } } },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/jobs/fetch-applications-by-status": {
            get: {
                tags: ["Jobs"],
                summary: "Fetch applications received on the user's jobs (by status)",
                description: "Returns a paginated list of applications/projects created on the user's jobs, optionally filtered by `status`.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "status", in: "query", required: false, schema: { type: "string", enum: ["pending", "accepted", "rejected", "completed", "pause", "unpause", "cancelled"] }, example: "pending" },
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
                ],
                responses: {
                    "200": { description: "Paginated list of applications", content: { "application/json": { example: { message: "success", data: { page: 1, limit: 10, applications: [] } } } } },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/jobs/update-milestone-status/{jobId}/milestone/{milestoneId}": {
            patch: {
                tags: ["Jobs"],
                summary: "Update milestone status",
                description: `The assigned expert (project.user) updates the status of a milestone.

- \`completed\` activates the next milestone and, when all are complete, sets the job & project to \`completed\`.
- \`note\` / \`additionalAmount\` can be attached to the milestone invoice when completing.`,
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "jobId", in: "path", required: true, schema: { type: "string" }, example: "64f5c0a1b2c3d4e5f6a7b8c9" },
                    { name: "milestoneId", in: "path", required: true, schema: { type: "string" }, example: "64fb0a1b2c3d4e5f6a7b8c9b" },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["pending", "overdue", "completed", "active", "paused"] }, note: { type: "string" }, additionalAmount: { type: "number" } } },
                            example: { status: "completed", note: "Work done and verified", additionalAmount: 5000 },
                        },
                    },
                },
                responses: {
                    "200": { description: "Milestone updated - returns the full job", content: { "application/json": { example: { message: "success", data: { _id: "64f5c0a1b2c3d4e5f6a7b8c9", status: "active", milestones: [{ _id: "64fb0a1b2c3d4e5f6a7b8c9b", status: "completed", invoice: { note: "Work done and verified", additionalAmount: 5000, invoiceRaised: true } }] } } } } },
                    "400": { description: "Cannot update a pending job milestone" },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Job, application or milestone not found" },
                },
            },
        },
        "/jobs/request-for-quote/{jobId}": {
            patch: {
                tags: ["Jobs"],
                summary: "Request for a quote on a job",
                description: "The job creator requests a new quote from the accepted expert. Job must be `active` or `paused`. Sets `isRequestForQuote = true`.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "jobId", in: "path", required: true, schema: { type: "string" }, example: "64f5c0a1b2c3d4e5f6a7b8c9" },
                ],
                responses: {
                    "200": { description: "Quote requested", content: { "application/json": { example: { message: "success", data: "Request for quote sent successfully" } } } },
                    "400": { description: "Job must be active or paused", content: { "application/json": { example: { message: "You can only request for quote on an active or paused job!" } } } },
                    "401": { description: "Unauthorized (creator only)" },
                    "404": { description: "Job not found" },
                },
            },
        },
        "/jobs/post-quote": {
            patch: {
                tags: ["Jobs"],
                summary: "Post a quote for a job",
                description: `The accepted expert posts a new quote after the creator requested one.

- Job must be \`active\` or \`paused\` and \`isRequestForQuote\` must be \`true\`.`,
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PostQuotePayload" },
                            example: {
                                jobId: "64f5c0a1b2c3d4e5f6a7b8c9",
                                totalAmount: 95000,
                                milestones: [
                                    { milestoneId: "64fb0a1b2c3d4e5f6a7b8c9b", amount: 50000, achievement: "Replace sink and connect pipes" },
                                    { milestoneId: "64fb0a1b2c3d4e5f6a7b8c9c", amount: 45000, achievement: "Test and clean up" },
                                ],
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Quote posted", content: { "application/json": { example: { message: "success", data: "Quote sent successfully" } } } },
                    "400": { description: "Job must be active/paused and quote must be requested" },
                    "401": { description: "Unauthorized (cannot quote on your own job)" },
                    "404": { description: "Job or project not found" },
                },
            },
        },
        "/jobs/update-quote-status/{projectId}": {
            patch: {
                tags: ["Jobs"],
                summary: "Accept or reject a posted quote",
                description: `The job creator accepts or rejects a quote posted on one of their projects.

- \`accepted\` → job becomes \`active\`, milestone amounts are updated from the quote.
- \`rejected\` → records the rejection time.`,
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "projectId", in: "path", required: true, schema: { type: "string" }, example: "64fc0a1b2c3d4e5f6a7b8c9a" },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["pending", "accepted", "rejected"] } } },
                            example: { status: "accepted" },
                        },
                    },
                },
                responses: {
                    "200": { description: "Quote status updated", content: { "application/json": { example: { message: "success", data: { _id: "64f5c0a1b2c3d4e5f6a7b8c9", status: "active", budget: 95000 } } } } },
                    "401": { description: "Unauthorized (creator only)" },
                    "404": { description: "Application or job not found" },
                },
            },
        },
        "/jobs/update-milestone-payment": {
            patch: {
                tags: ["Jobs"],
                summary: "Record a milestone payment (with optional receipt)",
                description: `The job creator records that a milestone has been paid. Sends the receipt image under the \`image\` field and the other fields as form values.`,
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["amountPaid", "paymentMethod", "date", "jobId", "milestoneId"],
                                properties: {
                                    image: { type: "string", format: "binary", description: "Payment receipt image" },
                                    amountPaid: { type: "number" },
                                    paymentMethod: { type: "string", enum: ["Card", "BankTransfer", "Wallet"] },
                                    date: { type: "string", example: "2025-01-12" },
                                    jobId: { type: "string" },
                                    milestoneId: { type: "string" },
                                    note: { type: "string" },
                                },
                            },
                            encoding: { image: { contentType: "application/octet-stream" } },
                            example: {
                                amountPaid: 50000,
                                paymentMethod: "BankTransfer",
                                date: "2025-01-12",
                                jobId: "64f5c0a1b2c3d4e5f6a7b8c9",
                                milestoneId: "64fb0a1b2c3d4e5f6a7b8c9b",
                                note: "First milestone payment",
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Milestone marked as paid", content: { "application/json": { example: { message: "success", data: { _id: "64f5c0a1b2c3d4e5f6a7b8c9", milestones: [{ _id: "64fb0a1b2c3d4e5f6a7b8c9b", paymentStatus: "paid", paymentInfo: { amountPaid: 50000, paymentMethod: "BankTransfer", date: "2025-01-12T00:00:00.000Z", note: "First milestone payment" } }] } } } } },
                    "400": { description: "Unauthorized or missing ids" },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Job or milestone not found" },
                },
            },
        },
        "/jobs/user-job-analytics": {
            get: {
                tags: ["Jobs"],
                summary: "Job analytics for the current user",
                description: "Returns job analytics (counts, totals, charts) for the authenticated user, optionally filtered by `year`, `month` or a date range.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "startDate", in: "query", required: false, schema: { type: "string", format: "date" }, example: "2025-01-01" },
                    { name: "endDate", in: "query", required: false, schema: { type: "string", format: "date" }, example: "2025-12-31" },
                    { name: "year", in: "query", required: false, schema: { type: "integer" }, example: 2025 },
                    { name: "month", in: "query", required: false, schema: { type: "integer" }, example: 1 },
                ],
                responses: {
                    "200": { description: "Job analytics", content: { "application/json": { example: { message: "success", data: { totalJobs: 5, activeJobs: 2, completedJobs: 1, pendingJobs: 2 } } } } },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/jobs/close-contract/{jobId}": {
            patch: {
                tags: ["Jobs"],
                summary: "Close a completed contract and leave a review",
                description: `Closes the contract for the job creator. All milestones must be \`completed\` and \`paid\`.

Leaves a review on the business that completed the job.`,
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "jobId", in: "path", required: true, schema: { type: "string" }, example: "64f5c0a1b2c3d4e5f6a7b8c9" },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["rating"],
                                properties: {
                                    rating: { type: "number", enum: [1, 2, 3, 4, 5], example: 5 },
                                    note: { type: "string", example: "Excellent work, very professional" },
                                    rateCommunication: { type: "number", example: 5 },
                                    isRecommendVendor: { type: "boolean", example: true },
                                },
                            },
                            example: { rating: 5, note: "Excellent work, very professional", rateCommunication: 5, isRecommendVendor: true },
                        },
                    },
                },
                responses: {
                    "200": { description: "Contract closed", content: { "application/json": { example: { message: "success", data: "Job closed successfully" } } } },
                    "400": { description: "All milestones must be completed & paid / contract already closed" },
                    "401": { description: "Unauthorized (creator only)" },
                    "404": { description: "Job, project or business not found" },
                },
            },
        },
        "/jobs/fetch-job-count-creator": {
            get: {
                tags: ["Jobs"],
                summary: "Fetch job counts for the job creator",
                description: "Returns counts of the current user's jobs grouped by status.",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "Job counts", content: { "application/json": { example: { message: "success", data: { pending: 2, active: 3, completed: 5, paused: 1, overdue: 0 } } } } },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/jobs/fetch-project-count": {
            get: {
                tags: ["Jobs"],
                summary: "Fetch project (application) counts for the current user",
                description: "Returns counts of applications/projects for the authenticated user.",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "Project counts", content: { "application/json": { example: { message: "success", data: { pending: 4, accepted: 2, rejected: 1, completed: 3 } } } } },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/jobs/user-project-analytics": {
            get: {
                tags: ["Jobs"],
                summary: "Project analytics for the current user",
                description: "Returns project (application) analytics for the authenticated user, optionally filtered by `year`, `month` or a date range.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "startDate", in: "query", required: false, schema: { type: "string", format: "date" }, example: "2025-01-01" },
                    { name: "endDate", in: "query", required: false, schema: { type: "string", format: "date" }, example: "2025-12-31" },
                    { name: "year", in: "query", required: false, schema: { type: "integer" }, example: 2025 },
                    { name: "month", in: "query", required: false, schema: { type: "integer" }, example: 1 },
                ],
                responses: {
                    "200": { description: "Project analytics", content: { "application/json": { example: { message: "success", data: { totalProjects: 10, accepted: 3, pending: 4, rejected: 3 } } } } },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/jobs/mute-job/{jobId}": {
            get: {
                tags: ["Jobs"],
                summary: "Mute a job",
                description: "Adds the job to the user's muted jobs so its notifications are hidden. You cannot mute your own job.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "jobId", in: "path", required: true, schema: { type: "string" }, example: "64f5c0a1b2c3d4e5f6a7b8c9" },
                ],
                responses: {
                    "200": { description: "Job muted", content: { "application/json": { example: { message: "success", data: "Job muted successfully" } } } },
                    "400": { description: "Cannot mute your own job", content: { "application/json": { example: { message: "You cannot mute your own job!" } } } },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Job not found" },
                },
            },
        },
        "/jobs/pay-for-job": {
            post: {
                tags: ["Jobs"],
                summary: "Pay for a job milestone",
                description: `Initiates payment for a job milestone.

- \`paymentMethod\`: \`Card\`, \`BankTransfer\` or \`Wallet\`
- \`currency\`: \`NGN\`, \`USD\`, \`GBP\`, \`EUR\``,
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PayForJobPayload" },
                            example: {
                                jobId: "64f5c0a1b2c3d4e5f6a7b8c9",
                                milestoneId: "64fb0a1b2c3d4e5f6a7b8c9b",
                                note: "Payment for milestone 1",
                                paymentMethod: "Card",
                                currency: "NGN",
                                isAdditionalAmount: false,
                                redirectUrl: "https://emilist.com/payment/callback",
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Payment initialized (returns payment link / authorization URL)",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        authorization_url: "https://checkout.paystack.com/xyz123",
                                        reference: "c0a1b2c3d4e5f6a7b8c9",
                                        access_code: "access_code_here",
                                        message: "Payment initialized",
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "Validation error" },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Job or milestone not found" },
                },
            },
        },
        "/jobs/leads": {
            get: {
                tags: ["Jobs"],
                summary: "Fetch job leads",
                description: `Returns job leads for the user's business. Requires an **active subscription** on a non-basic plan.`,
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
                ],
                responses: {
                    "200": { description: "Paginated job leads", content: { "application/json": { example: { message: "success", data: { page: 1, limit: 10, leads: [] } } } } },
                    "400": { description: "No active subscription / basic plan", content: { "application/json": { example: { message: "You do not have an active subscription." } } } },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/jobs/create-recurring-job": {
            post: {
                tags: ["Jobs"],
                summary: "Create a recurring job (maintenance plan)",
                description: `Creates a recurring/maintenance job.

- Provide \`jobId\` to convert an existing job, **or** supply the full job fields to create a new one.
- \`frequency\` accepts \`Weekly\`, \`Monthly\`, \`Quarterly\`.
- Files (up to 10) go under the \`files\` field.
Object/array fields (\`duration\`, \`milestones\`, \`reminderDates\`) may be sent as JSON strings in multipart form data; empty optional fields are ignored.`,
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { $ref: "#/components/schemas/CreateRecurringJobPayload" },
                            encoding: { files: { contentType: "application/octet-stream" } },
                            example: {
                                category: "Cleaning",
                                service: "Janitorial",
                                title: "Monthly office cleaning",
                                description: "Full office cleaning every month.",
                                duration: { number: 1, period: "months" },
                                location: "14 Bourdillon Road, Ikoyi, Lagos",
                                expertLevel: "three",
                                milestones: [
                                    { timeFrame: { number: 1, period: "months" }, achievement: "Full office deep clean", amount: 60000 },
                                ],
                                budget: 60000,
                                achievementDetails: "Monthly maintenance",
                                currency: "NGN",
                                artisan: "clean_king",
                                frequency: "Monthly",
                                startDate: "2025-02-01",
                                endDate: "2026-01-31",
                                reminderDates: [{ day: "Monday" }],
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Recurring job created",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        _id: "64fd0a1b2c3d4e5f6a7b8c9a",
                                        jobId: "64f5c0a1b2c3d4e5f6a7b8c9",
                                        frequency: "Monthly",
                                        startDate: "2025-02-01T00:00:00.000Z",
                                        endDate: "2026-01-31T00:00:00.000Z",
                                        nextMaintenanceDate: "2025-03-01T00:00:00.000Z",
                                        childJobs: [],
                                        reminderDates: [{ day: "Monday" }],
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "Validation error" },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Job or artisan user not found" },
                },
            },
        },
        "/jobs/fetch-recurring-jobs": {
            get: {
                tags: ["Jobs"],
                summary: "Fetch all recurring jobs for the current user",
                description: "Returns a paginated list of recurring jobs created by the authenticated user.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
                ],
                responses: {
                    "200": { description: "Paginated recurring jobs", content: { "application/json": { example: { message: "success", data: { page: 1, limit: 10, totalJobs: 1, jobs: [] } } } } },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/jobs/create-job": {
            post: {
                tags: ["Jobs"],
                summary: "Create a new job",
                description: `Creates a job posted by the logged-in user.

**Urgency rules** (field \`jobUrgency\`):
- \`right_now\`   → requires \`jobDuration\` + \`totalBudget\`
- \`in_future\`   → requires \`jobSchedule\` + \`estimatedBudget\`
- \`regularly\`   → requires \`jobFrequency\`, \`startDate\`, \`recurringBudget\`

**Direct hire** ("Hire experts directly" flow): pass \`expertId\` set to the
target expert's Business \`uniqueId\`. This assigns the job straight to that
expert instead of publishing it for applications/bids:
- \`allowBidding\` and \`experienceLevel\` are not collected on this flow and
  become optional — the server forces \`allowBidding=false\`, \`type=direct\`,
  and \`isDirectHire=true\` regardless of what's sent.
- All other shared fields (\`jobCategory\`, \`service\`, \`title\`, \`description\`,
  \`jobUrgency\` + its conditional block, \`location\`) are still required.
- A \`Project\` (direct-job invitation) is auto-created with
  \`directJobStatus=pending\` and the expert is notified by email; the expert then
  accepts or rejects it via \`PATCH /jobs/accept-direct-job/{projectId}\`.
- Include at least one \`milestone\` so the job can be activated on acceptance.
- \`expertId\` must reference an existing Business; a 404 is returned otherwise.

Pick the job type from the **Examples** dropdown to get a payload with exactly the
required fields for that type. Two media types are supported:

- \`multipart/form-data\` — use this when uploading files (field \`files\`, up to 10).
  Object/array fields may be sent as JSON strings
  (e.g. \`location\` = \`{"address":"...","lat":6.4,"lng":3.4}\`); empty optional fields are ignored.
- \`application/json\` — same fields as real JSON (no file uploads).`,
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { $ref: "#/components/schemas/CreateJobPayload" },
                            encoding: {
                                files: { contentType: "application/octet-stream" },
                            },
                            examples: {
                                right_now: {
                                    summary: "Immediate job (right_now)",
                                    value: {
                                        jobCategory: "Plumbing",
                                        service: "Repair",
                                        title: "Fix leaking kitchen sink",
                                        description: "Kitchen sink has been leaking for 2 days and needs urgent repair.",
                                        jobUrgency: "right_now",
                                        location: "{\"address\":\"12 Admiralty Way, Lekki, Lagos\",\"lat\":6.4281,\"lng\":3.4219}",
                                        allowBidding: "true",
                                        experienceLevel: "intermediate",
                                        jobDuration: "{\"value\":3,\"unit\":\"days\"}",
                                        totalBudget: "{\"currency\":\"NGN\",\"amount\":85000}",
                                        milestones: "[{\"timeFrame\":{\"number\":3,\"period\":\"days\"},\"achievement\":\"Replace sink and connect pipes\",\"amount\":40000},{\"timeFrame\":{\"number\":2,\"period\":\"days\"},\"achievement\":\"Test and clean up\",\"amount\":45000}]",
                                    },
                                },
                                in_future: {
                                    summary: "Scheduled job (in_future)",
                                    value: {
                                        jobCategory: "Cleaning",
                                        service: "Deep clean",
                                        title: "Deep clean apartment before move-in",
                                        description: "Full apartment deep clean scheduled ahead of move-in.",
                                        jobUrgency: "in_future",
                                        location: "{\"address\":\"4 Adeola Odeku, Victoria Island, Lagos\",\"lat\":6.4281,\"lng\":3.4219}",
                                        allowBidding: "true",
                                        experienceLevel: "junior",
                                        jobSchedule: "{\"startDate\":\"2025-03-01\",\"endDate\":\"2025-03-07\"}",
                                        estimatedBudget: "{\"currency\":\"NGN\",\"amount\":50000}",
                                        milestones: "[{\"timeFrame\":{\"number\":7,\"period\":\"days\"},\"achievement\":\"Full deep clean\",\"amount\":30000},{\"timeFrame\":{\"number\":7,\"period\":\"days\"},\"achievement\":\"Final inspection\",\"amount\":20000}]",
                                    },
                                },
                                regularly: {
                                    summary: "Recurring job (regularly)",
                                    value: {
                                        jobCategory: "Gardening",
                                        service: "Lawn mowing",
                                        title: "Weekly lawn mowing",
                                        description: "Mow the lawn every week for the next quarter.",
                                        jobUrgency: "regularly",
                                        location: "{\"address\":\"8 Bourdillon Road, Ikoyi, Lagos\",\"lat\":6.4478,\"lng\":3.4351}",
                                        allowBidding: "false",
                                        experienceLevel: "intermediate",
                                        jobFrequency: "weekly",
                                        startDate: "2025-02-01",
                                        endDate: "2025-04-30",
                                        recurringBudget: "{\"currency\":\"NGN\",\"amount\":15000,\"period\":\"weekly\"}",
                                        milestones: "[{\"timeFrame\":{\"number\":1,\"period\":\"months\"},\"achievement\":\"First month of lawn mowing\",\"amount\":15000}]",
                                    },
                                },
                                direct_hire: {
                                    summary: "Direct hire (Hire experts directly)",
                                    value: {
                                        jobCategory: "Construction",
                                        service: "Bricklayer",
                                        title: "Hotel Janitorial Service Needed Urgently",
                                        description: "Be as detailed as possible.",
                                        jobUrgency: "regularly",
                                        location: "{\"address\":\"112 General Ogomudia Lekki Phase 1, Lagos, Nigeria\"}",
                                        expertId: "a1b2c3d4",
                                        jobFrequency: "weekly",
                                        startDate: "2025-02-01",
                                        recurringBudget: "{\"currency\":\"NGN\",\"amount\":15000,\"period\":\"weekly\"}",
                                        milestones: "[{\"timeFrame\":{\"number\":3,\"period\":\"weeks\"},\"achievement\":\"Lay bricks for foundation\",\"amount\":25000,\"currency\":\"NGN\"},{\"timeFrame\":{\"number\":2,\"period\":\"weeks\"},\"achievement\":\"Finish and inspect\",\"amount\":25000,\"currency\":\"NGN\"}]",
                                    },
                                },
                            },
                        },
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateJobPayload" },
                            examples: {
                                right_now: {
                                    summary: "Immediate job (right_now)",
                                    value: {
                                        jobCategory: "Plumbing",
                                        service: "Repair",
                                        title: "Fix leaking kitchen sink",
                                        description: "Kitchen sink has been leaking for 2 days and needs urgent repair.",
                                        jobUrgency: "right_now",
                                        location: { address: "12 Admiralty Way, Lekki, Lagos", lat: 6.4281, lng: 3.4219 },
                                        allowBidding: true,
                                        experienceLevel: "intermediate",
                                        jobDuration: { value: 3, unit: "days" },
                                        totalBudget: { currency: "NGN", amount: 85000 },
                                        milestones: [
                                            { timeFrame: { number: 3, period: "days" }, achievement: "Replace sink and connect pipes", amount: 40000 },
                                            { timeFrame: { number: 2, period: "days" }, achievement: "Test and clean up", amount: 45000 },
                                        ],
                                    },
                                },
                                in_future: {
                                    summary: "Scheduled job (in_future)",
                                    value: {
                                        jobCategory: "Cleaning",
                                        service: "Deep clean",
                                        title: "Deep clean apartment before move-in",
                                        description: "Full apartment deep clean scheduled ahead of move-in.",
                                        jobUrgency: "in_future",
                                        location: { address: "4 Adeola Odeku, Victoria Island, Lagos", lat: 6.4281, lng: 3.4219 },
                                        allowBidding: true,
                                        experienceLevel: "junior",
                                        jobSchedule: { startDate: "2025-03-01", endDate: "2025-03-07" },
                                        estimatedBudget: { currency: "NGN", amount: 50000 },
                                        milestones: [
                                            { timeFrame: { number: 7, period: "days" }, achievement: "Full deep clean", amount: 30000 },
                                            { timeFrame: { number: 7, period: "days" }, achievement: "Final inspection", amount: 20000 },
                                        ],
                                    },
                                },
                                regularly: {
                                    summary: "Recurring job (regularly)",
                                    value: {
                                        jobCategory: "Gardening",
                                        service: "Lawn mowing",
                                        title: "Weekly lawn mowing",
                                        description: "Mow the lawn every week for the next quarter.",
                                        jobUrgency: "regularly",
                                        location: { address: "8 Bourdillon Road, Ikoyi, Lagos", lat: 6.4478, lng: 3.4351 },
                                        allowBidding: false,
                                        experienceLevel: "intermediate",
                                        jobFrequency: "weekly",
                                        startDate: "2025-02-01",
                                        endDate: "2025-04-30",
                                        recurringBudget: { currency: "NGN", amount: 15000, period: "weekly" },
                                        milestones: [
                                            { timeFrame: { number: 1, period: "months" }, achievement: "First month of lawn mowing", amount: 15000 },
                                        ],
                                    },
                                },
                                direct_hire: {
                                    summary: "Direct hire (Hire experts directly)",
                                    value: {
                                        jobCategory: "Construction",
                                        service: "Bricklayer",
                                        title: "Hotel Janitorial Service Needed Urgently",
                                        description: "Be as detailed as possible.",
                                        jobUrgency: "regularly",
                                        location: { address: "112 General Ogomudia Lekki Phase 1, Lagos, Nigeria" },
                                        expertId: "a1b2c3d4",
                                        jobFrequency: "weekly",
                                        startDate: "2025-02-01",
                                        recurringBudget: { currency: "NGN", amount: 15000, period: "weekly" },
                                        milestones: [
                                            { timeFrame: { number: 3, period: "weeks" }, achievement: "Lay bricks for foundation", amount: 25000, currency: "NGN" },
                                            { timeFrame: { number: 2, period: "weeks" }, achievement: "Finish and inspect", amount: 25000, currency: "NGN" },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Job created successfully",
                        content: {
                            "application/json": {
                                example: {
                                    message: "success",
                                    data: {
                                        _id: "64f5c0a1b2c3d4e5f6a7b8c9",
                                        jobCategory: "Plumbing",
                                        service: "Repair",
                                        title: "Fix leaking kitchen sink",
                                        description: "Kitchen sink has been leaking for 2 days and needs urgent repair.",
                                        jobUrgency: "right_now",
                                        location: { address: "12 Admiralty Way, Lekki, Lagos", lat: 6.4281, lng: 3.4219 },
                                        allowBidding: true,
                                        experienceLevel: "intermediate",
                                        jobDuration: { value: 3, unit: "days" },
                                        totalBudget: { currency: "NGN", amount: 85000 },
                                        type: "regular",
                                        status: "pending",
                                        userId: "64e1a2b3c4d5e6f7a8b9c0d1",
                                        applications: [],
                                        createdAt: "2025-01-10T09:30:00.000Z",
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "Validation error (missing/forbidden fields)", content: { "application/json": { example: { errors: ["Job category is required"] } } } },
                    "401": { description: "Unauthorized - missing or invalid token", content: { "application/json": { example: { message: "Kindly login" } } } },
                    "500": { description: "Server error" },
                },
            },
        },
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Paste the JWT returned by `POST /api/v1/auth/login`.",
            },
        },
        schemas: {
            Location: {
                type: "object",
                required: ["address"],
                properties: {
                    address: { type: "string", example: "12 Admiralty Way, Lekki, Lagos" },
                    lat: { type: "number", example: 6.4281 },
                    lng: { type: "number", example: 3.4219 },
                },
            },
            Budget: {
                type: "object",
                required: ["currency", "amount"],
                properties: {
                    currency: { type: "string", example: "NGN" },
                    amount: { type: "number", example: 85000 },
                },
            },
            RecurringBudget: {
                type: "object",
                required: ["currency", "amount", "period"],
                properties: {
                    currency: { type: "string", example: "NGN" },
                    amount: { type: "number", example: 60000 },
                    period: { type: "string", enum: ["weekly", "biweekly", "monthly"] },
                },
            },
            JobSchedule: {
                type: "object",
                required: ["startDate"],
                properties: {
                    startDate: { type: "string", format: "date", example: "2025-02-01" },
                    endDate: { type: "string", format: "date", example: "2025-02-28" },
                },
            },
            JobDuration: {
                type: "object",
                required: ["value", "unit"],
                properties: {
                    value: { type: "number", example: 3 },
                    unit: { type: "string", enum: ["hours", "days", "weeks", "months"], example: "days" },
                },
            },
            Milestone: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "64fb0a1b2c3d4e5f6a7b8c9b" },
                    timeFrame: {
                        type: "object",
                        properties: {
                            number: { type: "number", example: 5 },
                            period: { type: "string", enum: ["days", "weeks", "months", "years"], example: "days" },
                        },
                    },
                    achievement: { type: "string", example: "Replace sink and connect pipes" },
                    amount: { type: "number", example: 40000 },
                    status: { type: "string", enum: ["pending", "overdue", "completed", "active", "paused"], example: "pending" },
                    paymentStatus: { type: "string", enum: ["paid", "processing", "unpaid", "canceled"], example: "unpaid" },
                    paymentInfo: {
                        type: "object",
                        properties: {
                            amountPaid: { type: "number" },
                            paymentMethod: { type: "string", enum: ["Card", "BankTransfer", "Wallet"] },
                            date: { type: "string", format: "date" },
                            paymentReciept: { type: "string" },
                            note: { type: "string" },
                        },
                    },
                    datePaid: { type: "string", format: "date" },
                    invoice: {
                        type: "object",
                        properties: {
                            note: { type: "string" },
                            additionalAmount: { type: "number", default: 0 },
                            invoiceRaised: { type: "boolean", default: false },
                        },
                    },
                },
            },
            MilestoneInput: {
                type: "object",
                required: ["timeFrame", "achievement", "amount"],
                properties: {
                    timeFrame: {
                        type: "object",
                        required: ["number", "period"],
                        properties: {
                            number: { type: "number", example: 5 },
                            period: { type: "string", enum: ["days", "weeks", "months", "years"], example: "days" },
                        },
                    },
                    achievement: { type: "string", example: "Replace sink and connect pipes" },
                    amount: { type: "number", example: 40000 },
                    currency: { type: "string", example: "NGN" },
                },
            },
            CreateJobPayload: {
                type: "object",
                required: ["jobCategory", "service", "title", "description", "jobUrgency", "location"],
                description: "`allowBidding` and `experienceLevel` are required unless `expertId` is set (direct hire), in which case they are ignored and forced by the server (`allowBidding=false`, `type=direct`).",
                properties: {
                    files: { type: "array", items: { type: "string", format: "binary" }, description: "Job attachment files (up to 10)" },
                    jobCategory: { type: "string", example: "Plumbing" },
                    service: { type: "string", example: "Repair" },
                    title: { type: "string", example: "Fix leaking kitchen sink" },
                    description: { type: "string", example: "Kitchen sink has been leaking for 2 days." },
                    jobUrgency: { type: "string", enum: ["right_now", "in_future", "regularly"], example: "right_now" },
                    location: { $ref: "#/components/schemas/Location" },
                    allowBidding: { type: "boolean", example: true, description: "Required unless expertId (direct hire) is set" },
                    experienceLevel: { type: "string", enum: ["apprentice", "junior", "intermediate", "senior"], example: "intermediate", description: "Required unless expertId (direct hire) is set" },
                    expertId: { type: "string", description: "Business uniqueId to directly assign this job to an expert (\"Hire experts directly\" flow). When set, allowBidding/experienceLevel are optional and the server forces allowBidding=false, type=direct, isDirectHire=true. Include at least one milestone so acceptance can activate it." },
                    jobDuration: { $ref: "#/components/schemas/JobDuration", description: "Required when jobUrgency = right_now" },
                    totalBudget: { $ref: "#/components/schemas/Budget", description: "Required when jobUrgency = right_now" },
                    jobSchedule: { $ref: "#/components/schemas/JobSchedule", description: "Required when jobUrgency = in_future" },
                    estimatedBudget: { $ref: "#/components/schemas/Budget", description: "Required when jobUrgency = in_future" },
                    jobFrequency: { type: "string", enum: ["weekly", "biweekly", "monthly"], description: "Required when jobUrgency = regularly" },
                    startDate: { type: "string", format: "date", description: "Required when jobUrgency = regularly" },
                    endDate: { type: "string", format: "date" },
                    recurringBudget: { $ref: "#/components/schemas/RecurringBudget", description: "Required when jobUrgency = regularly" },
                    milestones: {
                        type: "array",
                        maxItems: 5,
                        description: "Optional milestones — can be used with any jobUrgency, including direct hire via expertId (max 5). Each milestone requires a timeFrame (number + period), achievement and amount; currency is optional.",
                        items: { $ref: "#/components/schemas/MilestoneInput" },
                    },
                },
            },
            ApplyJobPayload: {
                type: "object",
                required: ["jobId", "businessId", "type"],
                properties: {
                    jobId: { type: "string", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
                    businessId: { type: "string", example: "64aa1b2c3d4e5f6a7b8c9ab" },
                    type: { type: "string", enum: ["biddable", "regular"], example: "regular" },
                    maximumPrice: { type: "number", description: "Required when type = biddable", example: 75000 },
                    milestones: {
                        type: "array",
                        description: "Required when type = biddable",
                        items: {
                            type: "object",
                            required: ["milestoneId", "amount", "achievement"],
                            properties: {
                                milestoneId: { type: "string" },
                                amount: { type: "number" },
                                achievement: { type: "string" },
                            },
                        },
                    },
                },
            },
            PostQuotePayload: {
                type: "object",
                required: ["jobId", "totalAmount", "milestones"],
                properties: {
                    jobId: { type: "string" },
                    totalAmount: { type: "number", example: 95000 },
                    milestones: {
                        type: "array",
                        items: {
                            type: "object",
                            required: ["milestoneId", "amount", "achievement"],
                            properties: {
                                milestoneId: { type: "string" },
                                amount: { type: "number" },
                                achievement: { type: "string" },
                            },
                        },
                    },
                },
            },
            PayForJobPayload: {
                type: "object",
                required: ["jobId", "milestoneId", "paymentMethod", "currency", "redirectUrl"],
                properties: {
                    jobId: { type: "string" },
                    milestoneId: { type: "string" },
                    note: { type: "string" },
                    paymentMethod: { type: "string", enum: ["Card", "BankTransfer", "Wallet"] },
                    currency: { type: "string", enum: ["NGN", "USD", "GBP", "EUR"] },
                    isAdditionalAmount: { type: "boolean" },
                    redirectUrl: { type: "string", format: "uri" },
                },
            },
            CreateRecurringJobPayload: {
                type: "object",
                required: ["category", "service", "title", "description", "duration", "location", "expertLevel", "milestones", "budget", "frequency", "startDate", "endDate"],
                properties: {
                    files: { type: "array", items: { type: "string", format: "binary" } },
                    jobId: { type: "string", description: "Optional - convert an existing job into a recurring job" },
                    category: { type: "string", example: "Cleaning" },
                    service: { type: "string", example: "Janitorial" },
                    title: { type: "string", example: "Monthly office cleaning" },
                    description: { type: "string" },
                    duration: {
                        type: "object",
                        required: ["number", "period"],
                        properties: { number: { type: "number" }, period: { type: "string", enum: ["days", "weeks", "months", "years"] } },
                    },
                    location: { type: "string", example: "14 Bourdillon Road, Ikoyi, Lagos" },
                    expertLevel: { type: "string", enum: ["one", "two", "three", "four"], example: "three" },
                    milestones: {
                        type: "array",
                        maxItems: 5,
                        items: {
                            type: "object",
                            required: ["timeFrame", "achievement", "amount"],
                            properties: {
                                timeFrame: { type: "object", properties: { number: { type: "number" }, period: { type: "string" } } },
                                achievement: { type: "string" },
                                amount: { type: "number" },
                            },
                        },
                    },
                    budget: { type: "number", example: 60000 },
                    achievementDetails: { type: "string" },
                    currency: { type: "string", example: "NGN" },
                    artisan: { type: "string", description: "username/email of the artisan to assign", example: "clean_king" },
                    frequency: { type: "string", enum: ["Weekly", "Monthly", "Quarterly"], example: "Monthly" },
                    startDate: { type: "string", format: "date" },
                    endDate: { type: "string", format: "date" },
                    reminderDates: { type: "array", items: { type: "object", properties: { day: { type: "string" } } } },
                },
            },
        },
    },
};
