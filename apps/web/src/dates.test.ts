import { describe, expect, it } from "vitest";
import { formatDateTime } from "./dates.ts";

describe("formatDateTime", () => {
  it("formats in the GOV.UK style, in UK time", () => {
    expect(formatDateTime("2027-07-15T13:30:00.000Z")).toBe("15 July 2027 at 2:30pm");
    expect(formatDateTime("2027-01-15T09:05:00.000Z")).toBe("15 January 2027 at 9:05am");
  });
});
