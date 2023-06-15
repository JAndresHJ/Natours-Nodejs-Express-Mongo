import express from 'express';
import {
  createUser,
  deleteMe,
  deleteUser,
  getAllUsers,
  getMe,
  getUser,
  updateMe,
  updateUser,
} from '../controllers/userController';
import {
  forgotPassword,
  isAuth,
  login,
  resetPassword,
  restrictTo,
  signup,
  updatePassword,
} from '../controllers/authenticationController';

const router = express.Router();

// Open routes, no need to be authenticated
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// Protected routes
router.use(isAuth);
// After this point, all following routes are protected
router.patch('/updatePassword', updatePassword);
router.patch('/updateMe', updateMe);
router.delete('/deleteMe', deleteMe);
router.get('/me', getMe, getUser);

// Routes only accesible for admins and require authentication
router.use(restrictTo('admin'));
router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export { router as userRouter };
