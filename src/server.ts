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
import { Server } from "socket.io";
import http from "http";


import "../src/utils/passport";
import chatSocket from "./socket";
import "./jobs/subscription.job";
const PORT = config.port || 7000;
const app: Application = express();
const server = http.createServer(app);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet());
app.use(cors());
// require('../src/utils/script')
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
export const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
  },
});
app.use(passport.initialize());
app.use(passport.session());


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
