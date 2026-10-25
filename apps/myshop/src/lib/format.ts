export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {},
) {
  if (!date) return "";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date));
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
