import mongoose, { Document, Model } from 'mongoose';
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
 * ChatMessage model interface with static methods
 */
interface IChatMessageModel extends Model<IChatMessage> {
    getSessionHistory(sessionId: string, limit?: number): Promise<IChatMessage[]>;
    getUserSessions(userId: mongoose.Types.ObjectId, limit?: number): Promise<string[]>;
}
/**
 * ChatMessage model
 */
export declare const ChatMessage: IChatMessageModel;
export default ChatMessage;
//# sourceMappingURL=ChatMessage.d.ts.map