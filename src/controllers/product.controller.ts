import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as productService from "../services/product.service";
import { IProduct } from "../interfaces/product.interface";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../errors/error";


export const createProductController = catchAsync(async (req: JwtPayload, res: Response) => {
    const { userId} = req.user._id;
    const payload: IProduct= req.body;
    payload.userId = userId;
    const data = await productService.createProduct(payload)
    successResponse(res, StatusCodes.OK, data);
  });   
export const updateProductController = catchAsync(async (req: JwtPayload, res: Response) => {
    const { userId} = req.user._id;
    const {productId} = req.params;
    const product = await productService.fetchProductById(productId);
    if(!product){
        throw new NotFoundError("Product not found!");
    }

    const payload: IProduct= req.body;

    const data = await productService.createProduct(payload)
    successResponse(res, StatusCodes.OK, data);
  });   