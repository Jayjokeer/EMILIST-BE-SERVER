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
exports.PromoRoute = void 0;
const express_1 = require("express");
const promoController = __importStar(require("../controllers/promo.controller"));
const current_user_1 = require("../middlewares/current-user");
const promo_validation_1 = require("../validations/promo.validation");
const router = (0, express_1.Router)();
exports.PromoRoute = router;
// Seller promo code management - codes are product/seller scoped and can only
// discount the seller's own products
router.route("/").post(current_user_1.userAuth, promo_validation_1.validateCreatePromo, promoController.createPromoController);
router.route("/").get(current_user_1.userAuth, promoController.fetchSellerPromosController);
router.route("/:id").patch(current_user_1.userAuth, promo_validation_1.validateUpdatePromo, promoController.updatePromoController);
router.route("/:id").delete(current_user_1.userAuth, promoController.deletePromoController);
// Admin can create a product-scoped code on behalf of a seller
router.route("/admin").post(current_user_1.adminAuth, promo_validation_1.validateAdminCreatePromo, promoController.adminCreatePromoController);
