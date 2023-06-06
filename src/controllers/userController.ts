import { NextFunction, Request, Response } from 'express';
import User from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';

export const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await User.find();

    res.status(200).json({
      status: 'suceess',
      results: users.length,
      data: {
        users,
      },
    });
  }
);

export const createUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'Error',
    meesage: 'This route is not yet defined',
  });
};

export const getUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'Error',
    meesage: 'This route is not yet defined',
  });
};

export const updateUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'Error',
    meesage: 'This route is not yet defined',
  });
};

export const deleteUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'Error',
    meesage: 'This route is not yet defined',
  });
};
