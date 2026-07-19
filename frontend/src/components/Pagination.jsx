export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        disabled={!pagination.hasPrevPage}
        onClick={() => onPageChange(pagination.page - 1)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-slate-500">
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <button
        disabled={!pagination.hasNextPage}
        onClick={() => onPageChange(pagination.page + 1)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
