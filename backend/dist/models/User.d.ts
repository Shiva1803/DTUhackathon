import mongoose, { Document, Model } from 'mongoose';
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
    streakCount: number;
    lastLogDate?: Date;
    longestStreak: number;
    notificationsEnabled: boolean;
    notificationEmail?: string;
    updateStreak(): Promise<void>;
}
/**
 * User model
 */
export declare const User: Model<IUser>;
export default User;
//# sourceMappingURL=User.d.ts.map