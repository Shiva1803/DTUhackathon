import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * User document interface
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  auth0Id: string;
  email: string;
  createdAt: Date;
  lastLogin: Date;
}

/**
 * User schema definition
 */
const userSchema = new Schema<IUser>(
  {
    auth0Id: {
      type: String,
      required: [true, 'Auth0 ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      match: [
        /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
        'Please provide a valid email address',
      ],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We're managing timestamps manually
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        const { _id, ...rest } = ret as Record<string, unknown>;
        return { id: String(_id), ...rest };
      },
    },
  }
);

// Indexes for query optimization
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

/**
 * User model
 */
export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
