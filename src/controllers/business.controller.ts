import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { NextFunction, Request, Response } from "express";
import * as jobService from "../services/job.service";
import { IJob, IMilestone, IUpdateJob } from "../interfaces/jobs.interface";
import { JwtPayload } from "jsonwebtoken";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors/error";
import IBusiness from "../interfaces/business.interface";
import * as  businessService from "../services/business.service";


export const createBusinessController = catchAsync( async (req: JwtPayload, res: Response) => {
    const businessData = req.body;
    const userId = req.user._id;
    businessData.userId  = userId;
    if (req.files && req.files['profileImage'] && req.files['profileImage'][0]) {
        businessData.profileImage = req.files['profileImage'][0].path;
    }
    
    if ( businessData.certification ) {
        businessData.certification.forEach((certData: any, index: number) => {
            let certificatePath;
            if(req.files && req.files['certificate']  && req.files['certificate'][index] ){
                certificatePath =  req.files['certificate'][index].path
                businessData.certification[index].certificate =  certificatePath;

            }
        });
    }
    
    const data = await businessService.createBusiness(businessData);

    successResponse(res,StatusCodes.CREATED, data);
});
