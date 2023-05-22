import express from 'express';
import { toursRouter } from './routes/tourRoutes';
import { userRouter } from './routes/userRoutes';

import morgan from 'morgan';

import { addTimeToReq, customMiddleware } from './middleware/custom-middleware';

const app = express();

// MIDDLEWARES
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(`${__dirname}/public`));
app.use(customMiddleware);
app.use(addTimeToReq);

// ROUTES
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', userRouter);

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);

// PATCH: Only expect the properties that should be updated on the object
// PUT receives the entire new updated object

/* app.patch('/api/v1/tours/:id', updateTour);
app.delete('/api/v1/tours/:id', deleteTour);
app.get('/api/v1/tours/:id', getTour); */

export { app as app };
