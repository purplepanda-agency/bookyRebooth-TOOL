function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function formatYmd(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function isBeforeNoon(now = new Date()) {
  return now.getHours() < 12;
}

/** Vandaag vóór 12u, anders morgen. */
export function getMinSelectableDate(now = new Date()) {
  return isBeforeNoon(now) ? formatYmd(now) : formatYmd(addDays(now, 1));
}

/** Standaard: volgende kalenderdag. */
export function getDefaultAgendaDate(now = new Date()) {
  return formatYmd(addDays(now, 1));
}

/** Als de gekozen datum niet meer mag, schuif door naar de eerste geldige. */
export function clampAgendaDate(dateYmd: string, now = new Date()) {
  const min = getMinSelectableDate(now);
  return dateYmd < min ? min : dateYmd;
}

/**
 * Voor vandaag: slots starten vanaf het volgende hele uur.
 * Voor latere dagen: 0 (werkrooster bepaalt).
 */
export function resolveDayStartHour(dateYmd: string, now = new Date()) {
  if (dateYmd !== formatYmd(now)) return 0;
  return Math.min(23, now.getHours() + 1);
}

export function formatDisplayDate(dateYmd: string) {
  const [year, month, day] = dateYmd.split("-").map(Number);
  if (!year || !month || !day) return dateYmd;
  return new Intl.DateTimeFormat("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}
