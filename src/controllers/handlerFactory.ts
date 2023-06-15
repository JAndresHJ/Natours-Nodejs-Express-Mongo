import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';
import { Model, PopulateOptions } from 'mongoose';
import APIFeatures from '../utils/apiFeatures';

const deleteOne = (Model: Model<any>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }

    // 204 = No Content
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

export const updateOne = (Model: Model<any>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      const err = new AppError('No document found with that ID', 404);

      return next(err);
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

const createOne = (Model: Model<any>) =>
  catchAsync(async (req: Request, res: Response) => {
    const { body } = req;
    const newDoc = await Model.create(body);
    // Equals: const newTour = new Tour({ });
    // newTour.save()

    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });

const getOne = (Model: Model<any>, populateOptions?: PopulateOptions) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    let query = Model.findById(id);

    if (populateOptions) query = query.populate(populateOptions);

    // When the query is ready await for it to get the result
    const doc = await query;

    if (!doc) {
      const err = new AppError('No tour found with that ID', 404);

      return next(err);
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

export const getAll = (Model: Model<any>) =>
  catchAsync(async (req: Request, res: Response) => {
    // To allow for nested GET reviews on Tour
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    // Building query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // EXECUTE QUERY
    const doc = await features.query;
    /*     const tours = await Tour.find()
        .where('duration')
        .equals(5)
        .where('difficulty')
        .equals('easy'); */

    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });

export default {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
};
