import { Router } from "express";
import { AuthRoute } from "./auth.routes";
import { JobsRoute } from "./jobs.routes";
import {BusinessRoute} from "./business.routes";
import { ChatRoute } from "./chat.route";
import { ProductRoute } from "./product.routes";
import { CartRoute } from "./cart.routes";
import { NotificationRoute } from "./notification.routes";
const router = Router(); 

router.use("/auth", AuthRoute);
router.use("/jobs", JobsRoute);
router.use("/business", BusinessRoute);
router.use("/chat", ChatRoute );
router.use("/material", ProductRoute)
router.use("/cart", CartRoute)
router.use("/notification", NotificationRoute)

export default router;