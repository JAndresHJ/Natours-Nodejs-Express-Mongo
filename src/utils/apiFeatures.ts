import { Request } from 'express';

class APIFeatures {
  query: any;
  queryString: Request['query'];

  constructor(query: any, queryString: Request['query']) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // ADVANCED FILTERING
    // { difficulty: 'easy', duration: { gte: 5 } }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = (this.queryString.sort as string).split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = (this.queryString.fields as string).split(',').join(' ');
      // Select expects an argument in the form of fields separated with a space
      // Example: 'name description createdAt'
      this.query = this.query.select(fields);
    } else {
      // By adding a '-' the field will be excluded in from the response.
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page || 1;
    const limit = this.queryString.limit || 100;
    const skip = (Number(page) - 1) * Number(limit);

    // page=2&limit=10 page-1: 1-10, page-2: 11-20
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

export default APIFeatures;
