export function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized || undefined;
}

const numericDatePattern = /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/;
const chineseDatePattern = /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/;
const chineseDateWithNumberPattern = /^(\d{4})年(\d{1,2})月(\d{1,2})[日号]?$/;

function normalizeDate(value: string | null | undefined, chinesePattern: RegExp): string | undefined {
  const compact = value?.replace(/\s+/g, "");
  if (!compact) {
    return undefined;
  }

  const match = compact.match(numericDatePattern) ?? compact.match(chinesePattern);
  if (!match) {
    return undefined;
  }

  const [, year = "", month = "", day = ""] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function normalizeDateToken(value: string | null | undefined): string | undefined {
  return normalizeDate(value, chineseDatePattern);
}

/** Also accepts the Chinese day-of-month suffix 号 used by some campus sites. */
export function normalizeDateTokenWithDayNumber(value: string | null | undefined): string | undefined {
  return normalizeDate(value, chineseDateWithNumberPattern);
}
