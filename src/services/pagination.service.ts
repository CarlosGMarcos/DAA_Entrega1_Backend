/* ============================================================================
 * Pagination helpers
 * Pure functions (no database, no req/res): they only do the arithmetic and
 * build the links, so any list service can reuse them.
 * ========================================================================== */

import { PaginationLinks, PaginationMeta } from "../types/pagination.types.js";

export const buildPaginationMeta = (total: number, page: number, limit: number): PaginationMeta => {
  // "|| 1": with no results Math.ceil(0 / limit) would be 0 pages and the
  // "last" link would point to page 0.
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

// The original URL is rebuilt with the native URL API (not by joining strings)
// so filters such as ?sensor=...&isAnomalous=true are kept in every link.
export const buildPaginationLinks = (originalUrl: string, page: number, limit: number, totalPages: number): PaginationLinks => {
  const url = new URL(originalUrl, "http://localhost");

  const linkTo = (targetPage: number) => {
    url.searchParams.set("page", String(targetPage));
    url.searchParams.set("limit", String(limit));
    return `${url.pathname}${url.search}`;
  };

  return {
    first: linkTo(1),
    prev: page > 1 ? linkTo(page - 1) : null,
    next: page < totalPages ? linkTo(page + 1) : null,
    last: linkTo(totalPages),
  };
};
