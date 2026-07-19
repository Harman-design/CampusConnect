import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineArrowLeft, HiOutlinePaperAirplane } from 'react-icons/hi';
import { fetchTickets, fetchTicketById, createTicket, addTicketResponse } from '../services/supportTicketService';
import { TextInput } from '../components/FormField';
import { SelectInput } from '../components/SelectInput';
import Pagination from '../components/Pagination';

const CATEGORIES = ['account', 'technical', 'billing', 'academic', 'other'];
const PRIORITIES = ['low', 'medium', 'high'];

const STATUS_STYLES = {
  open: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
};

const emptyForm = { subject: '', description: '', category: 'other', priority: 'medium' };

export default function SupportTickets() {
  const [selectedId, setSelectedId] = useState(null);

  if (selectedId) {
    return <TicketDetail ticketId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return <TicketList onSelect={setSelectedId} />;
}

function TicketList({ onSelect }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-tickets', page],
    queryFn: () => fetchTickets({ page, limit: 10 }),
    keepPreviousData: true,
  });

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      toast.success('Support ticket created.');
      setForm(emptyForm);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create ticket.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject || !form.description) return toast.error('Subject and description are required.');
    createMutation.mutate(form);
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
            <p className="text-sm text-slate-500">Get help from the CampusConnect team.</p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <HiOutlinePlus className="h-4 w-4" /> New Ticket
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextInput className="sm:col-span-2" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              <SelectInput placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={CATEGORIES} />
              <SelectInput placeholder="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={PRIORITIES} />
              <textarea
                placeholder="Describe your issue..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="sm:col-span-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </button>
          </form>
        )}

        <div className="mt-6 space-y-2">
          {isLoading && [...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}

          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              Failed to load tickets: {error?.response?.data?.message || error.message}
            </div>
          )}

          {!isLoading && !isError && data?.tickets.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No support tickets yet.
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
                    {t.category} · {t.priority} priority · {new Date(t.createdAt).toLocaleDateString()}
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

function TicketDetail({ ticketId, onBack }) {
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
              <p className="mt-1 text-sm text-slate-500">{ticket.description}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[ticket.status]}`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {ticket.responses.map((r) => (
              <div
                key={r._id}
                className={`rounded-lg p-3 text-sm ${
                  r.senderRole === 'admin' ? 'bg-brand-50 text-brand-800' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <p className="text-xs font-semibold capitalize">{r.senderRole === 'admin' ? 'CampusConnect Team' : 'You'}</p>
                <p className="mt-1">{r.message}</p>
                <p className="mt-1 text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {ticket.responses.length === 0 && <p className="text-sm text-slate-400">No responses yet.</p>}
          </div>

          {isClosed ? (
            <p className="mt-6 rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-400">
              This ticket is {ticket.status}. Open a new ticket if you need further help.
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
