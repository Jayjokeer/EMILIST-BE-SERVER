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
exports.findExpiredSubscriptions = exports.getSubscriptionById = exports.getActiveSubscriptionWithoutDetails = exports.getActiveSubscription = exports.createSubscription = void 0;
const suscribtion_enum_1 = require("../enums/suscribtion.enum");
const subscription_model_1 = __importDefault(require("../models/subscription.model"));
const createSubscription = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscription_model_1.default.create(data);
});
exports.createSubscription = createSubscription;
const getActiveSubscription = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscription_model_1.default.findOne({ userId, status: suscribtion_enum_1.SubscriptionStatusEnum.active }).populate('planId');
});
exports.getActiveSubscription = getActiveSubscription;
const getActiveSubscriptionWithoutDetails = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscription_model_1.default.findOne({ userId, status: suscribtion_enum_1.SubscriptionStatusEnum.active });
});
exports.getActiveSubscriptionWithoutDetails = getActiveSubscriptionWithoutDetails;
const getSubscriptionById = (subscriptionId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscription_model_1.default.findById(subscriptionId);
});
exports.getSubscriptionById = getSubscriptionById;
const findExpiredSubscriptions = () => __awaiter(void 0, void 0, void 0, function* () {
    const currentDate = new Date();
    return yield subscription_model_1.default.find({
        endDate: { $lte: currentDate },
        status: suscribtion_enum_1.SubscriptionStatusEnum.active,
    });
});
exports.findExpiredSubscriptions = findExpiredSubscriptions;
