import { NextFunction, Request, Response } from 'express';
import User from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';
import factory from './handlerFactory';

const filterObj = (reqBody: Request['body'], ...allowedFields: string[]) => {
  const newObj: { [key: string]: string } = {};
  Object.keys(reqBody).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = reqBody[el];
    }
  });

  return newObj;
};

export const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { password, passwordConfirm } = req.body;
    // 1) Create error if user POSTs password data
    if (
      password ||
      password === '' ||
      passwordConfirm ||
      passwordConfirm === ''
    ) {
      return next(
        new AppError(
          'This route is not for password updates. Please use updatePassword',
          400
        )
      );
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'sucess',
      data: {
        user: updatedUser,
      },
    });
  }
);

// It does not delete the User document, just updtes its active property
export const deleteMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);

export const createUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'Error',
    meesage: 'This route is not yet defined, please use /signup instead',
  });
};

export const getMe = (req: Request, res: Response, next: NextFunction) => {
  req.params.id = req.user.id;
  next();
};

// Filtering example: {{URL}}api/v1/users?role=user
export const getAllUsers = factory.getAll(User);

export const getUser = factory.getOne(User);
// Only for admins and data that is not password
export const updateUser = factory.updateOne(User);

export const deleteUser = factory.deleteOne(User);
