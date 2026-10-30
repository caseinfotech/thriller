const easternTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Detroit",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

export function formatEasternTime(value: string): string {
  // D1 CURRENT_TIMESTAMP values are UTC but omit the time-zone suffix.
  const iso = value.trim().replace(" ", "T");
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(iso);
  const instant = new Date(hasZone ? iso : `${iso}Z`);
  return Number.isNaN(instant.valueOf()) ? value : easternTime.format(instant);
}
