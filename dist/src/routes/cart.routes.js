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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartRoute = void 0;
const express_1 = require("express");
const cartController = __importStar(require("../controllers/cart.controller"));
const current_user_1 = require("../middlewares/current-user");
const cart_validation_1 = require("../validations/cart.validation");
const router = (0, express_1.Router)();
exports.CartRoute = router;
router.route("/add-to-cart").post(current_user_1.userAuth, cart_validation_1.validateAddToCart, cartController.addToCartController);
router.route("/checkout").post(current_user_1.userAuth, cartController.checkoutCartController);
router.route("/reduce-quantity/:productId").patch(current_user_1.userAuth, cartController.decreaseCartProductQuantityController);
router.route("/increase-quantity/:productId").patch(current_user_1.userAuth, cartController.increaseCartProductQuantityController);
router.route("/remove-from-cart/:productId").patch(current_user_1.userAuth, cartController.removeFromCartController);
router.route("/apply-discount-code").post(current_user_1.userAuth, cartController.applyDiscountCode);
router.route("/generate-discount-code").post(current_user_1.userAuth, cartController.generateDiscountCode); //this should be for admin
