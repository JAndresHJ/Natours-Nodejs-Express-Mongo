import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';

// name, email, photo, password, password confirm

interface UserAttrs {
  name: string;
  email: string;
  photo?: string;
  password: string;
  passwordConfirm: string | undefined;
}

// An interface that describe properties
// that a User Model has
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

// An interface that describes the properties
// that a User Document has
interface UserDoc extends mongoose.Document {
  email: string;
  password: string;
}

const userSchema = new mongoose.Schema<UserAttrs>({
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
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
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

const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export default User;
