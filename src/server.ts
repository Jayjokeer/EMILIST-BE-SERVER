require("dotenv").config();
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from 'cors';
import { connectDB } from '../db/database';
import { AuthRoute } from "./routes/auth.routes";

const PORT = process.env.PORT || 7000;
const app: Application = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet());
app.use(cors());

// Routes
app.use("/api/v1/", AuthRoute); 


// Server initialization with DB connection
app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`Server started on port ${PORT} 🔥🔥🔥`);
  } catch (error) {
    console.error(`Error connecting to the database: ${(error as Error).message}`);
    process.exit(1); // Exit on DB connection error
  }
});
