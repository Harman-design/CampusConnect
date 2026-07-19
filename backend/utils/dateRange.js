/**
 * Parses `startDate`/`endDate` query params (ISO strings, e.g. "2026-06-01") into
 * a concrete Date range. Defaults to the last 30 days if not provided.
 */
function parseDateRange(query, defaultDays = 30) {
  const now = new Date();
  const end = query.endDate ? new Date(query.endDate) : now;
  const start = query.startDate
    ? new Date(query.startDate)
    : new Date(now.getTime() - defaultDays * 24 * 60 * 60 * 1000);

  // Normalize to cover the full end day
  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

module.exports = { parseDateRange };
