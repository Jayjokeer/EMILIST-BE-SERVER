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
exports.SubscribeRoute = void 0;
const express_1 = require("express");
const subscrbtionController = __importStar(require("../controllers/subcribtion.controller"));
const current_user_1 = require("../middlewares/current-user");
const subscription_validation_1 = require("../validations/subscription.validation");
const planController = __importStar(require("../controllers/plan.controller"));
const router = (0, express_1.Router)();
exports.SubscribeRoute = router;
router.route("/get-user-subscription").get(current_user_1.userAuth, subscrbtionController.getUserSubscription);
router.route("/subscribe-plan").post(current_user_1.userAuth, subscription_validation_1.validateSubscriptionPayment, subscrbtionController.subscribeToPlan);
router.route("/create-plan").post(current_user_1.adminAuth, planController.createPlanController);
router.route("/get-plans").get(planController.getPlansController);
