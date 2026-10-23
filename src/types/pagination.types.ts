/* ============================================================================
 * Pagination contracts
 * Shape of every paginated list: { data, meta, links }. Generic in T, so the
 * same types work for readings or for any other list added later.
 * ========================================================================== */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Ready-to-follow URLs that keep every other filter of the request.
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
