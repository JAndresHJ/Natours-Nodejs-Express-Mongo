import express from 'express';
import {
  createReview,
  deleteReview,
  getAllReviews,
} from '../controllers/reviewController';
import { isAuth, restrictTo } from '../controllers/authenticationController';

// Merge params allows to get access to a parameter
// that comes from another router.
// GET   /tour/123ad/reviews
// GET   /tour/qwem1/reviews/21332k
// POST  /tour/qwe22/reviews
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getAllReviews)
  .post(isAuth, restrictTo('user'), createReview);

router.route('/:id').delete(deleteReview);

export { router as reviewRouter };
