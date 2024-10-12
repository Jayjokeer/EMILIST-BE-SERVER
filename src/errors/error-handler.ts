import { Request, Response, NextFunction } from 'express';
import AppError from './error';

const handleMongoDBErrors = (err: any) => {
    if (err.code === 11000) {
      const message = `Duplicate field value: ${Object.values(err.keyValue).join(', ')}`;
      return new AppError(message, 400);
    }
    return err;
  };

// export const globalErrorHandler = (
//   err: AppError,
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//     if (err.name === 'MongoError' || err.statusCode === 11000) {
//         err = handleMongoDBErrors(err);
//       }
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//   console.error('Error 💥:', err);

//   return res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message,
//     stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
//   });
// };

export const catchAsync = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err: any) => next(err)); // Forward error to global error handler
  };
};
const globalErrorHandler = (
  err: AppError, 
  req: Request, 
  res: Response, 
  next: NextFunction // You need to have all four arguments for Express to recognize this as an error handler
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    code: err.statusCode,
    status: err.status,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default globalErrorHandler;