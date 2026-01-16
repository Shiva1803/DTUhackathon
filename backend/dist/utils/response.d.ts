/**
 * Standard API response formats
 */
/**
 * Success response structure
 */
export interface SuccessResponse<T = unknown> {
    success: true;
    data: T;
    message?: string;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        [key: string]: unknown;
    };
}
/**
 * Error response structure
 */
export interface ErrorResponse {
    success: false;
    error: {
        message: string;
        statusCode: number;
        code?: string;
        details?: unknown;
    };
}
/**
 * Generic API response type
 */
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
/**
 * Create a success response
 * @param data - Response data
 * @param message - Optional success message
 * @param meta - Optional metadata (pagination, etc.)
 */
export declare function successResponse<T>(data: T, message?: string, meta?: SuccessResponse['meta']): SuccessResponse<T>;
/**
 * Create an error response
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param code - Optional error code
 * @param details - Optional error details
 */
export declare function errorResponse(message: string, statusCode?: number, code?: string, details?: unknown): ErrorResponse;
/**
 * Pagination parameters
 */
export interface PaginationParams {
    page: number;
    limit: number;
}
/**
 * Pagination result
 */
export interface PaginationResult {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}
/**
 * Parse pagination parameters from request query
 * @param query - Request query object
 * @param defaults - Default pagination values
 */
export declare function parsePagination(query: {
    page?: string | number;
    limit?: string | number;
}, defaults?: {
    page: number;
    limit: number;
    maxLimit: number;
}): PaginationParams;
/**
 * Calculate pagination metadata
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 */
export declare function calculatePagination(total: number, page: number, limit: number): PaginationResult;
/**
 * Create a paginated success response
 * @param data - Response data array
 * @param total - Total number of items
 * @param page - Current page
 * @param limit - Items per page
 * @param message - Optional message
 */
export declare function paginatedResponse<T>(data: T[], total: number, page: number, limit: number, message?: string): SuccessResponse<T[]>;
declare const _default: {
    successResponse: typeof successResponse;
    errorResponse: typeof errorResponse;
    parsePagination: typeof parsePagination;
    calculatePagination: typeof calculatePagination;
    paginatedResponse: typeof paginatedResponse;
};
export default _default;
//# sourceMappingURL=response.d.ts.map