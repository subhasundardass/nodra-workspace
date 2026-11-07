export function formatDate(
  date: Date | string | number | null | undefined,
  opts: Intl.DateTimeFormatOptions = {},
) {
  if (date == null || date === "") return "";

  try {
    const parsed =
      typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? new Date(`${date}T00:00:00`)
        : new Date(date);

    if (Number.isNaN(parsed.getTime())) return "";

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...opts,
    }).format(parsed);
  } catch {
    return "";
  }
}

//--Timestamp

export function formatTimestamp(
  date: Date | string | number | null | undefined,
  opts: Intl.DateTimeFormatOptions = {},
) {
  if (date == null || date === "") return "";

  try {
    const parsed = date instanceof Date ? date : new Date(date);

    if (Number.isNaN(parsed.getTime())) return "";

    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      ...opts,
    }).format(parsed);
  } catch {
    return "";
  }
}

// --- Money Format
//formatMoney(1250, { style: "currency", currency: "INR" });
export function formatMoney(
  value: number | string | null | undefined,
  opts: Intl.NumberFormatOptions = {},
) {
  if (value == null || value === "") return "";

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return "";

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(parsed);
}
