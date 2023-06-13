import mongoose, { Document, Query } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
interface UserAttrs {
  name: string;
  email: string;
  photo?: string;
  password: string;
  passwordConfirm: string | undefined;
  passwordChangedAt: Date;
  role: 'user' | 'admin' | 'guide' | 'lead-guide';
  passwordResetToken?: string;
  passwordResetExpires?: Number;
  active: boolean;
}

// An interface that describes the properties
// that a User Document has
interface UserDoc extends UserAttrs, Document {
  verifyPassword: (
    plainPassword: string,
    hashedPassword: string
  ) => Promise<boolean>;
  changePasswordAfter: (JWTTimestamp: number) => boolean;
  createPasswordResetToken: () => string;
}

const userSchema = new mongoose.Schema<UserDoc>({
  name: {
    type: String,
    required: [true, 'User name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'tour-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false, // This property is used to define if this field will be part of the response
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Password confirmation is required'],
    validate: {
      // This only works on CREATE and SAVE!
      validator: function (this: UserAttrs, el: string): boolean {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Number,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Whener a user is inteded to be saved in mongo that save attempt
// is intercepted by this hook. It takes the user password that is set
// on the User Document, hash it and overwrite the password on the
// document. Useful to implement an email change functionality
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete the passwordConfirm field
  this!.passwordConfirm = undefined;
  next();
});

userSchema.pre<Query<UserAttrs, UserDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.methods.verifyPassword = async function (
  plainPassword: string,
  hashedPassword: string
) {
  // this.password will be undefined since this field was marked with select = false on the schema
  return await bcrypt.compare(plainPassword, hashedPassword);
};

userSchema.methods.changePasswordAfter = function (
  this: UserDoc,
  JWTTimestamp: number
) {
  if (this.passwordChangedAt) {
    const changeTimestamp = this.passwordChangedAt.getTime() / 1000;

    return JWTTimestamp < changeTimestamp;
  }

  // FALSE means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function (this: UserDoc) {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model<UserDoc>('User', userSchema);

export default User;
