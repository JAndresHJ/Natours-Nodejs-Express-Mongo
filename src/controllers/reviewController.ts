import { NextFunction, Request, Response } from 'express';
import Review from '../models/reviewModel';
import factory from './handlerFactory';

// Example of filtering reviews:
// {{URL}}api/v1/reviews?rating=3
export const getAllReviews = factory.getAll(Review);

export const setTourUserIds = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

export const createReview = factory.createOne(Review);

export const deleteReview = factory.deleteOne(Review);

export const updateReview = factory.updateOne(Review);

export const getReview = factory.getOne(Review);
