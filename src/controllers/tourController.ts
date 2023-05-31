import { NextFunction, Request, Response } from 'express';
import Tour from '../models/tourModel';

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
    // BUILD QUERY
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // 1) ADVANCED FILTERING
    // { difficulty: 'easy', duration: { gte: 5 } }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Tour.find(JSON.parse(queryStr));

    // 2) SORTING
    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // 3) FIELD LIMITING
    if (req.query.fields) {
      const fields = (req.query.fields as string).split(',').join(' ');
      // Select expects an argument in the form of fields separated with a space
      // Example: 'name description createdAt'
      query = query.select(fields);
    } else {
      // By adding a '-' the field will be excluded in from the response.
      query = query.select('-__v');
    }

    const { page, limit } = req.query;

    // 4) PAGINATION
    const pageQuery = page ? Number(page) : 1;
    const limitQuery = limit ? Number(limit) : 1;
    const skip = (pageQuery - 1) * limitQuery;
    // page=2&limit=10 page-1: 1-10, page-2: 11-20
    query = query.skip(skip).limit(limitQuery);

    if (page) {
      const numOfTours = await Tour.countDocuments();
      if (skip >= numOfTours) throw new Error('This page does not exits');
    }

    // EXECUTE QUERY
    const tours = await query;
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
