import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Message role types
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * ChatMessage document interface
 */
export interface IChatMessage extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    latencyMs?: number;
    [key: string]: unknown;
  };
}

/**
 * ChatMessage schema definition
 */
const chatMessageSchema = new Schema<IChatMessage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false, // We use our own timestamp field
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        const { _id, ...rest } = ret as Record<string, unknown>;
        return { id: String(_id), ...rest };
      },
    },
  }
);

// Compound indexes for common query patterns
chatMessageSchema.index({ userId: 1, sessionId: 1, timestamp: 1 });
chatMessageSchema.index({ sessionId: 1, timestamp: 1 });
chatMessageSchema.index({ userId: 1, timestamp: -1 });

/**
 * Static method to get conversation history for a session
 */
chatMessageSchema.statics.getSessionHistory = async function (
  sessionId: string,
  limit = 50
): Promise<IChatMessage[]> {
  return this.find({ sessionId })
    .sort({ timestamp: 1 })
    .limit(limit)
    .exec();
};

/**
 * Static method to get recent sessions for a user
 */
chatMessageSchema.statics.getUserSessions = async function (
  userId: mongoose.Types.ObjectId,
  limit = 10
): Promise<string[]> {
  const result = await this.aggregate([
    { $match: { userId } },
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$sessionId', lastMessage: { $first: '$timestamp' } } },
    { $sort: { lastMessage: -1 } },
    { $limit: limit },
    { $project: { _id: 0, sessionId: '$_id' } },
  ]);
  return result.map((r: { sessionId: string }) => r.sessionId);
};

/**
 * ChatMessage model interface with static methods
 */
interface IChatMessageModel extends Model<IChatMessage> {
  getSessionHistory(sessionId: string, limit?: number): Promise<IChatMessage[]>;
  getUserSessions(userId: mongoose.Types.ObjectId, limit?: number): Promise<string[]>;
}

/**
 * ChatMessage model
 */
export const ChatMessage: IChatMessageModel = mongoose.model<IChatMessage, IChatMessageModel>(
  'ChatMessage',
  chatMessageSchema
);

export default ChatMessage;
