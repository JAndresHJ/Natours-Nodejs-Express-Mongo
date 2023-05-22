import { NextFunction, Request, Response } from 'express';

interface MyCustomProperties {
  requestTime: string;
}

declare global {
  namespace Express {
    interface Request extends MyCustomProperties {}
  }
}

export const customMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('Hello from middleware');
  next();
};

export const addTimeToReq = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('Hello from middleware');
  req.requestTime = new Date().toISOString();
  next();
};
