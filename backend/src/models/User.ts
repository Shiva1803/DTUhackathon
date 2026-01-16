import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * User document interface
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  auth0Id: string;
  email: string;
  name?: string;
  createdAt: Date;
  lastLogin: Date;
  // Streak tracking
  streakCount: number;
  lastLogDate?: Date;
  longestStreak: number;
  // Notification preferences
  notificationsEnabled: boolean;
  notificationEmail?: string;
  // Methods
  updateStreak(): Promise<void>;
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
      // More permissive regex that allows underscores and longer TLDs
      match: [
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
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
    // Streak tracking fields
    streakCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLogDate: {
      type: Date,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Notification preferences
    notificationsEnabled: {
      type: Boolean,
      default: false,
    },
    notificationEmail: {
      type: String,
      trim: true,
      lowercase: true,
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
userSchema.index({ streakCount: -1 });

/**
 * Update user streak based on last log date
 * - If logged today: do nothing
 * - If logged yesterday: increment streak
 * - If gap > 24h: reset streak to 1
 */
userSchema.methods.updateStreak = async function (): Promise<void> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (this.lastLogDate) {
    const lastLog = new Date(this.lastLogDate);
    const lastLogDay = new Date(lastLog.getFullYear(), lastLog.getMonth(), lastLog.getDate());

    const daysDiff = Math.floor((today.getTime() - lastLogDay.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Already logged today, no change
      return;
    } else if (daysDiff === 1) {
      // Logged yesterday, increment streak
      this.streakCount = (this.streakCount || 0) + 1;
    } else {
      // Gap > 1 day, reset streak
      this.streakCount = 1;
    }
  } else {
    // First log ever
    this.streakCount = 1;
  }

  // Update longest streak if current is higher
  if (this.streakCount > (this.longestStreak || 0)) {
    this.longestStreak = this.streakCount;
  }

  this.lastLogDate = now;
  await this.save();
};

/**
 * User model
 */
export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;

