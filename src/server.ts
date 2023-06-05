import { app } from '.';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

process.on('uncaughtException', (err: Error) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT Rejection! Shutting down...');
  process.exit(1);
});

dotenv.config();

const DB = process.env.DATABASE?.replace(
  '<password>',
  process.env.DATABASE_PASSWORD!
);

mongoose.connect(DB!).then(() => console.log('DB Connection Successful'));

// START SERVER
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', (err: Error) => {
  console.log(err.name, err.message);
  console.log('UNHANLDED Rejection! Shutting down...');

  // Give the server time to finish all the pending request.
  // Avoid shutting down only using process.exit
  server.close(() => {
    process.exit(1);
  });
});
