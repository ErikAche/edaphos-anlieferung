// Berechnet Zeitraum-Grenzen (Tag/Woche/Monat/Quartal/Jahr) in der
// tatsaechlichen oesterreichischen Zeitzone, unabhaengig davon, in welcher
// Zeitzone der Node-Prozess selbst laeuft (z.B. UTC auf Hostinger). Ohne
// externes Datums-Package, nur ueber die eingebaute Intl-API.

const TIME_ZONE = "Europe/Vienna";

function getOffsetMinutes(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUTC - date.getTime()) / 60000;
}

function viennaCalendarParts(date: Date) {
  const offsetMinutes = getOffsetMinutes(date);
  const shifted = new Date(date.getTime() + offsetMinutes * 60000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(), // 0 = Sonntag
  };
}

// Wandelt ein Vienna-lokales Kalenderdatum (Mitternacht) in den echten
// UTC-Instant um. Berechnet den Offset am Zieldatum selbst (nicht an
// "jetzt"), damit Sommer-/Winterzeit-Uebergaenge korrekt behandelt werden.
function viennaMidnightUTC(year: number, month: number, day: number): Date {
  const guess = new Date(Date.UTC(year, month, day, 0, 0, 0));
  const offsetMinutes = getOffsetMinutes(guess);
  return new Date(guess.getTime() - offsetMinutes * 60000);
}

export function startOfDayVienna(now: Date = new Date()): Date {
  const { year, month, day } = viennaCalendarParts(now);
  return viennaMidnightUTC(year, month, day);
}

export function startOfWeekVienna(now: Date = new Date()): Date {
  const { year, month, day, weekday } = viennaCalendarParts(now);
  const daysSinceMonday = (weekday + 6) % 7;
  return viennaMidnightUTC(year, month, day - daysSinceMonday);
}

export function startOfMonthVienna(now: Date = new Date()): Date {
  const { year, month } = viennaCalendarParts(now);
  return viennaMidnightUTC(year, month, 1);
}

export function startOfQuarterVienna(now: Date = new Date()): Date {
  const { year, month } = viennaCalendarParts(now);
  return viennaMidnightUTC(year, Math.floor(month / 3) * 3, 1);
}

export function startOfYearVienna(now: Date = new Date()): Date {
  const { year } = viennaCalendarParts(now);
  return viennaMidnightUTC(year, 0, 1);
}
