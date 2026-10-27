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

const timeZoneNameFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: ukTimeZone,
  timeZoneName: "shortOffset",
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

export function formatDateTime(isoDateTime: string): string {
  const parts: Record<string, string> = {};
  for (const part of dateTimeFormat.formatToParts(new Date(isoDateTime))) {
    parts[part.type] = part.value;
  }
  const dayPeriod = parts.dayPeriod.toLowerCase();
  return `${parts.day} ${parts.month} ${parts.year} at ${parts.hour}:${parts.minute}${dayPeriod}`;
}

export function isRealDate(date: CalendarDate): boolean {
  const candidate = new Date(Date.UTC(date.year, date.month - 1, date.day));
  return (
    candidate.getUTCFullYear() === date.year &&
    candidate.getUTCMonth() === date.month - 1 &&
    candidate.getUTCDate() === date.day
  );
}

export function ukDateTimeToIso(date: CalendarDate, time: ClockTime): string {
  const asIfUtc = Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute);
  const offsetMinutes = ukOffsetMinutes(new Date(asIfUtc));
  return new Date(asIfUtc - offsetMinutes * 60 * 1000).toISOString();
}

function ukOffsetMinutes(instant: Date): number {
  for (const part of timeZoneNameFormat.formatToParts(instant)) {
    if (part.type === "timeZoneName" && part.value === "GMT+1") {
      return 60;
    }
  }
  return 0;
}
