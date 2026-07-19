import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';
import { fetchComplaints, createComplaint } from '../services/complaintService';
import { TextInput } from '../components/FormField';
import { SelectInput } from '../components/SelectInput';
import Pagination from '../components/Pagination';

const CATEGORIES = ['academic', 'hostel', 'infrastructure', 'faculty', 'technical', 'other'];

const STATUS_STYLES = {
  open: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
};

const emptyForm = { subject: '', description: '', category: 'other' };

export default function Complaints() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-complaints', page],
    queryFn: () => fetchComplaints({ page, limit: 10 }),
    keepPreviousData: true,
  });

  const createMutation = useMutation({
    mutationFn: createComplaint,
    onSuccess: () => {
      toast.success('Complaint submitted.');
      setForm(emptyForm);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['my-complaints'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit complaint.'),
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
            <h1 className="text-2xl font-bold text-slate-900">Complaints</h1>
            <p className="text-sm text-slate-500">Raise a complaint and track its resolution.</p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <HiOutlinePlus className="h-4 w-4" /> New Complaint
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="grid grid-cols-1 gap-3">
              <TextInput placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              <SelectInput placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={CATEGORIES} />
              <textarea
                placeholder="Describe your complaint in detail..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        )}

        <div className="mt-6 space-y-3">
          {isLoading && [...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}

          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              Failed to load complaints: {error?.response?.data?.message || error.message}
            </div>
          )}

          {!isLoading && !isError && data?.complaints.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              You haven't filed any complaints yet.
            </div>
          )}

          {!isLoading &&
            !isError &&
            data?.complaints.map((c) => (
              <div key={c._id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">{c.subject}</h3>
                    <p className="text-xs capitalize text-slate-400">{c.category} · {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[c.status]}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{c.description}</p>
                {c.adminResponse && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">Admin response: </span>
                    {c.adminResponse}
                  </div>
                )}
              </div>
            ))}
        </div>

        <Pagination pagination={data?.pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
