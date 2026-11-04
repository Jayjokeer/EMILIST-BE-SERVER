import { Router } from "express";
import { userAuth } from "../middlewares/current-user";
import { createSupportRequestController } from "../controllers/support.controller";
import { validateCreateSupportRequest } from "../validations/admin.validation";

const router = Router();

router.post("/requests", userAuth, validateCreateSupportRequest, createSupportRequestController);

export { router as SupportRoute };
