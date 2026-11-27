import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { NextFunction, Request, Response } from "express";
import * as expertService from "../services/private-expert.service";
import { sendEmail } from "../utils/send_email";
import { sendPrivateExpertMessage } from "../utils/templates";
import { config } from "../utils/config";

export const createExpertController = catchAsync( async (req: Request, res: Response) => {
    const expertData = req.body;
    const {fullName,
         phoneNumber,
         email, 
         typeOfExpert, 
         level,
         details,
        location,
        availability
    } = expertData; 
    const firstAvailability = Array.isArray(availability) ? availability[0] : availability;
    const { time, date } = firstAvailability || {};

         if(req.file){
            expertData.fileUrl = req.file.path;
         };

    const data = await expertService.createPrivateExpert(expertData);
    const { html, subject } = sendPrivateExpertMessage(fullName,
        phoneNumber,
        email, 
        typeOfExpert, 
        level,
        details,
        location,
        time,
        date

    );


    await sendEmail(config.adminEmail, subject, html); 
   return successResponse(res,StatusCodes.CREATED, data);
});

