import { Request, Response, NextFunction } from 'express';
import AppError, { CustomError } from '../utils/appError';
import { CastError, Error } from 'mongoose';
import { MongoError } from 'mongodb';

type ErrorJoin = CastError & CustomError & MongoError;

const handleCastErrorDB = (error: CastError) => {
  const message = `Invalid ${error.path}: ${error.value}`;

  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (error: MongoError) => {
  const value = error.errmsg.match(/(["'])(\\?.)*?\1/);
  const message = `Duplicate field value: ${
    value?.[0] || '-'
  }. Please use another value!`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (error: Error.ValidationError) => {
  const errors = Object.values(error.errors).map((val) => val.message);
  const message = `Invalid input data. ${errors.join('. ')}`;

  return new AppError(message, 400);
};

const sendErrorDev = (err: CustomError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err: CustomError, res: Response) => {
  // Operational, trusted error: send custom message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    console.error('ERROR: ', err);
    // 2) Send generi error
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

export const globalErrorHandler = (
  err: ErrorJoin,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error: any = { ...err };

    if (err.name === 'CastError') {
      error = handleCastErrorDB(err);
    }

    if (err.code === 11000) {
      error = handleDuplicateFieldsDB(err);
    }

    const validationError = err as unknown as Error.ValidationError;

    if (validationError.name === 'ValidationError') {
      error = handleValidationErrorDB(validationError);
    }

    console.log({ error });
    sendErrorProd(error, res);
  }
};
