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
exports.ProductRoute = void 0;
const express_1 = require("express");
const productController = __importStar(require("../controllers/product.controller"));
const current_user_1 = require("../middlewares/current-user");
const product_validation_1 = require("../validations/product.validation");
const image_upload_1 = require("../utils/image-upload");
const paymentController = __importStar(require("../controllers/payment.controller"));
const router = (0, express_1.Router)();
exports.ProductRoute = router;
router.route("/create-product").post(current_user_1.userAuth, image_upload_1.multipleUpload, product_validation_1.validateProduct, productController.createProductController);
router.route("/fetch-product/:productId").get(productController.getSingleProductController);
router.route("/update-product/:productId").patch(current_user_1.userAuth, image_upload_1.multipleUpload, product_validation_1.validateUpdateProduct, productController.updateProductController);
router.route("/fetch-all-products").get(productController.getAllProductsController);
router.route("/delete-product/:productId").delete(current_user_1.userAuth, productController.deleteProductController);
router.route("/delete-product/:productId/image/:imageId").delete(current_user_1.userAuth, productController.deleteProductImageController);
router.route("/fetch-user-products").get(current_user_1.userAuth, productController.getUserProductsController);
router.route("/like-product/:productId").get(current_user_1.userAuth, productController.likeProductsController);
router.route("/unlike-product/:productId").get(current_user_1.userAuth, productController.unlikeProductsController);
router.route("/fetch-liked-products").get(current_user_1.userAuth, productController.fetchAllLikedProductsController);
router.route("/add-review").post(current_user_1.userAuth, product_validation_1.validateReviewProduct, productController.reviewProductController);
router.route("/pay-for-product").post(current_user_1.userAuth, product_validation_1.validatePayForProduct, paymentController.payforProductController);
router.route("/add-product-discount/:productId").patch(current_user_1.userAuth, product_validation_1.addDiscountToProductValidator, productController.addDiscountToProductController);
router.route("/fetch-similar-products/:productId").get(productController.fetchSimilarProductByUserController);
router.route("/fetch-other-products-by-user/:userId").get(productController.fetchOtherProductByUserController);
router.route("/fetch-product-reviews/:productId").get(productController.fetchProductReviewsController);
router.route("/compare-product/:productId").patch(current_user_1.userAuth, productController.compareProductController);
router.route("/fetch-compared-products").get(current_user_1.userAuth, productController.fetchAllComparedProductsController);
