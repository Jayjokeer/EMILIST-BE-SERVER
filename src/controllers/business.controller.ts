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
import * as reviewService from "../services/review.service";
import { ExpertTypeEnum } from "../enums/business.enum";

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
    const data = await businessService.fetchSingleBusinessWithDetails(String(businessId));
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
    const { 
        page = 1,
        limit = 10, 
        startPriceRange,
        expertType,
        minRating,
        minReviews,
        location,
        noticePeriod,
        userId,
        search,
    } = req.query;
    
    const filters=  {
        startPriceRange,
        expertType,
        minRating,
        minReviews,
        location,
        noticePeriod
      }
    const data = await businessService.fetchAllBusiness( 
    userId,   
    Number(page),
    Number(limit),
    filters,
    search,
);
    return  successResponse(res,StatusCodes.OK, data);
});

export const deleteBusinessController =  catchAsync( async (req: JwtPayload, res: Response) => {
    const { businessId} = req.params;
     await businessService.deleteBusiness( businessId );
    return  successResponse(res,StatusCodes.OK, "Business deleted!");
});
export const reviewBusinessController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {businessId, rating, comment} = req.body;

    const business = await businessService.fetchSingleBusiness(businessId);
    if(!business){
        throw new NotFoundError("Business not found!")
    }
    if(String(business.userId) == String(userId)){
        throw new BadRequestError("You cannot review your own service!");
    }
    const isReviewed = await reviewService.isReviewedbyUser(businessId, userId);
    if(isReviewed){
        throw new BadRequestError("You have previously reviewed this business!");
    }
    const payload ={
        businessId,
        userId, 
        rating, 
        comment
    }
    const data = await reviewService.addReview(payload);
    business.reviews?.push(String(data._id));
    await business.save();
    return successResponse(res, StatusCodes.OK, data);
});
export const compareBusinessController = catchAsync (async(req: JwtPayload, res: Response)=>{
    const userId = req.user._id;
const {businessId} = req.params;
const business = await businessService.fetchSingleBusiness(businessId);
if(!business){

    throw new NotFoundError("No service found!");
}
    const user = await authService.findUserById(userId);
    if(!user){
        throw new NotFoundError("User not found");
    }

    const businessIndex = user.comparedBusinesses.findIndex(
        (id: any) => id.toString() === businessId
      );
    
    if (businessIndex !== -1) {
      user.comparedBusinesses.splice(businessIndex, 1);
    } else {
      user.comparedBusinesses.push(businessId);
    }
  
    await user.save();
  
    return successResponse(res, StatusCodes.OK, {
      message: "Compared businesses updated successfully",
      comparedBusinesses: user.comparedBusinesses,
    });

});

export const fetchAllComparedBusinessesController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const user = await authService.findUserById(userId);
    if(!user){
        throw new NotFoundError("User not found");
    };
    const businesses = await businessService.fetchAllComparedBusinesses(user.comparedBusinesses);
    
    return successResponse(res, StatusCodes.OK, businesses);
});

export const likeBusinessController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user.id;
  const { businessId} = req.params;

    
    const business = await businessService.fetchSingleBusiness(businessId)
    if (!business ) {
        throw new NotFoundError("Service not found!");
    };


    const existingLike = await businessService.ifLikedBusiness(businessId, userId);
    if(existingLike) {
        throw new BadRequestError("Service previously liked!");
    };

    const data = await businessService.createBusinessLike({business: businessId, user: userId});
 
   return successResponse(res,StatusCodes.CREATED, data);
});

export const unlikeBusinessController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user.id; 
    const {businessId} = req.params;
     const data = await businessService.unlikeBusiness(businessId, userId);
   return successResponse(res, StatusCodes.OK, data);
  });

  export const fetchOtherBusinessByUserController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {userId} = req.params; 

     const data = await businessService.otherBusinessesByUser(userId);
    return successResponse(res, StatusCodes.OK, data);
  });

  export const fetchSimilarBusinessByUserController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {businessId} = req.params; 

     const data = await businessService.fetchSimilarBusinesses(businessId);
   return successResponse(res, StatusCodes.OK, data);
  });

  export const fetchBusinessReviewsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {businessId} = req.params; 
    const {page = 1, limit = 10, sortBy } = req.query;

     const data = await businessService.fetchBusinessReviews(businessId, Number(page), Number(limit), sortBy);
    return successResponse(res, StatusCodes.OK, data);
  });

export const markReviewController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {reviewId} = req.params; 
    const {userId, isHelpful } = req.body;

     const data = await businessService.markReviewHelpful(reviewId, isHelpful, userId);
   return successResponse(res, StatusCodes.CREATED, data);
  });