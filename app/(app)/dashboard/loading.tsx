export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-52 animate-pulse rounded-[32px] bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
        <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
        <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
        <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="h-[420px] animate-pulse rounded-[28px] bg-slate-200" />
        <div className="h-[420px] animate-pulse rounded-[28px] bg-slate-200" />
        <div className="h-[420px] animate-pulse rounded-[28px] bg-slate-200" />
        <div className="h-[420px] animate-pulse rounded-[28px] bg-slate-200" />
        <div className="h-[420px] animate-pulse rounded-[28px] bg-slate-200" />
      </div>
    </div>
  );
}
