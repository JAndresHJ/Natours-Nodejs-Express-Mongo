import { NextFunction, Request, Response } from 'express';
import User from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError';
import { promisify } from 'util';

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const signup = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, passwordConfirm, passwordChangedAt } =
    req.body;
  // Only use the needed properties for creating a user not the whole req.body
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
  });
  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'Success',
    token,
    data: {
      user: newUser,
    },
  });
});

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // 1) Check if email and passwords exist
    if (!email || !password) {
      const error = new AppError('Please provide email and password!', 400);
      return next(error);
    }
    console.log(JSON.stringify(User));

    // 2) Check if user exists && pasword is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.verifyPassword(password, user?.password!))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 3) If everything is ok, send token to client
    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
    });
  }
);

export const isAuth = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access', 401)
      );
    }

    // 2) Verification token
    const decoded: any = await promisify<string, string>(jwt.verify)(
      token,
      process.env.JWT_SECRET as string
    );

    console.log({ decoded });

    // 3) Check if user still exists
    const freshUser = await User.findById(decoded.id);

    if (!freshUser) {
      return next(
        new AppError('The user belongin the token no longer exists', 401)
      );
    }

    // 4) Check if user changed password after the JWT was issued
    /*     const pswHasChanged = freshUser.changePasswordAfter(decoded.iat);
    if (pswHasChanged) {
      return next(new AppError('User recently chanded!', 401));
    } */

    // If it reaches this point access will be granted to the protected route
    req.user = freshUser;
    next();
  }
);

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // roles ['admin, 'lead-guide', 'user']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permision to perform this action', 403)
      );
    }

    next();
  };
};
