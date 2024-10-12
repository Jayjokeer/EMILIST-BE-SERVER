import { Router, Request, Response } from "express";
import * as authController from "../controllers/auth.controller"; // Ensure the path is correct

const router = Router();

router.route("/").get((req: Request, res: Response) => {
  res.json({ message: "Welcome to Emlist" });
});

router.route("/sign-up").post(authController.registerUserController);
router.route("/login").post(authController.login);

export { router as AuthRoute };
