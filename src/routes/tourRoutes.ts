import express from 'express';
import {
  aliasTopTours,
  createTour,
  deleteTour,
  getAllTours,
  getMonthlyPlan,
  getTour,
  getTourStats,
  updateTour,
} from '../controllers/tourController';
import { isAuth, restrictTo } from '../controllers/authenticationController';
import { createReview } from '../controllers/reviewController';
import { reviewRouter } from './reviewRoutes';

const router = express.Router();

// NESTED ROUTES
router.use('/:tourId/reviews', reviewRouter);

// Use router.param to define middlewares that uses a parameter
//router.param('id', checkID);
/* router.post('/', checkBody); */

// Aggregation pipeline routes
router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);

// Aliasing: Means creating a specific route that is commonly used.
// Run a middleware before reaching to the getAllTours controller
// The middleware should populate the query string with the common values
// sort=-ratingsAverage,price&limit=5
router.route('/').get(isAuth, getAllTours).post(createTour);
router.route('/top-5-tours').get(aliasTopTours, getAllTours);
router
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(isAuth, restrictTo('admin', 'lead-guide'), deleteTour);

export { router as toursRouter };
