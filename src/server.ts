require("dotenv").config();
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from 'cors';
import { connectDB } from '../db/database';
import { config } from "./utils/config";
import  router  from "./routes";
import  globalErrorHandler  from "./errors/error-handler";
import AppError from "./errors/error";
import passport from "passport";
import session from 'express-session';
import MongoStore from 'connect-mongo';

import "../src/utils/passport";

const PORT = config.port || 7000;
const app: Application = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet());
app.use(cors());

app.use(session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions' 
    }),
    cookie: { secure: false } 
}));

app.use(passport.initialize());
app.use(passport.session());


// Routes
app.use("/api/v1/", router); 
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404)); // Send a 404 error for any undefined routes
});

app.use(globalErrorHandler); 


app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`Server started on port ${PORT} 🔥🔥🔥`);
  } catch (error) {
    console.error(`Error connecting to the database: ${(error as Error).message}`);
    process.exit(1); 
  }
});
