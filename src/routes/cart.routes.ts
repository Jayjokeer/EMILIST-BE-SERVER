import { Router, Request, Response } from "express";
import * as cartController from "../controllers/cart.controller";
import { userAuth } from "../middlewares/current-user";
import { validateAddToCart } from "../validations/cart.validation";

const router = Router();

router.route("/add-to-cart").post(userAuth,validateAddToCart, cartController.addToCartController);
router.route("/checkout").post(userAuth, cartController.checkoutCartController);
router.route("/reduce-quantity/:productId").patch(userAuth, cartController.decreaseCartProductQuantityController);
router.route("/increase-quantity/:productId").patch(userAuth, cartController.increaseCartProductQuantityController);
router.route("/remove-from-cart/:productId").patch(userAuth, cartController.removeFromCartController);
router.route("/apply-discount-code").post(userAuth, cartController.applyDiscountCode);
router.route("/generate-discount-code").post(userAuth, cartController.generateDiscountCode);//this should be for admin


export { router as CartRoute };