import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlinePaperAirplane } from 'react-icons/hi';
import { fetchTickets, fetchTicketById, addTicketResponse, updateTicketStatus } from '../../services/supportTicketService';
import { SelectInput } from '../../components/SelectInput';
import Pagination from '../../components/Pagination';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

const STATUS_STYLES = {
  open: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
};

export default function ManageSupportTickets() {
  const [selectedId, setSelectedId] = useState(null);

  if (selectedId) {
    return <AdminTicketDetail ticketId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return <AdminTicketList onSelect={setSelectedId} />;
}

function AdminTicketList({ onSelect }) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-tickets', page, statusFilter],
    queryFn: () => fetchTickets({ page, limit: 10, status: statusFilter || undefined }),
    keepPreviousData: true,
  });

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
        <p className="text-sm text-slate-500">Respond to student support requests.</p>

        <div className="mt-6 w-56">
          <SelectInput placeholder="All statuses" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUSES} />
        </div>

        <div className="mt-6 space-y-2">
          {isLoading && [...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}

          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              Failed to load tickets: {error?.response?.data?.message || error.message}
            </div>
          )}

          {!isLoading && !isError && data?.tickets.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No tickets found.
            </div>
          )}

          {!isLoading &&
            !isError &&
            data?.tickets.map((t) => (
              <button
                key={t._id}
                onClick={() => onSelect(t._id)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left hover:shadow-sm"
              >
                <div>
                  <h3 className="font-semibold text-slate-800">{t.subject}</h3>
                  <p className="text-xs capitalize text-slate-400">
                    {t.student?.name} · {t.category} · {t.priority} priority
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[t.status]}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </button>
            ))}
        </div>

        <Pagination pagination={data?.pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}

function AdminTicketDetail({ ticketId, onBack }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => fetchTicketById(ticketId),
  });

  const respondMutation = useMutation({
    mutationFn: (msg) => addTicketResponse(ticketId, msg),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not send reply.'),
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateTicketStatus(ticketId, status),
    onSuccess: () => {
      toast.success('Status updated.');
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    respondMutation.mutate(message);
  };

  if (isLoading || !ticket) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl h-64 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  const isClosed = ['resolved', 'closed'].includes(ticket.status);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <HiOutlineArrowLeft className="h-4 w-4" /> Back to tickets
        </button>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900">{ticket.subject}</h1>
              <p className="text-xs text-slate-400">
                {ticket.student?.name} ({ticket.student?.email})
              </p>
              <p className="mt-2 text-sm text-slate-500">{ticket.description}</p>
            </div>
            <SelectInput value={ticket.status} onChange={(e) => statusMutation.mutate(e.target.value)} options={STATUSES} placeholder="" />
          </div>

          <div className="mt-6 space-y-3">
            {ticket.responses.map((r) => (
              <div key={r._id} className={`rounded-lg p-3 text-sm ${r.senderRole === 'admin' ? 'bg-brand-50 text-brand-800' : 'bg-slate-50 text-slate-700'}`}>
                <p className="text-xs font-semibold capitalize">{r.senderRole === 'admin' ? 'You (Admin)' : ticket.student?.name}</p>
                <p className="mt-1">{r.message}</p>
                <p className="mt-1 text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {ticket.responses.length === 0 && <p className="text-sm text-slate-400">No responses yet.</p>}
          </div>

          {isClosed ? (
            <p className="mt-6 rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-400">
              This ticket is {ticket.status}. Reopen it by changing the status above to reply again.
            </p>
          ) : (
            <form onSubmit={handleSend} className="mt-6 flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a reply..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="submit"
                disabled={respondMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                <HiOutlinePaperAirplane className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
