import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();

  const cards = [
    { label: 'View Analytics', href: '/admin/analytics', ready: true },
    { label: 'Manage Notes', href: '/admin/notes', ready: true },
    { label: 'Manage PYQs', href: '/admin/pyqs', ready: true },
    { label: 'Manage Placements', href: '/admin/placements', ready: true },
    { label: 'Manage Events', href: '/admin/events', ready: true },
    { label: 'Send Notifications', href: '/admin/notifications/send', ready: true },
    { label: 'Manage Complaints', href: '/admin/complaints', ready: true },
    { label: 'Manage Support Tickets', href: '/admin/support-tickets', ready: true },
  ];

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <span className="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
          ADMIN
        </span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Welcome, {user.name.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500">CampusConnect Admin Console</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map((card) =>
            card.ready ? (
              <a
                key={card.label}
                href={card.href}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <h3 className="text-sm font-semibold text-slate-800">{card.label}</h3>
                <p className="mt-1 text-xs text-emerald-500">Ready</p>
              </a>
            ) : (
              <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm opacity-60">
                <h3 className="text-sm font-semibold text-slate-800">{card.label}</h3>
                <p className="mt-1 text-xs text-slate-400">Available in a later phase</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
