import express, { NextFunction, Request, Response } from 'express';
import { toursRouter } from './routes/tourRoutes';
import { userRouter } from './routes/userRoutes';
import { reviewRouter } from './routes/reviewRoutes';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
// import xss from 'xss-clean'
import morgan from 'morgan';
import { addTimeToReq, customMiddleware } from './middleware/custom-middleware';
import AppError from './utils/appError';
import { globalErrorHandler } from './controllers/errorController';
import hpp from 'hpp';

const app = express();

// GLOBAL MIDDLEWARES
// Set security HTTP headers. Should be at the beginning
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API to prevent brute force attacks and DoS
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 100 requets per 1 hour is the limit
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
// Limits the size of the body to 10kb
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
// app.use(xss());

// Prevent parameter pollution
//
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Serving static files
app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use(customMiddleware);
app.use(addTimeToReq);

// ROUTES
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// Handling undefined routes. At this point
// any route catched the URL that was send by the user
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  );

  // Whenever you pass an argument to the next function
  // it will asume that is an error and will skip all the
  // other middlewares.
  next(err);
});

app.use(globalErrorHandler);

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);

// PATCH: Only expect the properties that should be updated on the object
// PUT receives the entire new updated object

/* app.patch('/api/v1/tours/:id', updateTour);
app.delete('/api/v1/tours/:id', deleteTour);
app.get('/api/v1/tours/:id', getTour); */

export { app as app };
