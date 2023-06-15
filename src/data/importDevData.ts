import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import Tour from '../models/tourModel';
import User from '../models/userModel';
import ReviewModel from '../models/reviewModel';

dotenv.config({ path: `${__dirname}/../../.env` });

const DB = process.env.DATABASE?.replace(
  '<password>',
  process.env.DATABASE_PASSWORD!
);

mongoose.connect(DB!).then(() => console.log('DB Connection Successful'));

// READ JSON FILE

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// IMPORT DATA INTO DB

const importData = async () => {
  try {
    await Tour.create(tours);
    // pass for all user: test1234
    await User.create(users, { validateBeforeSave: false });
    await ReviewModel.create(reviews);

    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA FROM COLLECTION

const deleteData = async () => {
  try {
    // If no parameters are passed, it'll delete everything
    await Tour.deleteMany();
    await User.deleteMany();
    await ReviewModel.deleteMany();
    console.log('Data successfully deleted!');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

// Comand to import data:
// 1- cd into the data folder and run the importDevData file with 'npx ts-node'.
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
