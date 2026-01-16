"use strict";
/**
 * Standard API response formats
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
exports.parsePagination = parsePagination;
exports.calculatePagination = calculatePagination;
exports.paginatedResponse = paginatedResponse;
/**
 * Create a success response
 * @param data - Response data
 * @param message - Optional success message
 * @param meta - Optional metadata (pagination, etc.)
 */
function successResponse(data, message, meta) {
    const response = {
        success: true,
        data,
    };
    if (message) {
        response.message = message;
    }
    if (meta) {
        response.meta = meta;
    }
    return response;
}
/**
 * Create an error response
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param code - Optional error code
 * @param details - Optional error details
 */
function errorResponse(message, statusCode = 500, code, details) {
    const response = {
        success: false,
        error: {
            message,
            statusCode,
        },
    };
    if (code) {
        response.error.code = code;
    }
    if (details) {
        response.error.details = details;
    }
    return response;
}
/**
 * Parse pagination parameters from request query
 * @param query - Request query object
 * @param defaults - Default pagination values
 */
function parsePagination(query, defaults = { page: 1, limit: 20, maxLimit: 100 }) {
    let page = typeof query.page === 'string' ? parseInt(query.page, 10) : (query.page || defaults.page);
    let limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit || defaults.limit);
    // Ensure valid values
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), defaults.maxLimit);
    return { page, limit };
}
/**
 * Calculate pagination metadata
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 */
function calculatePagination(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}
/**
 * Create a paginated success response
 * @param data - Response data array
 * @param total - Total number of items
 * @param page - Current page
 * @param limit - Items per page
 * @param message - Optional message
 */
function paginatedResponse(data, total, page, limit, message) {
    const pagination = calculatePagination(total, page, limit);
    return successResponse(data, message, {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
    });
}
exports.default = {
    successResponse,
    errorResponse,
    parsePagination,
    calculatePagination,
    paginatedResponse,
};
//# sourceMappingURL=response.js.map