/* ============================================================================
 * Unit tests: anomaly rule
 * isOutOfRange tested on its own, including the limits of the range.
 * ========================================================================== */

import { describe, it, expect } from "vitest";
import { isOutOfRange } from "../../src/services/readings.service.js";

describe("isOutOfRange", () => {
  it.each([
    { value: 20, min: 5, max: 35, expected: false },
    { value: 4.9, min: 5, max: 35, expected: true },
    { value: 35.1, min: 5, max: 35, expected: true },
    { value: 5, min: 5, max: 35, expected: false },
    { value: 35, min: 5, max: 35, expected: false },
    { value: -10, min: undefined, max: 35, expected: false },
    { value: 40, min: undefined, max: 35, expected: true },
  ])("value $value with range [$min, $max] -> $expected", ({ value, min, max, expected }) => {
    expect(isOutOfRange(value, min, max)).toBe(expected);
  });
});
