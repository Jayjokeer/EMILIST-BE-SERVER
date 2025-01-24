import { Router, Request, Response } from "express";
import * as productController from "../controllers/product.controller";
import { userAuth } from "../middlewares/current-user";
import { addDiscountToProductValidator, validatePayForProduct, validateProduct, validateReviewProduct, validateUpdateProduct } from "../validations/product.validation";
import { multipleUpload } from "../utils/image-upload";
import * as paymentController from "../controllers/payment.controller";

const router = Router();

router.route("/create-product").post(userAuth,multipleUpload,validateProduct , productController.createProductController);
router.route("/fetch-product/:productId").get(productController.getSingleProductController);
router.route("/update-product/:productId").patch(userAuth, multipleUpload,validateUpdateProduct, productController.updateProductController);
router.route("/fetch-all-products").get( productController.getAllProductsController);
router.route("/delete-product/:productId").delete(userAuth, productController.deleteProductController);
router.route("/delete-product/:productId/image/:imageId").delete(userAuth, productController.deleteProductImageController);
router.route("/fetch-user-products").get( userAuth, productController.getUserProductsController);
router.route("/like-product/:productId").get( userAuth, productController.likeProductsController);
router.route("/unlike-product/:productId").get( userAuth, productController.unlikeProductsController);
router.route("/fetch-liked-products").get( userAuth, productController.fetchAllLikedProductsController);
router.route("/add-review").post(userAuth,validateReviewProduct , productController.reviewProductController);
router.route("/pay-for-product").post(userAuth,validatePayForProduct , paymentController.payforProductController);
router.route("/add-product-discount/:productId").patch(userAuth,addDiscountToProductValidator, productController.addDiscountToProductController);
router.route("/fetch-similar-products/:productId").get( productController.fetchSimilarProductByUserController);
router.route("/fetch-other-products-by-user/:userId").get( productController.fetchOtherProductByUserController);
router.route("/fetch-product-reviews/:productId").get( productController.fetchProductReviewsController);
router.route("/compare-product/:productId").patch(userAuth, productController.compareProductController);
router.route("/fetch-compared-products").get(userAuth, productController.fetchAllComparedProductsController);

export { router as ProductRoute };