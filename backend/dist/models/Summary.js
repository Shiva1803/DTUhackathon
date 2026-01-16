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
exports.Summary = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Summary schema definition
 */
const summarySchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true,
    },
    weekStart: {
        type: Date,
        required: [true, 'Week start date is required'],
        index: true,
    },
    weekEnd: {
        type: Date,
        required: [true, 'Week end date is required'],
    },
    metrics: {
        type: mongoose_1.Schema.Types.Mixed,
        required: [true, 'Metrics are required'],
        default: {
            totalLogs: 0,
            categoryCounts: {},
            sentimentBreakdown: {
                positive: 0,
                negative: 0,
                neutral: 0,
                mixed: 0,
            },
        },
    },
    story: {
        type: String,
        required: [true, 'Story narrative is required'],
        trim: true,
    },
    ttsUrl: {
        type: String,
        trim: true,
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
    isComplete: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        transform: (_doc, ret) => {
            const { _id, ...rest } = ret;
            return { id: String(_id), ...rest };
        },
    },
});
// Compound unique index - one summary per user per week
summarySchema.index({ userId: 1, weekStart: 1 }, { unique: true });
// Index for fetching recent summaries
summarySchema.index({ userId: 1, generatedAt: -1 });
/**
 * Get week identifier string (YYYY-WW format)
 */
summarySchema.methods.getWeekId = function () {
    const date = this.weekStart;
    const year = date.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const weekNum = Math.ceil(((date.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
    return `${year}-W${weekNum.toString().padStart(2, '0')}`;
};
/**
 * Summary model
 */
exports.Summary = mongoose_1.default.model('Summary', summarySchema);
exports.default = exports.Summary;
//# sourceMappingURL=Summary.js.map