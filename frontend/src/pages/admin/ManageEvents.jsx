import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiOutlineTrash, HiOutlinePencil, HiOutlineUsers } from 'react-icons/hi';
import { fetchEvents, createEvent, updateEvent, deleteEvent, fetchEventRegistrations } from '../../services/eventService';
import { TextInput } from '../../components/FormField';
import { SelectInput } from '../../components/SelectInput';
import Pagination from '../../components/Pagination';

const CATEGORIES = ['technical', 'cultural', 'sports', 'workshop', 'seminar', 'other'];

const emptyForm = {
  title: '',
  description: '',
  category: 'other',
  venue: '',
  startAt: '',
  endAt: '',
  registrationDeadline: '',
  capacity: '',
};

export default function ManageEvents() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [viewingRegsFor, setViewingRegsFor] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-events', page],
    queryFn: () => fetchEvents({ page, limit: 10 }),
    keepPreviousData: true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-events'] });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      toast.success('Event created.');
      resetForm();
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateEvent(id, payload),
    onSuccess: () => {
      toast.success('Event updated.');
      resetForm();
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      toast.success('Event deleted.');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed.'),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (event) => {
    setEditingId(event._id);
    setForm({
      title: event.title,
      description: event.description || '',
      category: event.category,
      venue: event.venue || '',
      startAt: event.startAt ? event.startAt.slice(0, 16) : '',
      endAt: event.endAt ? event.endAt.slice(0, 16) : '',
      registrationDeadline: event.registrationDeadline ? event.registrationDeadline.slice(0, 16) : '',
      capacity: event.capacity || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      capacity: form.capacity ? Number(form.capacity) : 0,
      endAt: form.endAt || undefined,
      registrationDeadline: form.registrationDeadline || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900">Manage Events</h1>
        <p className="text-sm text-slate-500">Create and manage campus events and registrations.</p>

        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-800">{editingId ? 'Edit Event' : 'Create New Event'}</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <SelectInput placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={CATEGORIES} />
            <TextInput placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            <TextInput type="number" min={0} placeholder="Capacity (0 = unlimited)" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            <TextInput
              type="datetime-local"
              placeholder="Start"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              required
            />
            <TextInput type="datetime-local" placeholder="End" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
            <TextInput
              type="datetime-local"
              placeholder="Registration Deadline"
              value={form.registrationDeadline}
              onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
            />
            <TextInput
              className="sm:col-span-2"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={isSubmitting} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {isSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Event'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mt-8">
          {isLoading && <div className="h-40 animate-pulse rounded-xl bg-slate-100" />}
          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              Failed to load events: {error?.response?.data?.message || error.message}
            </div>
          )}
          {!isLoading && !isError && data?.events.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No events yet.
            </div>
          )}

          {!isLoading &&
            !isError &&
            data?.events.map((event) => (
              <div key={event._id} className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">{event.title}</h3>
                    <p className="text-xs text-slate-400">
                      {new Date(event.startAt).toLocaleString()} · {event.registeredCount}
                      {event.capacity > 0 ? `/${event.capacity}` : ''} registered
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingRegsFor(viewingRegsFor === event._id ? null : event._id)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <HiOutlineUsers className="h-4 w-4" /> Registrations
                    </button>
                    <button onClick={() => startEdit(event)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                      <HiOutlinePencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => confirm('Delete this event and all registrations?') && deleteMutation.mutate(event._id)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {viewingRegsFor === event._id && <RegistrationsPanel eventId={event._id} />}
              </div>
            ))}

          <Pagination pagination={data?.pagination} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}

function RegistrationsPanel({ eventId }) {
  const { data: registrations, isLoading } = useQuery({
    queryKey: ['event-registrations', eventId],
    queryFn: () => fetchEventRegistrations(eventId),
  });

  if (isLoading) return <div className="mt-3 h-16 animate-pulse rounded-lg bg-slate-100" />;

  if (!registrations || registrations.length === 0) {
    return <p className="mt-3 text-sm text-slate-400">No registrations yet.</p>;
  }

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Dept</th>
            <th className="px-3 py-2">Sem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {registrations.map((reg) => (
            <tr key={reg._id}>
              <td className="px-3 py-2 font-medium text-slate-700">{reg.student?.name}</td>
              <td className="px-3 py-2 text-slate-500">{reg.student?.email}</td>
              <td className="px-3 py-2 text-slate-500">{reg.student?.department}</td>
              <td className="px-3 py-2 text-slate-500">{reg.student?.semester}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
