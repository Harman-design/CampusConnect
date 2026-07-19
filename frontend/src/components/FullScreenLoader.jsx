export default function FullScreenLoader({ label = 'Loading...' }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-slate-50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
