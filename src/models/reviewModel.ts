import { RemoteInfo } from 'dgram';
import mongoose, { Document, Types, Schema, Query, Model } from 'mongoose';
import Tour from './tourModel';

interface ReviewAttrs {
  review: string;
  rating: number;
  createdAt: Date;
  tour: Types.ObjectId;
  user: Types.ObjectId;
}

interface ReviewDoc extends Document, ReviewAttrs {}

interface ReviewModel extends Model<ReviewDoc> {
  calcAverageRatings(tourId: Types.ObjectId): void;
}

const reviewSchema = new Schema<ReviewDoc>(
  {
    review: {
      type: String,
      required: [true, 'A review is required!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belog to a tour'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belog to a user'],
    },
  },
  {
    // Show the virual properties are shown in
    // JSON and Object outputs.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Use indexes to avoid duplicate reviews from the same user
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Statics
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // For calculations make use of the aggregation pipeline
  const stats = await this.aggregate([
    // Select all the reviews that belong to the current tour. Filtering
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour', // group by tour
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// DOCUMENT MIDDLEWARE
// Use post because at that time you will have access to the saved review.
// After the document is saved the ratings are calculated
reviewSchema.post('save', function (this: ReviewDoc) {
  // this points to current review
  (this.constructor as typeof ReviewModel).calcAverageRatings(this.tour);
});

// Calculates the avergae when a review is updated or deleted:
// findByIdAndUpdate or findByIdAndDelete
reviewSchema.post(/^findOneAnd/, async function (doc) {
  // await this.findOne(); does NOT work here, query has already executed
  await doc.constructor.calcAverageRatings(doc.tour);
});

// QUERY MIDDLEWARES
reviewSchema.pre<Query<ReviewAttrs, ReviewDoc>>(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name photo' });
  next();
});

const ReviewModel = mongoose.model<ReviewDoc, ReviewModel>(
  'Review',
  reviewSchema
);

export default ReviewModel;
