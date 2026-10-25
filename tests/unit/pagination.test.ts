/* ============================================================================
 * Unit tests: pagination helpers
 * buildPaginationMeta and buildPaginationLinks are pure functions, so the
 * page arithmetic and the links are tested without database or HTTP.
 * ========================================================================== */

import { describe, it, expect } from "vitest";
import { buildPaginationLinks, buildPaginationMeta } from "../../src/services/pagination.service.js";

describe("buildPaginationMeta", () => {
  it("counts the pages and knows there are pages before and after", () => {
    expect(buildPaginationMeta(45, 2, 20)).toEqual({
      total: 45,
      page: 2,
      limit: 20,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  it("has no next page on the last page", () => {
    const meta = buildPaginationMeta(40, 2, 20);

    expect(meta.totalPages).toBe(2);
    expect(meta.hasNextPage).toBe(false);
  });

  it("returns one page, not zero, when there are no results", () => {
    const meta = buildPaginationMeta(0, 1, 20);

    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });
});

describe("buildPaginationLinks", () => {
  it("keeps every filter of the request and only changes the page", () => {
    const links = buildPaginationLinks("/api/readings?sensor=abc&isAnomalous=true&page=2&limit=20", 2, 20, 3);

    expect(links).toEqual({
      first: "/api/readings?sensor=abc&isAnomalous=true&page=1&limit=20",
      prev: "/api/readings?sensor=abc&isAnomalous=true&page=1&limit=20",
      next: "/api/readings?sensor=abc&isAnomalous=true&page=3&limit=20",
      last: "/api/readings?sensor=abc&isAnomalous=true&page=3&limit=20",
    });
  });

  it("has no prev on the first page and no next on the last one", () => {
    const links = buildPaginationLinks("/api/readings", 1, 20, 1);

    expect(links.prev).toBeNull();
    expect(links.next).toBeNull();
    expect(links.last).toBe("/api/readings?page=1&limit=20");
  });
});
