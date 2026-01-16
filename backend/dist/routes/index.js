"use strict";
/**
 * Routes index - exports all route modules
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRoutes = exports.summaryRoutes = exports.logRoutes = exports.authRoutes = void 0;
var auth_routes_1 = require("./auth.routes");
Object.defineProperty(exports, "authRoutes", { enumerable: true, get: function () { return __importDefault(auth_routes_1).default; } });
var log_routes_1 = require("./log.routes");
Object.defineProperty(exports, "logRoutes", { enumerable: true, get: function () { return __importDefault(log_routes_1).default; } });
var summary_routes_1 = require("./summary.routes");
Object.defineProperty(exports, "summaryRoutes", { enumerable: true, get: function () { return __importDefault(summary_routes_1).default; } });
var chat_routes_1 = require("./chat.routes");
Object.defineProperty(exports, "chatRoutes", { enumerable: true, get: function () { return __importDefault(chat_routes_1).default; } });
//# sourceMappingURL=index.js.map