import express, { NextFunction, Request, Response } from 'express';
import {
  checkID,
  createTour,
  deleteTour,
  getAllTours,
  getTour,
  updateTour,
} from '../controllers/tourController';

const router = express.Router();
router.param('id', checkID);

// Create a checkBody middleware

// Check if body contains the name and price property

// if not, send bak 400 (bad request)

const checkBody = (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  console.log('Body: ', body);

  if (!body.name || !body.price) {
    return res.status(400).json({
      status: 'failed',
      message: 'Invalid request body',
    });
  }

  next();
};

/* router.post('/', checkBody); */

router.route('/').get(getAllTours).post(checkBody, createTour);
router.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

export { router as toursRouter };
