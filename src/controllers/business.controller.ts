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
import * as  authService from "../services/auth.service";


export const createBusinessController = catchAsync( async (req: JwtPayload, res: Response) => {
    const businessData = req.body;
    const userId = req.user._id;
    businessData.userId  = userId;
    const user = await authService.findUserById(String(userId));
    if(!user){
        throw new NotFoundError("user not found!");
    }
    if (req.files && req.files['profileImage'] && req.files['profileImage'][0]) {
        businessData.profileImage = req.files['profileImage'][0].path;
    }

    if (req.files && req.files['businessImages']) {
        businessData.businessImages = req.files['businessImages'].map((file: Express.Multer.File) => ({
            imageUrl: file.path
        }));
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
    user.businesses?.push(data._id);
    await user.save();

   return successResponse(res,StatusCodes.CREATED, data);
});

export const updateBusinessController = catchAsync( async (req: JwtPayload, res: Response) => {
    const businessData = req.body;
    const { businessId} = req.params;

    const data = await businessService.updateBusiness( businessId,businessData, req.files);
    if(String(data.userId) !== String(req.user._id)){
        throw new UnauthorizedError("Unauthorized");
    }
    return  successResponse(res,StatusCodes.OK, data);
});

export const fetchUserBusinessController = catchAsync( async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const data = await businessService.fetchUserBusiness( userId);

    return successResponse(res,StatusCodes.OK, data);
});
export const fetchSingleBusinessController = catchAsync( async (req: JwtPayload, res: Response) => {
    const {businessId} = req.params;
    const data = await businessService.fetchSingleBusiness(String(businessId));
    return  successResponse(res,StatusCodes.OK, data);
});
export const deleteBusinessImageController = catchAsync( async (req: JwtPayload, res: Response) => {
    const {businessId, imageId} = req.params;
    const business= await businessService.fetchSingleBusiness(String(businessId));
    if(!business){
        throw new NotFoundError("Business not found!");
    }
    if(String(business.userId) !== String(req.user._id)){
        throw new UnauthorizedError("Unauthorized");
    }
    const imageIndex = business.businessImages?.findIndex(
        (image: { _id: any }) => image._id.toString() === imageId
    );

    if (imageIndex === -1) {
        throw new NotFoundError("Image not found");
    }

    business.businessImages?.splice(imageIndex, 1);

    await business.save();
    const data = await businessService.fetchSingleBusiness(String(businessId));

    return successResponse(res,StatusCodes.OK, data);
});
export const fetchAllBusinessController = catchAsync( async (req: JwtPayload, res: Response) => {
    const { page = 1, limit = 10} = req.query;

    const data = await businessService.fetchAllBusiness(    
        Number(page),
    Number(limit),);
    return  successResponse(res,StatusCodes.OK, data);
});

export const deleteBusinessController =  catchAsync( async (req: JwtPayload, res: Response) => {
    const { businessId} = req.params;
     await businessService.deleteBusiness( businessId );
    return  successResponse(res,StatusCodes.OK, "Business deleted!");
});