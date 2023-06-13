import { RemoteInfo } from 'dgram';
import mongoose, { Document, Types, Schema, Query } from 'mongoose';

interface ReviewAttrs {
  review: string;
  rating: number;
  createdAt: Date;
  tour: Types.ObjectId;
  user: Types.ObjectId;
}

interface ReviewDoc extends Document, ReviewAttrs {}

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

// QUERY MIDDLEWARES
reviewSchema.pre<Query<RemoteInfo, ReviewDoc>>(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name photo' });
  next();
});

const ReviewModel = mongoose.model<ReviewDoc>('Review', reviewSchema);

export default ReviewModel;
