import { describe, expect, it } from "vitest";
import { formatDateTime, isRealDate, ukDateTimeToIso } from "./dates.ts";

describe("ukDateTimeToIso", () => {
  it("treats winter times as GMT", () => {
    expect(ukDateTimeToIso({ year: 2027, month: 1, day: 15 }, { hour: 9, minute: 0 })).toBe(
      "2027-01-15T09:00:00.000Z",
    );
  });

  it("treats summer times as British Summer Time", () => {
    expect(ukDateTimeToIso({ year: 2027, month: 7, day: 15 }, { hour: 9, minute: 0 })).toBe(
      "2027-07-15T08:00:00.000Z",
    );
  });
});

describe("formatDateTime", () => {
  it("formats in the GOV.UK style, in UK time", () => {
    expect(formatDateTime("2027-07-15T13:30:00.000Z")).toBe("15 July 2027 at 2:30pm");
    expect(formatDateTime("2027-01-15T09:05:00.000Z")).toBe("15 January 2027 at 9:05am");
  });
});

describe("isRealDate", () => {
  it("accepts a leap day in a leap year only", () => {
    expect(isRealDate({ year: 2028, month: 2, day: 29 })).toBe(true);
    expect(isRealDate({ year: 2027, month: 2, day: 29 })).toBe(false);
  });
});
