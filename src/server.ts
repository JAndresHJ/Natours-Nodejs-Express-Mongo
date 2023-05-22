import { app } from '.';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const DB = process.env.DATABASE?.replace(
  '<password>',
  process.env.DATABASE_PASSWORD!
);

mongoose.connect(DB!).then(() => console.log('DB Connection Successful'));

// START SERVER
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
