/**
 * Standard API response wrapper for single items.
 * Extend per project if your backend wraps differently.
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

/**
 * Standard paginated response.
 * Matches Django Ninja/DRF pagination output by default.
 */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Generic list params for paginated endpoints.
 */
export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  [key: string]: unknown;
}
