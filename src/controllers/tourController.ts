import { NextFunction, Request, Response } from 'express';
import Tour from '../models/tourModel';
import { catchAsync } from '../utils/catchAsync';
import factory from './handlerFactory';
import AppError from '../utils/appError';

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
// Example of sorting and filter:
// {{URL}}api/v1/tours?duration[gte]=10&sort=price
export const getAllTours = factory.getAll(Tour);

export const getTour = factory.getOne(Tour, { path: 'reviews' });

export const createTour = factory.createOne(Tour);

export const updateTour = factory.updateOne(Tour);

export const deleteTour = factory.deleteOne(Tour);

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

// With QUERY STRINGS = /tours-within?distance=233&latlng=40,45&unit=mi
// With PARAMS = /tours-within/233/latlng/-40,45/unit/mi
export const getToursWithin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    if (!lat || !lng) {
      return next(
        new AppError(
          'Please provide latitude and longitude in the format lat,lng',
          400
        )
      );
    }

    // Distance in radians use the units
    const radius =
      unit === 'mi' ? Number(distance) / 3963.2 : Number(distance) / 6378.1;

    // Geospatial Query
    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
      status: 'sucess',
      results: tours.length,
      data: {
        data: tours,
      },
    });
  }
);

export const getDistances = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    if (!lat || !lng) {
      return next(
        new AppError(
          'Please provide latitude and longitude in the format lat,lng',
          400
        )
      );
    }

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    // Calculating distances with the aggregation pipeline
    const distances = await Tour.aggregate([
      {
        // In geospatial $geoNear is always the first stage
        // That's why the aggregation Tour middleware is commented out.
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier,
        },
      },
      {
        // Which feels we want to keep
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        data: distances,
      },
    });
  }
);
