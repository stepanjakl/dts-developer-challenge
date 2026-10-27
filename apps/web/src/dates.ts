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

export function formatDateTime(isoDateTime: string): string {
  const parts: Record<string, string> = {};
  for (const part of dateTimeFormat.formatToParts(new Date(isoDateTime))) {
    parts[part.type] = part.value;
  }
  const dayPeriod = parts.dayPeriod.toLowerCase();
  return `${parts.day} ${parts.month} ${parts.year} at ${parts.hour}:${parts.minute}${dayPeriod}`;
}
