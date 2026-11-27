require("dotenv").config();
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from 'cors';
import { connectDB } from '../db/database';
import { config } from "./utils/config";
import  router  from "./routes";
import { webhookRouter } from "./routes/webhook.routes";
import  globalErrorHandler  from "./errors/error-handler";
import AppError from "./errors/error";
import passport from "passport";
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { Server } from "socket.io";
import http from "http";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger";
import "../src/utils/passport";
import chatSocket from "./socket";
import "./jobs/subscription.job";
import "./jobs/planned-maintenance.job";
import "./jobs/invoice-payment-reminder.job";
import "./jobs/contract-close-reminder.job";
import { corsOptions } from "./utils/cors";
import { AUTH_SESSION_MAX_AGE } from "./utils/auth-session";
import { allowedFrontendOrigins } from "./utils/frontend-origin";

const PORT = config.port || 7000;
const app: Application = express();
const server = http.createServer(app);

// Required for secure cookies when TLS is terminated by the deployment proxy.
app.set("trust proxy", 1);

// Middleware
app.use(cookieParser());
// Paystack webhook must receive the exact raw request body for HMAC-SHA512
// signature verification, so it is mounted BEFORE express.json.
app.use(
  "/api/v1/webhooks",
  express.raw({ type: "application/json" }),
  webhookRouter
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet());
app.use((req, res, next) => {
  res.vary("Origin");
  next();
});
app.use(cors(corsOptions));
app.use(morgan("combined"));
// require('../src/utils/script')
app.use(session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions' 
    }),
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: AUTH_SESSION_MAX_AGE,
    }
}));
export const io = new Server(server, {
  cors: {
    origin: Array.from(allowedFrontendOrigins),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
  },
});
app.use(passport.initialize());
app.use(passport.session());


// Swagger / OpenAPI documentation for the HTTP API
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/v1/", router); 

chatSocket(io);

app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404)); 
});

app.use(globalErrorHandler); 


server.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`Server started on port ${PORT} 🔥🔥🔥`);
  } catch (error) {
    console.error(`Error connecting to the database: ${(error as Error).message}`);
    process.exit(1); 
  }
});
