import { NextFunction, Request, Response } from 'express';
import fs from 'fs';

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../data/tours-simple.json`).toString()
);

// Route Handlers
export const getAllTours = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    requestedAt: req.requestTime,
    data: {
      tours,
    },
  });
};

export const getTour = (req: Request, res: Response) => {
  const { id } = req.params;
  const tour = tours.find((tour: { id: number }) => tour.id === Number(id));

  if (!tour) {
    return res.status(404).json({ status: 'fail', message: 'Invalid ID' });
  }

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tour,
    },
  });
};

export const createTour = (req: Request, res: Response) => {
  console.log(req.body);
  const newId = tours[tours.length - 1].id + 1;
  const newTour = {
    id: newId,
    ...req.body,
  };
  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/data/tours-simple.json`,
    JSON.stringify(tours),
    (_e) => {
      // 201 = Created
      res.status(201).json({
        status: 'success',
        data: {
          tours: newTour,
        },
      });
    }
  );
};

export const updateTour = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>',
    },
  });
};

export const deleteTour = (req: Request, res: Response) => {
  // 204 = No Content
  res.status(204).json({
    status: 'success',
    data: null,
  });
};

export const checkID = (req: Request, res: Response, next: NextFunction) => {
  if (req.params.id > tours.length) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  next();
};
