import mongoose from 'mongoose';
import User from '../models/users.model'; // Adjust path as necessary
import Subscription from '../models/subscription.model'; // Adjust path as necessary
import Plan from '../models/plan.model'; // Adjust path as necessary
import { SubscriptionStatusEnum } from '../enums/suscribtion.enum';
import { PlanEnum } from '../enums/plan.enum';

const assignBasicPlanToUsers = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(''); // Replace with your connection string
    console.log('Database connected.');

    // Fetch the Basic plan
    const basicPlan = await Plan.findOne({ name: PlanEnum.basic, isActive: true });
    if (!basicPlan) {
      throw new Error('Basic plan not found. Ensure it exists in the database.');
    }

    // Fetch users without an active subscription
    const usersWithoutSubscription = await User.find({ subscription: null });

    console.log(`Found ${usersWithoutSubscription.length} users without a subscription.`);

    const newSubscriptions = [];

    for (const user of usersWithoutSubscription) {
      // Calculate start and end dates based on the plan's duration
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + basicPlan.duration);

      // Create a subscription object for the user
      const newSubscription = new Subscription({
        userId: user._id,
        planId: basicPlan._id,
        status: SubscriptionStatusEnum.active,
        startDate,
        endDate,
        perks: basicPlan.perks,
      });

      // Save subscription and update user reference
      await newSubscription.save();
      user.subscription = newSubscription._id;
      await user.save();

      newSubscriptions.push({ userId: user._id, subscriptionId: newSubscription._id });
    }

    console.log(`Created subscriptions for ${newSubscriptions.length} users.`);
    mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error assigning Basic plan to users:', error);
    mongoose.connection.close();
    console.log('Database connection closed due to error.');
  }
};

// Run the script
assignBasicPlanToUsers();
