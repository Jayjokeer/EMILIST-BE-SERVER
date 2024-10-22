import { Router } from "express";
import { AuthRoute } from "./auth.routes";
import { JobsRoute } from "./jobs.routes";

const router = Router();

router.use("/auth", AuthRoute);
router.use("/jobs", JobsRoute);
export default router;