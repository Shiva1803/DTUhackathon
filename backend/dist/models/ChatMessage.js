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
exports.ChatMessage = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * ChatMessage schema definition
 */
const chatMessageSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true,
    },
    sessionId: {
        type: String,
        required: [true, 'Session ID is required'],
        trim: true,
        index: true,
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'assistant', 'system'],
            message: 'Role must be one of: user, assistant, system',
        },
        required: [true, 'Role is required'],
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        trim: true,
        minlength: [1, 'Content cannot be empty'],
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: false, // We use our own timestamp field
    versionKey: false,
    toJSON: {
        transform: (_doc, ret) => {
            const { _id, ...rest } = ret;
            return { id: String(_id), ...rest };
        },
    },
});
// Compound indexes for common query patterns
chatMessageSchema.index({ userId: 1, sessionId: 1, timestamp: 1 });
chatMessageSchema.index({ sessionId: 1, timestamp: 1 });
chatMessageSchema.index({ userId: 1, timestamp: -1 });
/**
 * Static method to get conversation history for a session
 */
chatMessageSchema.statics.getSessionHistory = async function (sessionId, limit = 50) {
    return this.find({ sessionId })
        .sort({ timestamp: 1 })
        .limit(limit)
        .exec();
};
/**
 * Static method to get recent sessions for a user
 */
chatMessageSchema.statics.getUserSessions = async function (userId, limit = 10) {
    const result = await this.aggregate([
        { $match: { userId } },
        { $sort: { timestamp: -1 } },
        { $group: { _id: '$sessionId', lastMessage: { $first: '$timestamp' } } },
        { $sort: { lastMessage: -1 } },
        { $limit: limit },
        { $project: { _id: 0, sessionId: '$_id' } },
    ]);
    return result.map((r) => r.sessionId);
};
/**
 * ChatMessage model
 */
exports.ChatMessage = mongoose_1.default.model('ChatMessage', chatMessageSchema);
exports.default = exports.ChatMessage;
//# sourceMappingURL=ChatMessage.js.map