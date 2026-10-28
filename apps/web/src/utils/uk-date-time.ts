/*
 * uk-date-time.ts
 * Role: Date utilities
 *
 * Validates date/time parts and converts between UK local time
 * and the UTC timestamps used by the API.
 */

const ukTimeZone = "Europe/London";

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: ukTimeZone,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const localDateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: ukTimeZone,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});

export type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

export type ClockTime = {
  hour: number;
  minute: number;
};

// --- Date formatting ---
// Display API timestamps as readable UK dates and times.

export function formatDateTime(isoDateTime: string): string {
  const parts: Record<string, string> = {};
  for (const part of dateTimeFormat.formatToParts(new Date(isoDateTime))) {
    parts[part.type] = part.value;
  }
  const dayPeriod = parts.dayPeriod.toLowerCase();
  return `${parts.day} ${parts.month} ${parts.year} at ${parts.hour}:${parts.minute}${dayPeriod}`;
}

// --- Date validation ---
// Check that dates exist and times fit the 24-hour clock.

export function isRealDate(date: CalendarDate): boolean {
  if (date.year < 1000 || date.year > 9999) {
    return false;
  }
  const candidate = new Date(Date.UTC(date.year, date.month - 1, date.day));
  return (
    candidate.getUTCFullYear() === date.year &&
    candidate.getUTCMonth() === date.month - 1 &&
    candidate.getUTCDate() === date.day
  );
}

export function isRealTime(time: ClockTime): boolean {
  const isRealHour = Number.isInteger(time.hour) && time.hour >= 0 && time.hour <= 23;
  const isRealMinute = Number.isInteger(time.minute) && time.minute >= 0 && time.minute <= 59;
  return isRealHour && isRealMinute;
}

// --- Timezone conversion ---
// Convert the entered UK time to UTC for the API.

export function ukDateTimeToIso(date: CalendarDate, time: ClockTime): string | undefined {
  if (!isRealDate(date) || !isRealTime(time)) {
    return undefined;
  }
  const asIfUtc = Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute);
  // During the repeated autumn hour, this offset selects the later occurrence in GMT.
  const offset = ukOffsetMilliseconds(new Date(asIfUtc));
  const candidate = new Date(asIfUtc - offset);
  if (candidate.getTime() + ukOffsetMilliseconds(candidate) !== asIfUtc) {
    return undefined;
  }
  return candidate.toISOString();
}

function ukOffsetMilliseconds(instant: Date): number {
  const parts: Record<string, number> = {};
  for (const part of localDateTimeFormat.formatToParts(instant)) {
    parts[part.type] = Number(part.value);
  }
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return localAsUtc - instant.getTime();
}
