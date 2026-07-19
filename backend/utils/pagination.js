function parsePagination(query, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildPaginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

module.exports = { parsePagination, buildPaginationMeta };
