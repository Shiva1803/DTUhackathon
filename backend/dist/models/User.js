"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * User schema definition
 */
const userSchema = new mongoose_1.Schema({
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
}, {
    timestamps: false, // We're managing timestamps manually
    versionKey: false,
    toJSON: {
        transform: (_doc, ret) => {
            const { _id, ...rest } = ret;
            return { id: String(_id), ...rest };
        },
    },
});
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
userSchema.methods.updateStreak = async function () {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (this.lastLogDate) {
        const lastLog = new Date(this.lastLogDate);
        const lastLogDay = new Date(lastLog.getFullYear(), lastLog.getMonth(), lastLog.getDate());
        const daysDiff = Math.floor((today.getTime() - lastLogDay.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 0) {
            // Already logged today, no change
            return;
        }
        else if (daysDiff === 1) {
            // Logged yesterday, increment streak
            this.streakCount = (this.streakCount || 0) + 1;
        }
        else {
            // Gap > 1 day, reset streak
            this.streakCount = 1;
        }
    }
    else {
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
exports.User = mongoose_1.default.model('User', userSchema);
exports.default = exports.User;
//# sourceMappingURL=User.js.map