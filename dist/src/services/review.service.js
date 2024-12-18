"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReviewedbyUser = exports.isUserReviewed = exports.addReview = void 0;
const review_model_1 = __importDefault(require("../models/review.model"));
const addReview = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield review_model_1.default.create(payload);
});
exports.addReview = addReview;
const isUserReviewed = (productId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield review_model_1.default.findOne({ userId: userId, productId: productId });
});
exports.isUserReviewed = isUserReviewed;
const isReviewedbyUser = (businessId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield review_model_1.default.findOne({ userId: userId, businessId: businessId });
});
exports.isReviewedbyUser = isReviewedbyUser;
