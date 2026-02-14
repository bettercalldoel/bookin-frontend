const DATE_PART_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;

export const parseDateValue = (
  value: string | Date | null | undefined,
): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const datePartMatch = trimmed.match(DATE_PART_REGEX);
  if (datePartMatch) {
    const [, yearText, monthText, dayText] = datePartMatch;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      const parsed = new Date(year, month - 1, day);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDateDDMMYYYY = (
  value: string | Date | null | undefined,
  fallback = "-",
) => {
  const date = parseDateValue(value);
  if (!date) return fallback;

  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = `${date.getFullYear()}`;
  return `${day}-${month}-${year}`;
};
