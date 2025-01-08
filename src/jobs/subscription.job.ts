import cron from 'node-cron';
import { SubscriptionStatusEnum } from '../enums/suscribtion.enum';
import * as  subscriptionService from '../services/subscription.service';
import * as planService from '../services/plan.service';
import { PlanEnum } from '../enums/plan.enum';
import { NotFoundError } from '../errors/error';
import * as userService from '../services/auth.service';

cron.schedule('0 0 * * *', async () => {
    // cron.schedule('*/30 * * * * *', async () => {

    console.log('Running subscription expiration check at midnight...');
  
    try {
  
      const expiredSubscriptions = await  subscriptionService.findExpiredSubscriptions();
  
      if (expiredSubscriptions.length > 0) {
        console.log(
          `Found ${expiredSubscriptions.length} expired subscriptions. Updating their status...`
        );
        
        const plan = await planService.getPlanByName(PlanEnum.basic); 
        if(!plan) throw new NotFoundError("Plan not found!");
        for (const subscription of expiredSubscriptions) {
            const basicSubscription = await subscriptionService.createSubscription({userId: subscription.userId, planId: plan._id, startDate: new Date(), perks: plan.perks});
            const user = await userService.findUserById(String(subscription.userId));
            if(!user){
                throw new NotFoundError("User not found");
            }
            user.subscription = basicSubscription._id;
            await user.save();
            subscription.status = SubscriptionStatusEnum.expired;
            await subscription.save();
        }


  
        console.log(
          `Updated subscriptions to "basic".`
        );
      } else {
        console.log('No expired subscriptions found.');
      }
    } catch (error) {
      console.error('Error during subscription expiration check:', error);
    }
  });
