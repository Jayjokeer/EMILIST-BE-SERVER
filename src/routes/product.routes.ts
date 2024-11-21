import { Router, Request, Response } from "express";
import * as productController from "../controllers/product.controller";
import { userAuth } from "../middlewares/current-user";
import { validateProduct, validateReviewProduct, validateUpdateProduct } from "../validations/product.validation";
import { multipleUpload } from "../utils/image-upload";

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

export { router as ProductRoute };