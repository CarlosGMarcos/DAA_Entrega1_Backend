/* ============================================================================
 * Pagination types
 * Shape of every paginated list: { data, meta, links }.
 * ========================================================================== */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Links to other pages that keep the filters of the request.
export interface PaginationLinks {
  first: string;
  prev: string | null;
  next: string | null;
  last: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}
