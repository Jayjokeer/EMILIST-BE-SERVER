import { Router } from "express";
import { AuthRoute } from "./auth.routes";
import { JobsRoute } from "./jobs.routes";
import {BusinessRoute} from "./business.routes";
const router = Router(); 

router.use("/auth", AuthRoute);
router.use("/jobs", JobsRoute);
router.use("/business", BusinessRoute);
export default router;