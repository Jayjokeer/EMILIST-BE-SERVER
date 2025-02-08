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
exports.BusinessRoute = void 0;
const express_1 = require("express");
const businesController = __importStar(require("../controllers/business.controller"));
const current_user_1 = require("../middlewares/current-user");
const image_upload_1 = require("../utils/image-upload");
const business_validation_1 = require("../validations/business.validation");
const router = (0, express_1.Router)();
exports.BusinessRoute = router;
router.route("/register-business").post(current_user_1.userAuth, image_upload_1.uploadBusinessImages, business_validation_1.validateBusinessRegistration, businesController.createBusinessController);
router.route("/update-business/:businessId").patch(current_user_1.userAuth, image_upload_1.uploadBusinessImages, business_validation_1.validateBusinessUpdate, businesController.updateBusinessController);
router.route("/fetch-single-business/:businessId").get(businesController.fetchSingleBusinessController);
router.route("/fetch-user-business").get(current_user_1.userAuth, businesController.fetchUserBusinessController);
router.route("/delete-business/:businessId/image/:imageId").delete(current_user_1.userAuth, businesController.deleteBusinessImageController);
router.route("/fetch-all-business").get(businesController.fetchAllBusinessController);
router.route("/delete-business/:businessId").delete(current_user_1.userAuth, businesController.deleteBusinessController);
router.route("/compare-business/:businessId").patch(current_user_1.userAuth, businesController.compareBusinessController);
router.route("/fetch-compared-business").get(current_user_1.userAuth, businesController.fetchAllComparedBusinessesController);
router.route("/like-business/:businessId").patch(current_user_1.userAuth, businesController.likeBusinessController);
router.route("/unlike-business/:businessId").patch(current_user_1.userAuth, businesController.unlikeBusinessController);
router.route("/fetch-other-business-by-user/:userId").get(businesController.fetchOtherBusinessByUserController);
router.route("/fetch-similar-business-by-user/:businessId").get(businesController.fetchSimilarBusinessByUserController);
router.route("/fetch-business-reviews/:businessId").get(businesController.fetchBusinessReviewsController);
router.route("/mark-helpul-review/:reviewId").patch(business_validation_1.validateMarkBusinessReview, businesController.markReviewController);
router.route("/mute-business/:businessId").patch(current_user_1.userAuth, businesController.muteBusinessController);
