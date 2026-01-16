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
exports.AudioLog = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * AudioLog schema definition
 */
const audioLogSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true,
    },
    transcript: {
        type: String,
        required: [true, 'Transcript is required'],
        trim: true,
        minlength: [1, 'Transcript cannot be empty'],
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    duration: {
        type: Number,
        min: [0, 'Duration cannot be negative'],
    },
    audioUrl: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        trim: true,
        index: true,
    },
    sentiment: {
        type: String,
        enum: ['positive', 'negative', 'neutral', 'mixed'],
        default: 'neutral',
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt
    versionKey: false,
    toJSON: {
        transform: (_doc, ret) => {
            const { _id, ...rest } = ret;
            return { id: String(_id), ...rest };
        },
    },
});
// Compound indexes for common query patterns
audioLogSchema.index({ userId: 1, timestamp: -1 });
audioLogSchema.index({ userId: 1, category: 1 });
audioLogSchema.index({ userId: 1, createdAt: -1 });
// Text index for transcript search
audioLogSchema.index({ transcript: 'text' });
/**
 * AudioLog model
 */
exports.AudioLog = mongoose_1.default.model('AudioLog', audioLogSchema);
exports.default = exports.AudioLog;
//# sourceMappingURL=AudioLog.js.map