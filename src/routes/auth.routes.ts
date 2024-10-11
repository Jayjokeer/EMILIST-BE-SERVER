import { Router, Request, Response } from "express";

const router = Router();

router
  .route("/")
  .get((req: Request,res: Response) =>{
    res.json({message: "Welcome to Emlist"})
  }
  );

  export { router as AuthRoute};