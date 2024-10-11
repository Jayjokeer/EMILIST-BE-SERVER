require("dotenv").config();
import express, { Application, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import cors from 'cors';
const PORT = 7000;
const app: Application = express();

app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true }));
app.use(helmet());
app.use(cors());

// app.use("/api/v1",);


app.listen(PORT, () => {
    console.log(`Server started on port ${PORT} 🔥🔥🔥`);
 });