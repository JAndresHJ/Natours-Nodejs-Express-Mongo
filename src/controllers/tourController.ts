import { NextFunction, Request, Response } from 'express';
import Tour from '../models/tourModel';
import APIFeatures from '../utils/apiFeatures';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';
import factory from './handlerFactory';

export const aliasTopTours = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

// Route Handlers
export const getAllTours = catchAsync(async (req: Request, res: Response) => {
  // EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;
  /*     const tours = await Tour.find()
      .where('duration')
      .equals(5)
      .where('difficulty')
      .equals('easy'); */

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
});

export const getTour = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const tour = await Tour.findById(id).populate('reviews');
    // Tour.findOne({ _id: id }) it is the same like findBy()

    if (!tour) {
      const err = new AppError('No tour found with that ID', 404);

      return next(err);
    }

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  }
);

export const createTour = catchAsync(async (req: Request, res: Response) => {
  const { body } = req;
  const newTour = await Tour.create(body);
  // Equals: const newTour = new Tour({ });
  // newTour.save()

  res.status(201).json({
    status: 'success',
    data: {
      tours: newTour,
    },
  });
});

export const updateTour = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!tour) {
      const err = new AppError('No tour found with that ID', 404);

      return next(err);
    }

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  }
);

export const deleteTour = factory.deleteOne(Tour);

/* export const deleteTour = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
      const err = new AppError('No tour found with that ID', 404);

      return next(err);
    }

    // 204 = No Content
    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
); */

export const getTourStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numRatings: { $sum: '$ratingsQuantity' },
        numTours: { $sum: 1 },
        averageRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      // You need to use the key from the group stage: 'avgPrice'. 1 means sort by ascending
      $sort: { avgPrice: 1 },
    },
    // We can repeat stages. At this point the _id is the difficulty.
    // { $match: { _id: { $ne: 'EASY' } } },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

export const getMonthlyPlan = catchAsync(
  async (req: Request, res: Response) => {
    const { year } = req.params; // 2021
    const plan = await Tour.aggregate([
      // Deconstructs an array field from the input documents and outputs
      // one documnet for each element of the array.
      { $unwind: '$startDates' },
      // Match Stage
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`), // Between the first day of the year
            $lte: new Date(`${year}-12-31`), // and the last day of the current year
          },
        },
      },
      // Group stage
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      // Add Field Stage
      {
        $addFields: {
          month: '$_id',
        },
      },
      // Project Stage. Give each field a 0 or 1 to hide or show field, repectively
      {
        $project: {
          _id: 0,
        },
      },
      // Sort Stage
      {
        $sort: {
          numTourStarts: -1, // Sorting in descending order
        },
      },
      // Limit Stage
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  }
);
