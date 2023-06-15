import express from 'express';
import {
  createReview,
  deleteReview,
  getAllReviews,
  getReview,
  setTourUserIds,
  updateReview,
} from '../controllers/reviewController';
import { isAuth, restrictTo } from '../controllers/authenticationController';

// Merge params allows to get access to a parameter
// that comes from another router.
// GET   /tour/123ad/reviews
// GET   /tour/qwem1/reviews/21332k
// POST  /tour/qwe22/reviews
const router = express.Router({ mergeParams: true });

// All routes are protected
router.use(isAuth);

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .get(getReview)
  .delete(restrictTo('user', 'admin'), deleteReview)
  .patch(restrictTo('user', 'admin'), updateReview);

export { router as reviewRouter };
