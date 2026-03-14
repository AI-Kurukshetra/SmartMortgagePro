export default function DashboardLoading() {
  return (
    <div className="grid gap-4">
      <div className="h-12 w-72 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-slate-200" />
    </div>
  );
}
