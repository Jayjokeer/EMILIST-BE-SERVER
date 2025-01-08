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
const node_cron_1 = __importDefault(require("node-cron"));
const suscribtion_enum_1 = require("../enums/suscribtion.enum");
const subscriptionService = __importStar(require("../services/subscription.service"));
const planService = __importStar(require("../services/plan.service"));
const plan_enum_1 = require("../enums/plan.enum");
const error_1 = require("../errors/error");
const userService = __importStar(require("../services/auth.service"));
node_cron_1.default.schedule('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    // cron.schedule('*/30 * * * * *', async () => {
    console.log('Running subscription expiration check at midnight...');
    try {
        const expiredSubscriptions = yield subscriptionService.findExpiredSubscriptions();
        if (expiredSubscriptions.length > 0) {
            console.log(`Found ${expiredSubscriptions.length} expired subscriptions. Updating their status...`);
            const plan = yield planService.getPlanByName(plan_enum_1.PlanEnum.basic);
            if (!plan)
                throw new error_1.NotFoundError("Plan not found!");
            for (const subscription of expiredSubscriptions) {
                const basicSubscription = yield subscriptionService.createSubscription({ userId: subscription.userId, planId: plan._id, startDate: new Date(), perks: plan.perks });
                const user = yield userService.findUserById(String(subscription.userId));
                if (!user) {
                    throw new error_1.NotFoundError("User not found");
                }
                user.subscription = basicSubscription._id;
                yield user.save();
                subscription.status = suscribtion_enum_1.SubscriptionStatusEnum.expired;
                yield subscription.save();
            }
            console.log(`Updated subscriptions to "basic".`);
        }
        else {
            console.log('No expired subscriptions found.');
        }
    }
    catch (error) {
        console.error('Error during subscription expiration check:', error);
    }
}));
