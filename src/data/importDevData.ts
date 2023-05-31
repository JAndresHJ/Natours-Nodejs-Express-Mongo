import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import Tour from '../models/tourModel';

dotenv.config({ path: `${__dirname}/../../.env` });

const DB = process.env.DATABASE?.replace(
  '<password>',
  process.env.DATABASE_PASSWORD!
);

mongoose.connect(DB!).then(() => console.log('DB Connection Successful'));

// READ JSON FILE

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
);

// IMPORT DATA INTO DB

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  } finally {
    process.exit();
  }
};

// DELETE ALL DATA FROM COLLECTION

const deleteData = async () => {
  try {
    // If no parameters are passed, it'll delete everything
    await Tour.deleteMany();
  } catch (error) {
    console.log(error);
  } finally {
    process.exit();
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
