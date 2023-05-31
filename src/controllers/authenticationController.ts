import { Request, Response } from 'express';
import User from '../models/userModel';

export const signup = async (req: Request, res: Response) => {
  const newUser = await User.create(req.body);

  res.status(201).json({
    status: 'Success',
    data: {
      user: newUser,
    },
  });
};
