import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineUserGroup } from 'react-icons/hi';
import { fetchEvents, registerForEvent, cancelEventRegistration } from '../services/eventService';
import { SelectInput } from '../components/SelectInput';
import Pagination from '../components/Pagination';

const CATEGORIES = ['technical', 'cultural', 'sports', 'workshop', 'seminar', 'other'];

export default function Events() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ category: '', upcomingOnly: 'true', page: 1 });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['events', filters],
    queryFn: () => fetchEvents(filters),
    keepPreviousData: true,
  });

  const registerMutation = useMutation({
    mutationFn: registerForEvent,
    onSuccess: () => {
      toast.success('Registered! See you there.');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Registration failed.'),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelEventRegistration,
    onSuccess: () => {
      toast.success('Registration cancelled.');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not cancel.'),
  });

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900">Events</h1>
        <p className="text-sm text-slate-500">Register for upcoming campus events.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="w-48">
            <SelectInput placeholder="All categories" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} options={CATEGORIES} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={filters.upcomingOnly === 'true'} onChange={(e) => updateFilter('upcomingOnly', e.target.checked ? 'true' : '')} />
            Upcoming only
          </label>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isLoading && [...Array(4)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />)}

          {isError && (
            <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              Failed to load events: {error?.response?.data?.message || error.message}
            </div>
          )}

          {!isLoading && !isError && data?.events.length === 0 && (
            <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No events found.
            </div>
          )}

          {!isLoading &&
            !isError &&
            data?.events.map((event) => (
              <div key={event._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium capitalize text-brand-700">
                  {event.category}
                </span>
                <h3 className="mt-2 font-semibold text-slate-800">{event.title}</h3>

                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <HiOutlineCalendar className="h-4 w-4" /> {new Date(event.startAt).toLocaleString()}
                  </p>
                  {event.venue && (
                    <p className="flex items-center gap-1.5">
                      <HiOutlineLocationMarker className="h-4 w-4" /> {event.venue}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <HiOutlineUserGroup className="h-4 w-4" /> {event.registeredCount}
                    {event.capacity > 0 ? ` / ${event.capacity}` : ''} registered
                  </p>
                </div>

                {event.description && <p className="mt-3 text-sm text-slate-500 line-clamp-2">{event.description}</p>}

                <div className="mt-4">
                  {event.isRegistered ? (
                    <button
                      onClick={() => cancelMutation.mutate(event._id)}
                      disabled={cancelMutation.isPending}
                      className="w-full rounded-lg border border-red-300 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Cancel Registration
                    </button>
                  ) : (
                    <button
                      onClick={() => registerMutation.mutate(event._id)}
                      disabled={event.isFull || registerMutation.isPending}
                      className="w-full rounded-lg bg-brand-600 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {event.isFull ? 'Full' : 'Register'}
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>

        <Pagination pagination={data?.pagination} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
      </div>
    </div>
  );
}
