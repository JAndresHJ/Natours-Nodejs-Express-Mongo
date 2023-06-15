import express from 'express';
import {
  aliasTopTours,
  createTour,
  deleteTour,
  getAllTours,
  getDistances,
  getMonthlyPlan,
  getTour,
  getTourStats,
  getToursWithin,
  updateTour,
} from '../controllers/tourController';
import { isAuth, restrictTo } from '../controllers/authenticationController';
import { reviewRouter } from './reviewRoutes';

const router = express.Router();

// NESTED ROUTES
router.use('/:tourId/reviews', reviewRouter);

// Use router.param to define middlewares that uses a parameter
//router.param('id', checkID);
/* router.post('/', checkBody); */

// Aggregation pipeline routes
router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(isAuth, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

// With QUERY STRINGS = /tours-distance?distance=233&center=40,45&unit=mi
// With PARAMS = /tours-distance/233/center/-40,45/unit/mi
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

// Aliasing: Means creating a specific route that is commonly used.
// Run a middleware before reaching to the getAllTours controller
// The middleware should populate the query string with the common values
// sort=-ratingsAverage,price&limit=5
router
  .route('/')
  .get(getAllTours)
  .post(isAuth, restrictTo('admin', 'lead-guide'), createTour);

router.route('/top-5-tours').get(aliasTopTours, getAllTours);

router
  .route('/:id')
  .get(getTour)
  .patch(isAuth, restrictTo('admin', 'lead-guide'), updateTour)
  .delete(isAuth, restrictTo('admin', 'lead-guide'), deleteTour);

export { router as toursRouter };
