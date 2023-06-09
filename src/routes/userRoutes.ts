import express from 'express';
import {
  createUser,
  deleteMe,
  deleteUser,
  getAllUsers,
  getUser,
  updateMe,
  updateUser,
} from '../controllers/userController';
import {
  forgotPassword,
  isAuth,
  login,
  resetPassword,
  signup,
  updatePassword,
} from '../controllers/authenticationController';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);
router.patch('/updatePassword', isAuth, updatePassword);
router.patch('/updateMe', isAuth, updateMe);
router.delete('/deleteMe', isAuth, deleteMe);

router.route('/').get(getAllUsers).post(createUser);

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export { router as userRouter };
