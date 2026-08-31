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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePromoController = exports.updatePromoController = exports.fetchSellerPromosController = exports.adminCreatePromoController = exports.createPromoController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const error_1 = require("../errors/error");
const promoService = __importStar(require("../services/promo.service"));
const normalizeCode = (code) => code.trim().toUpperCase();
// Resolves the code string for a new promo: custom codes must be globally
// unique, generated ones are retried until unique.
const resolveNewPromoCode = async (requestedCode) => {
    if (requestedCode) {
        const code = normalizeCode(requestedCode);
        const existing = await promoService.fetchPromoByExactCode(code);
        if (existing)
            throw new error_1.BadRequestError("This promo code is already taken");
        return code;
    }
    let code = promoService.generatePromoCodeString();
    for (let attempt = 0; attempt < 10; attempt++) {
        const existing = await promoService.fetchPromoByExactCode(code);
        if (!existing)
            return code;
        code = promoService.generatePromoCodeString();
    }
    throw new error_1.BadRequestError("Could not generate a unique promo code, please try again");
};
const createPromoForSeller = async (sellerId, body) => {
    const { code, productIds, discountPercentage, expiryDate, isSingleUse } = body;
    await promoService.validateProductsForSeller(productIds, sellerId);
    const finalCode = await resolveNewPromoCode(code);
    return await promoService.createPromo({
        code: finalCode,
        discountPercentage,
        expiryDate,
        isSingleUse: Boolean(isSingleUse),
        sellerId,
        productIds,
    });
};
// Seller creates a promo code scoped to specific product(s) in their inventory
exports.createPromoController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const promo = await createPromoForSeller(req.user._id, req.body);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, promo);
});
// Admin creates a product-scoped promo code on behalf of a seller
exports.adminCreatePromoController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const promo = await createPromoForSeller(req.body.sellerId, req.body);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, promo);
});
// Seller lists their own promo codes
exports.fetchSellerPromosController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const promos = await promoService.fetchSellerPromos(req.user._id);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, promos);
});
exports.updatePromoController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const promo = await promoService.fetchPromoById(req.params.id);
    if (!promo)
        throw new error_1.NotFoundError("Promo code not found");
    if (String(promo.sellerId) !== String(req.user._id))
        throw new error_1.ForbiddenError("You can only manage your own promo codes");
    const { discountPercentage, expiryDate, isActive, productIds } = req.body;
    if (productIds)
        await promoService.validateProductsForSeller(productIds, req.user._id);
    if (expiryDate && new Date(expiryDate).getTime() <= Date.now())
        throw new error_1.BadRequestError("Expiry date must be in the future");
    const updated = await promoService.updatePromo(req.params.id, {
        ...(discountPercentage !== undefined && { discountPercentage }),
        ...(expiryDate !== undefined && { expiryDate }),
        ...(isActive !== undefined && { isActive }),
        ...(productIds !== undefined && { productIds }),
    });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, updated);
});
exports.deletePromoController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const promo = await promoService.fetchPromoById(req.params.id);
    if (!promo)
        throw new error_1.NotFoundError("Promo code not found");
    if (String(promo.sellerId) !== String(req.user._id))
        throw new error_1.ForbiddenError("You can only manage your own promo codes");
    await promoService.deletePromo(req.params.id);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, { message: `Promo code ${promo.code} deleted` });
});
