import { JwtPayload } from "jsonwebtoken";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors/error";
import * as promoService from "../services/promo.service";

const normalizeCode = (code: string) => code.trim().toUpperCase();

// Resolves the code string for a new promo: custom codes must be globally
// unique, generated ones are retried until unique.
const resolveNewPromoCode = async (requestedCode?: string) => {
  if (requestedCode) {
    const code = normalizeCode(requestedCode);
    const existing = await promoService.fetchPromoByExactCode(code);
    if (existing) throw new BadRequestError("This promo code is already taken");
    return code;
  }
  let code = promoService.generatePromoCodeString();
  for (let attempt = 0; attempt < 10; attempt++) {
    const existing = await promoService.fetchPromoByExactCode(code);
    if (!existing) return code;
    code = promoService.generatePromoCodeString();
  }
  throw new BadRequestError("Could not generate a unique promo code, please try again");
};

const createPromoForSeller = async (sellerId: string, body: any) => {
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
export const createPromoController = catchAsync(async (req: JwtPayload, res: Response) => {
  const promo = await createPromoForSeller(req.user._id, req.body);
  return successResponse(res, StatusCodes.CREATED, promo);
});

// Admin creates a product-scoped promo code on behalf of a seller
export const adminCreatePromoController = catchAsync(async (req: JwtPayload, res: Response) => {
  const promo = await createPromoForSeller(req.body.sellerId, req.body);
  return successResponse(res, StatusCodes.CREATED, promo);
});

// Seller lists their own promo codes
export const fetchSellerPromosController = catchAsync(async (req: JwtPayload, res: Response) => {
  const promos = await promoService.fetchSellerPromos(req.user._id);
  return successResponse(res, StatusCodes.OK, promos);
});

export const updatePromoController = catchAsync(async (req: JwtPayload, res: Response) => {
  const promo: any = await promoService.fetchPromoById(req.params.id);
  if (!promo) throw new NotFoundError("Promo code not found");
  if (String(promo.sellerId) !== String(req.user._id)) throw new ForbiddenError("You can only manage your own promo codes");

  const { discountPercentage, expiryDate, isActive, productIds } = req.body;
  if (productIds) await promoService.validateProductsForSeller(productIds, req.user._id);
  if (expiryDate && new Date(expiryDate).getTime() <= Date.now()) throw new BadRequestError("Expiry date must be in the future");

  const updated = await promoService.updatePromo(req.params.id, {
    ...(discountPercentage !== undefined && { discountPercentage }),
    ...(expiryDate !== undefined && { expiryDate }),
    ...(isActive !== undefined && { isActive }),
    ...(productIds !== undefined && { productIds }),
  });
  return successResponse(res, StatusCodes.OK, updated);
});

export const deletePromoController = catchAsync(async (req: JwtPayload, res: Response) => {
  const promo: any = await promoService.fetchPromoById(req.params.id);
  if (!promo) throw new NotFoundError("Promo code not found");
  if (String(promo.sellerId) !== String(req.user._id)) throw new ForbiddenError("You can only manage your own promo codes");
  await promoService.deletePromo(req.params.id);
  return successResponse(res, StatusCodes.OK, { message: `Promo code ${promo.code} deleted` });
});