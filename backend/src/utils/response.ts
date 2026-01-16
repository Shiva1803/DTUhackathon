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
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: SuccessResponse['meta']
): SuccessResponse<T> {
  const response: SuccessResponse<T> = {
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
export function errorResponse(
  message: string,
  statusCode = 500,
  code?: string,
  details?: unknown
): ErrorResponse {
  const response: ErrorResponse = {
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
export function parsePagination(
  query: { page?: string | number; limit?: string | number },
  defaults = { page: 1, limit: 20, maxLimit: 100 }
): PaginationParams {
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
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): PaginationResult {
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
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): SuccessResponse<T[]> {
  const pagination = calculatePagination(total, page, limit);

  return successResponse(data, message, {
    page: pagination.page,
    limit: pagination.limit,
    total: pagination.total,
    totalPages: pagination.totalPages,
  });
}

export default {
  successResponse,
  errorResponse,
  parsePagination,
  calculatePagination,
  paginatedResponse,
};
