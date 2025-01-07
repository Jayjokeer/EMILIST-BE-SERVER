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
const mongoose_1 = __importDefault(require("mongoose"));
const users_model_1 = __importDefault(require("../models/users.model")); // Adjust path as necessary
const subscription_model_1 = __importDefault(require("../models/subscription.model")); // Adjust path as necessary
const plan_model_1 = __importDefault(require("../models/plan.model")); // Adjust path as necessary
const suscribtion_enum_1 = require("../enums/suscribtion.enum");
const plan_enum_1 = require("../enums/plan.enum");
const assignBasicPlanToUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Connecting to database...');
        yield mongoose_1.default.connect(''); // Replace with your connection string
        console.log('Database connected.');
        // Fetch the Basic plan
        const basicPlan = yield plan_model_1.default.findOne({ name: plan_enum_1.PlanEnum.basic, isActive: true });
        if (!basicPlan) {
            throw new Error('Basic plan not found. Ensure it exists in the database.');
        }
        // Fetch users without an active subscription
        const usersWithoutSubscription = yield users_model_1.default.find({ subscription: null });
        console.log(`Found ${usersWithoutSubscription.length} users without a subscription.`);
        const newSubscriptions = [];
        for (const user of usersWithoutSubscription) {
            // Calculate start and end dates based on the plan's duration
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + basicPlan.duration);
            // Create a subscription object for the user
            const newSubscription = new subscription_model_1.default({
                userId: user._id,
                planId: basicPlan._id,
                status: suscribtion_enum_1.SubscriptionStatusEnum.active,
                startDate,
                endDate,
                perks: basicPlan.perks,
            });
            // Save subscription and update user reference
            yield newSubscription.save();
            user.subscription = newSubscription._id;
            yield user.save();
            newSubscriptions.push({ userId: user._id, subscriptionId: newSubscription._id });
        }
        console.log(`Created subscriptions for ${newSubscriptions.length} users.`);
        mongoose_1.default.connection.close();
        console.log('Database connection closed.');
    }
    catch (error) {
        console.error('Error assigning Basic plan to users:', error);
        mongoose_1.default.connection.close();
        console.log('Database connection closed due to error.');
    }
});
// Run the script
assignBasicPlanToUsers();
