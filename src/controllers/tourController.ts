import { NextFunction, Request, Response } from 'express';
import Tour from '../models/tourModel';
import APIFeatures from '../utils/apiFeatures';

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
export const getAllTours = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    res.status(400).json({
      status: 'Failed',
      message: error,
    });
  }
};

export const getTour = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const tour = await Tour.findById(id);
    // Tour.findOne({ _id: id }) it is the same like findBy()

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'Failed',
      message: error,
    });
  }
};

export const createTour = async (req: Request, res: Response) => {
  const { body } = req;

  try {
    const newTour = await Tour.create(body);
    // Equals: const newTour = new Tour({ });
    // newTour.save()

    res.status(201).json({
      status: 'success',
      data: {
        tours: newTour,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'Failed',
      message: error,
    });
  }
};

export const updateTour = async (req: Request, res: Response) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'Failed',
      message: error,
    });
  }
};

export const deleteTour = async (req: Request, res: Response) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    // 204 = No Content
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      status: 'Failed',
      message: error,
    });
  }
};

export const getTourStats = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    res.status(400).json({
      status: 'Failed',
      message: error,
    });
  }
};

export const getMonthlyPlan = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: 'Failed',
      message: error,
    });
  }
};
