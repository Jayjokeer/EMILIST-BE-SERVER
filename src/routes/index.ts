import { Router } from "express";
import { AuthRoute } from "./auth.routes";
import { JobsRoute } from "./jobs.routes";
import {BusinessRoute} from "./business.routes";
import { ChatRoute } from "./chat.route";
import { ProductRoute } from "./product.routes";
import { CartRoute } from "./cart.routes";
import { NotificationRoute } from "./notification.routes";
import { WalletRoute } from "./wallet.routes";
import { TransactionRoute } from "./transaction.routes";
import { ExpertRoute } from "./private-expert";
import { TargetRoute } from "./target.routes";
import { SubscribeRoute } from "./subscription.routes";
const router = Router(); 

router.use("/auth", AuthRoute);
router.use("/jobs", JobsRoute);
router.use("/business", BusinessRoute);
router.use("/chat", ChatRoute );
router.use("/material", ProductRoute);
router.use("/cart", CartRoute);
router.use("/notification", NotificationRoute);
router.use("/wallet", WalletRoute);
router.use("/transaction", TransactionRoute);
router.use("/expert", ExpertRoute);
router.use("/target", TargetRoute);
router.use("/subscription", SubscribeRoute);

export default router;