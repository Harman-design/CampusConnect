import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBell, HiOutlineCheck } from 'react-icons/hi';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../services/notificationService';
import { useNotifications } from '../context/NotificationContext';
import Pagination from '../components/Pagination';

const TYPE_STYLES = {
  notes: 'bg-blue-50 text-blue-700',
  pyq: 'bg-purple-50 text-purple-700',
  placement: 'bg-emerald-50 text-emerald-700',
  event: 'bg-amber-50 text-amber-700',
  announcement: 'bg-slate-100 text-slate-700',
};

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshUnreadCount } = useNotifications();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => fetchNotifications({ page, limit: 15 }),
    keepPreviousData: true,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      refreshUnreadCount();
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      refreshUnreadCount();
    },
  });

  const handleClick = (notification) => {
    if (!notification.isRead) markReadMutation.mutate(notification._id);
    if (notification.link) navigate(notification.link.replace(/^https?:\/\/[^/]+/, ''));
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending || !data?.unreadCount}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <HiOutlineCheck className="h-4 w-4" /> Mark all as read
          </button>
        </div>

        <div className="mt-6 space-y-2">
          {isLoading && [...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}

          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              Failed to load notifications: {error?.response?.data?.message || error.message}
            </div>
          )}

          {!isLoading && !isError && data?.notifications.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <HiOutlineBell className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">You're all caught up.</p>
            </div>
          )}

          {!isLoading &&
            !isError &&
            data?.notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => handleClick(n)}
                className={`w-full rounded-xl border p-4 text-left transition hover:shadow-sm ${
                  n.isRead ? 'border-slate-200 bg-white' : 'border-brand-200 bg-brand-50/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${TYPE_STYLES[n.type]}`}>{n.type}</span>
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-slate-800">{n.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
        </div>

        <Pagination pagination={data?.pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
