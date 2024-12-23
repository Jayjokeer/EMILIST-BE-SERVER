import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as productService from "../services/product.service";
import { IProduct } from "../interfaces/product.interface";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors/error";
import * as reviewService from "../services/review.service";
import * as subscriptionService from "../services/subscription.service";
import { SubscriptionPerksEnum } from "../enums/suscribtion.enum";

export const createProductController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const payload = req.body;
  
    payload.userId = userId;
  
    if (req.files) {
      payload.images = req.files.map((file: Express.Multer.File) => ({
        imageUrl: file.path,
      }));
    }
  
    const subscription = await subscriptionService.getActiveSubscription(userId);
  
    if (!subscription) {
        throw new BadRequestError("You do not have an active subscription.");
    }
  
//     const productPerk = subscription.perks.find((perk) => perk.name === SubscriptionPerksEnum.product );
  
//     if (!productPerk) {
//         throw new BadRequestError("You do not have the required subscription to create products.");
//     }
  
//     if (productPerk.planId.used >= productPerk..planId.limit) {
// throw new BadRequestError("You have reached the limit of products you can create.");}
  
    const data = await productService.createProduct(payload);
  
    // productPerk.used += 1;
    await subscription.save();
  
    return successResponse(res, StatusCodes.CREATED, data);
  });
export const updateProductController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {productId} = req.params;
    const updates: IProduct= req.body;
    const files = req.files;
    const product = await productService.fetchProductById(productId);

    if(String(product?.userId) != String(userId)){
        throw new UnauthorizedError("Unauthorized!");
    }
  

    if(!product){
        throw new NotFoundError("Product not found!");
    }

    
    Object.keys(updates).forEach((key) => {
        (product as any)[key] = updates[key as keyof IProduct];
      });
      if (files && files.length > 0) {
        const newImages = files.map((file: any) => ({
            imageUrl: file.path,
        }));
        product.images.push(...newImages);
    }
      await product.save();
    const data = await productService.fetchProductById(productId);
    return successResponse(res, StatusCodes.OK, data);
  });   

  export const getSingleProductController = catchAsync(async (req: JwtPayload, res: Response) => {
    const { productId } = req.params;
    const product = await productService.fetchProductByIdWithDetails(productId);
    const { userId } = req.query;
  
    if (!product) {
      throw new NotFoundError("Product not found!");
    }
  
    let liked = false;
    if (userId) {
      const likedProduct = await productService.ifLikedProduct(productId, userId);
      liked = !!likedProduct;
    }
  
    const reviewAggregation = await productService.fetchReviewForProduct(productId);
    const review = reviewAggregation[0] || { averageRating: 0, numberOfRatings: 0, reviews: [] };
  
    const data = {
      product,
      liked,
      averageRating: review.averageRating || 0,
      numberOfRatings: review.numberOfRatings || 0,
      reviewsData: review.reviews || [], 
    };
  
    return successResponse(res, StatusCodes.OK, data);
  });
  

export const getAllProductsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {
        page = 1, 
        limit = 10,
        priceRange,
        minRating,
        minReviews,
        isPrimeMember,
    } = req.query;
    const userId = req.query.userId ? req.query.userId : null; 
    const filters ={
        priceRange,
        minRating,
        minReviews,
        isPrimeMember,
    };
    const products = await productService.fetchAllProducts(Number(page), Number(limit), userId, filters);
    const data = products;
    return successResponse(res, StatusCodes.OK, data);
});
export const deleteProductController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {productId} = req.params;

    const product = await productService.fetchProductById(productId);
    if(String(product?.userId) !== String(userId)){
        throw new UnauthorizedError("Unauthorized!");
    }
    if(!product){
        throw new NotFoundError("Product not found!");
    }
    await productService.deleteProduct(productId);
    return successResponse(res, StatusCodes.OK, "Product deleted successfully!");
});

export const deleteProductImageController = catchAsync(async (req: JwtPayload, res: Response) => {
    const  userId = req.user._id;
    const {productId, imageId} = req.params;

    const product = await productService.fetchProductById(productId);
    if(String(product?.userId) !== String(userId)){
        throw new UnauthorizedError("Unauthorized!");
    }
    if(!product){
        throw new NotFoundError("Product not found!");
    }

    const imageIndex = product.images?.findIndex(
        (image: { _id: any }) => image._id.toString() === imageId
    );

    if (imageIndex === -1) {
        throw new NotFoundError("Image not found");
    }

    product.images?.splice(imageIndex, 1);
    await product.save();
    return successResponse(res, StatusCodes.OK, "Image deleted successfully!");
});
export const getUserProductsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {page = 1, limit = 10} = req.query;

    const products = await productService.fetchUserProducts(userId,Number(page), Number(limit));
    const data = products;
    return successResponse(res, StatusCodes.OK, data);
});
export const likeProductsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {productId} = req.params;

    const product = await productService.fetchProductById(productId);
    if(!product){
        throw new NotFoundError("Product not found!")
    };
    const existingLike = await productService.ifLikedProduct(productId, userId);
    if(existingLike) {
        throw new BadRequestError("Product previously liked!");
    };

    await productService.createProductLike({
        product: productId,
        user: userId
    });

    return successResponse(res, StatusCodes.OK, "Liked successfully");
});
export const fetchAllLikedProductsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {page = 1, limit = 10} = req.query;
    const data = await productService.fetchLikedProducts(userId, page, limit);

    return successResponse(res, StatusCodes.OK, data);
});
export const unlikeProductsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {productId} = req.params;

    const product = await productService.fetchProductById(productId);
    if(!product){
        throw new NotFoundError("Product not found!")
    }
    await productService.unlikeProduct(productId, userId);

    return successResponse(res, StatusCodes.OK, "Unliked successfully");
});

export const reviewProductController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {productId, rating, comment} = req.body;

    const product = await productService.fetchProductById(productId);
    if(!product){
        throw new NotFoundError("Product not found!")
    }
    if(String(product.userId) == String(userId)){
        throw new BadRequestError("You cannot review your own product!");
    }
    const isReviewed = await reviewService.isUserReviewed(productId, userId);
    if(isReviewed){
        throw new BadRequestError("You have previously reviewed this product!");
    }
    const payload ={
        productId,
        userId, 
        rating, 
        comment
    }
    const data = await reviewService.addReview(payload);
    product.reviews?.push(String(data._id));
    await product.save()
    return successResponse(res, StatusCodes.OK, data);
});