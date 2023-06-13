import { CookieOptions, NextFunction, Request, Response } from 'express';
import User from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError';
import { promisify } from 'util';
import sendEmail from '../utils/email';
import crypto from 'crypto';

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user: any, statusCode: number, res: Response) => {
  const token = signToken(user._id);

  const cookieOptions: CookieOptions = {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN!) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // To use HTTPS
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'Success',
    token,
    data: {
      user: user,
    },
  });
};

export const signup = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, passwordConfirm, passwordChangedAt, role } =
    req.body;
  // Only use the needed properties for creating a user not the whole req.body
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
    role,
  });
  createSendToken(newUser, 201, res);
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
    createSendToken(user, 200, res);
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

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    // 1) Gt user based on POSTen email
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('There is no user with email address', 404));
    }

    // 2) Generate the random reset
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and 
		password confirmation to: ${resetURL}.\nIf you didn't forget your password, please ignore
		this email!`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token. Valid for 10 min',
        message,
      });

      res.status(200).json({
        status: 'sucess',
        message: 'Token sent to email!',
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      return next(
        new AppError(
          'There was an error sending the email. Try again later!',
          500
        )
      );
    }
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // 2) If token has not expired and there is user, set new password
    // Check if the token has not yet expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update the changedPasswordAt property for the user

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
  }
);

export const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user;
    // 1) Get user from collection
    const user = await User.findById(id).select('+password');

    // 2) Check if POSTed password is correct
    if (
      !user ||
      !(await user.verifyPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError('Your current password is wrong', 401));
    }
    // 3) If password correct, update it
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    // We cannot user User.findByIdAndUpdate for:
    // - Validations will not be applied
    // - The pre save hooks will not be triggered
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  }
);
