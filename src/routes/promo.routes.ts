import { Router } from "express";
import * as promoController from "../controllers/promo.controller";
import { adminAuth, userAuth } from "../middlewares/current-user";
import { validateAdminCreatePromo, validateCreatePromo, validateUpdatePromo } from "../validations/promo.validation";

const router = Router();

// Seller promo code management - codes are product/seller scoped and can only
// discount the seller's own products
router.route("/").post(userAuth, validateCreatePromo, promoController.createPromoController);
router.route("/").get(userAuth, promoController.fetchSellerPromosController);
router.route("/:id").patch(userAuth, validateUpdatePromo, promoController.updatePromoController);
router.route("/:id").delete(userAuth, promoController.deletePromoController);

// Admin can create a product-scoped code on behalf of a seller
router.route("/admin").post(adminAuth, validateAdminCreatePromo, promoController.adminCreatePromoController);

export { router as PromoRoute };