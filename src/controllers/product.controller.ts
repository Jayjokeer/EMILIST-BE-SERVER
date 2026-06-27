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
import * as userService from "../services/auth.service";

export const createProductController = catchAsync(
  async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const payload = { ...req.body };

    payload.userId = userId;

    if (req.files && Array.isArray(req.files)) {
      payload.images = (req.files as Express.Multer.File[]).map((file) => ({
        imageUrl: file.path,
        isPrimary: false,
      }));
    }

    const subscription = await subscriptionService.getActiveSubscription(userId);

    if (!subscription) {
      throw new BadRequestError("You do not have an active subscription.");
    }

    const productPerk = subscription.perks.find(
      (perk) => perk.name === SubscriptionPerksEnum.product
    );

    if (!productPerk) {
      throw new BadRequestError(
        "Your subscription does not include product creation."
      );
    }

    if (productPerk.used >= productPerk.limit) {
      throw new BadRequestError(
        "Product creation limit reached for your subscription."
      );
    }

    const data = await productService.createProduct(userId, payload);

    // increment usage
    productPerk.used += 1;
    await subscription.save();

    return successResponse(res, StatusCodes.CREATED, data);
  }
);
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
  const { userId } = req.query;

  const product = await productService.fetchProductByIdWithDetails(productId);
  if (!product) {
    throw new NotFoundError("Product not found!");
  }

  let liked = false;
  let isCompared = false;

  if (userId) {
    const likedProduct = await productService.ifLikedProduct(productId, userId as string);
    liked = !!likedProduct;

    const user = await userService.findUserById(userId as string);
    if (user) {
      isCompared = user.comparedProducts.some((id: any) => id.toString() === productId);
    }
  }

  const reviewAggregation = await reviewService.fetchReviewForProduct(productId, 1, 4);
  const review = reviewAggregation[0] || {
    averageRating: 0,
    numberOfRatings: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [],
  };

  const data = {
    product,
    liked,
    isCompared,
    averageRating: review.averageRating || 0,
    numberOfRatings: review.numberOfRatings || 0,
    ratingDistribution: review.ratingDistribution,
    reviewsData: review.reviews || [],
  };

  return successResponse(res, StatusCodes.OK, data);
});
  

export const getAllProductsController = catchAsync(async (req: JwtPayload, res: Response) => {

    const userId = req.query.userId ? req.query.userId : null; 

    const products = await productService.fetchAllProducts(req.query);
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

    // const imageIndex = product.images?.findIndex(
    //     (image: { _id: any }) => image._id.toString() === imageId
    // );

    // if (imageIndex === -1) {
    //     throw new NotFoundError("Image not found");
    // }

    // product.images?.splice(imageIndex, 1);
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
    // product.reviews?.push(String(data._id));
    await product.save()
    return successResponse(res, StatusCodes.OK, data);
});

export const addDiscountToProductController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {productId} = req.params;
    const {discount} = req.body;

    const product = await productService.fetchProductById(productId);
    if(!product){
        throw new NotFoundError("Product not found!");
    }
    if(String(product.userId) !== String(userId)){
        throw new UnauthorizedError("Unauthorized!");
    }

    product.discountedPrice = discount;
    product.isDiscounted = true;
    await product.save();
    return successResponse(res, StatusCodes.OK, "Discount added successfully!");
});

export const fetchOtherProductByUserController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {userId} = req.params; 
    const {page = 1, limit = 10 } = req.query;

     const data = await productService.otherProductsByUser(userId, page, limit);
   return successResponse(res, StatusCodes.OK, data);
  });

  export const fetchSimilarProductByUserController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {productId} = req.params; 
    const {page = 1, limit = 10 , userId} = req.query;

     const data = await productService.fetchSimilarProducts(productId, limit, page , userId); 
   return successResponse(res, StatusCodes.OK, data);
  });
  export const fetchProductReviewsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {productId} = req.params; 
    const {page = 1, limit = 10, sortBy } = req.query;

     const data = await productService.fetchProductReviews(productId, Number(page), Number(limit), sortBy);
  return  successResponse(res, StatusCodes.OK, data);
  });

  export const compareProductController = catchAsync (async(req: JwtPayload, res: Response)=>{
    const userId = req.user._id;
const {productId} = req.params;
const product = await productService.fetchProductById(productId);
if(!product){

    throw new NotFoundError("No product found!");
};
    const user = await userService.findUserById(userId);
    if(!user){
        throw new NotFoundError("User not found");
    }

    const productIndex = user.comparedProducts.findIndex(
        (id: any) => id.toString() === productId
      );
    
    if (productIndex  !== -1) {
      user.comparedProducts.splice(productIndex , 1);
    } else {
      user.comparedProducts.push(productId);
    }
  
    await user.save();
  
    return successResponse(res, StatusCodes.OK, {
      message: "Compared products updated successfully",
      comparedProducts: user.comparedProducts,
    });

});

export const fetchAllComparedProductsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const user = await userService.findUserById(userId);
    if(!user){
        throw new NotFoundError("User not found");
    };
    const products = await productService.fetchAllComparedProducts(user.comparedProducts);
    
    return successResponse(res, StatusCodes.OK, products);
});

export const getProductReviewsController = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { page = "1", limit = "4", search } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const reviewAggregation = await reviewService.fetchReviewForProduct(
    String(productId),
    pageNum,
    limitNum
  );

  const review = reviewAggregation[0] || {
    averageRating: 0,
    numberOfRatings: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [],
  };

  const data = {
    averageRating: review.averageRating || 0,
    numberOfRatings: review.numberOfRatings || 0,
    ratingDistribution: review.ratingDistribution,
    reviews: review.reviews || [],
    pagination: {
      page: pageNum,
      limit: limitNum,
      hasMore: review.reviews?.length === limitNum,
    },
  };

  return successResponse(res, StatusCodes.OK, data);
});