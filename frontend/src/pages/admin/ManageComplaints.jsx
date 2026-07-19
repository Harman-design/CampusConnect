import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchComplaints, resolveComplaint } from '../../services/complaintService';
import { SelectInput } from '../../components/SelectInput';
import Pagination from '../../components/Pagination';

const STATUSES = ['open', 'in_progress', 'resolved', 'rejected'];

const STATUS_STYLES = {
  open: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
};

export default function ManageComplaints() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [responses, setResponses] = useState({});

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-complaints', page, statusFilter],
    queryFn: () => fetchComplaints({ page, limit: 10, status: statusFilter || undefined }),
    keepPreviousData: true,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, payload }) => resolveComplaint(id, payload),
    onSuccess: () => {
      toast.success('Complaint updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-complaints'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900">Manage Complaints</h1>
        <p className="text-sm text-slate-500">Review and resolve student complaints.</p>

        <div className="mt-6 w-56">
          <SelectInput placeholder="All statuses" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUSES} />
        </div>

        <div className="mt-6 space-y-3">
          {isLoading && [...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />)}

          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              Failed to load complaints: {error?.response?.data?.message || error.message}
            </div>
          )}

          {!isLoading && !isError && data?.complaints.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No complaints found.
            </div>
          )}

          {!isLoading &&
            !isError &&
            data?.complaints.map((c) => (
              <div key={c._id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">{c.subject}</h3>
                    <p className="text-xs capitalize text-slate-400">
                      {c.student?.name} · {c.category} · {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[c.status]}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{c.description}</p>

                {c.adminResponse && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">Previous response: </span>
                    {c.adminResponse}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    placeholder="Response (optional)"
                    value={responses[c._id] ?? ''}
                    onChange={(e) => setResponses({ ...responses, [c._id]: e.target.value })}
                    className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                  {STATUSES.filter((s) => s !== c.status).map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        resolveMutation.mutate({ id: c._id, payload: { status: s, adminResponse: responses[c._id] || c.adminResponse } })
                      }
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium capitalize text-slate-600 hover:bg-slate-50"
                    >
                      Mark {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <Pagination pagination={data?.pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
