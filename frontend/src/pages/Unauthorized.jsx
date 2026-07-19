import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
      <h1 className="text-4xl font-bold text-slate-900">403</h1>
      <p className="text-sm text-slate-500">You don&apos;t have permission to view this page.</p>
      <Link to="/dashboard" className="mt-2 text-sm font-semibold text-brand-600 hover:underline">
        Go back home
      </Link>
    </div>
  );
}
