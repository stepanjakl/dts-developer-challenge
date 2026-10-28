/*
 * uk-date-time.test.ts
 * Role: Unit tests
 *
 * Checks UK-to-UTC conversion and display across ordinary dates and clock changes.
 */

import { expect, it } from "vitest";
import { formatDateTime, ukDateTimeToIso } from "./uk-date-time.ts";

it("preserves UK dates and times, uses the later repeated hour and rejects the spring gap", () => {
  const examples = [
    {
      date: { year: 2027, month: 1, day: 15 },
      time: { hour: 9, minute: 5 },
      iso: "2027-01-15T09:05:00.000Z",
      display: "15 January 2027 at 9:05am",
    },
    {
      date: { year: 2027, month: 7, day: 15 },
      time: { hour: 14, minute: 30 },
      iso: "2027-07-15T13:30:00.000Z",
      display: "15 July 2027 at 2:30pm",
    },
    {
      date: { year: 2027, month: 1, day: 15 },
      time: { hour: 0, minute: 0 },
      iso: "2027-01-15T00:00:00.000Z",
      display: "15 January 2027 at 12:00am",
    },
    {
      date: { year: 2027, month: 7, day: 15 },
      time: { hour: 0, minute: 0 },
      iso: "2027-07-14T23:00:00.000Z",
      display: "15 July 2027 at 12:00am",
    },
    {
      date: { year: 2028, month: 2, day: 29 },
      time: { hour: 12, minute: 0 },
      iso: "2028-02-29T12:00:00.000Z",
      display: "29 February 2028 at 12:00pm",
    },
    {
      date: { year: 2027, month: 3, day: 28 },
      time: { hour: 0, minute: 59 },
      iso: "2027-03-28T00:59:00.000Z",
      display: "28 March 2027 at 12:59am",
    },
    {
      date: { year: 2027, month: 3, day: 28 },
      time: { hour: 2, minute: 0 },
      iso: "2027-03-28T01:00:00.000Z",
      display: "28 March 2027 at 2:00am",
    },
    {
      date: { year: 2027, month: 10, day: 31 },
      time: { hour: 1, minute: 30 },
      iso: "2027-10-31T01:30:00.000Z",
      display: "31 October 2027 at 1:30am",
    },
  ];
  for (const example of examples) {
    const iso = ukDateTimeToIso(example.date, example.time);
    expect(iso).toBe(example.iso);
    expect(formatDateTime(iso as string)).toBe(example.display);
  }
  expect(
    ukDateTimeToIso({ year: 2027, month: 3, day: 28 }, { hour: 1, minute: 30 }),
  ).toBeUndefined();
});
