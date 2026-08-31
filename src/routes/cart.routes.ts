import { Router, Request, Response } from "express";
import * as cartController from "../controllers/cart.controller";
import { adminAuth, userAuth } from "../middlewares/current-user";
import { validateAddToCart, validateApplyPromo, validateCheckout } from "../validations/cart.validation";

const router = Router();

router.route("/add-to-cart").post(userAuth,validateAddToCart, cartController.addToCartController);
router.route("/checkout").post(userAuth, validateCheckout, cartController.checkoutCartController);
router.route("/reduce-quantity/:productId").patch(userAuth, cartController.decreaseCartProductQuantityController);
router.route("/increase-quantity/:productId").patch(userAuth, cartController.increaseCartProductQuantityController);
router.route("/remove-from-cart/:productId").patch(userAuth, cartController.removeFromCartController);
router.route("/clear").delete(userAuth, cartController.clearCartController);
router.route("/apply-discount-code").post(userAuth, validateApplyPromo, cartController.applyPromoCodeController);
router.route("/remove-promo-code/:code").delete(userAuth, cartController.removePromoCodeController);
router.route("/get-cart-items").get(userAuth, cartController.getCartController);

export { router as CartRoute };
