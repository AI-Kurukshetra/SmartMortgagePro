import { AlertTriangle, CalendarClock, CheckCircle2, FileText } from "lucide-react";
import { calculateTRIDDeadlines, formatDisclosureDate, type LoanDisclosureSummary } from "@/lib/services/disclosures";
import { cn } from "@/lib/utils";

function toDate(value: string | null, fallback: Date) {
  if (!value) return fallback;
  return new Date(`${value}T12:00:00Z`);
}

export function DisclosureTimeline({ loan }: { loan: LoanDisclosureSummary }) {
  const applicationDate = new Date(loan.created_at);
  const closingDate = toDate(loan.expected_close_date, new Date(applicationDate.getTime() + 30 * 86400000));
  const deadlines = calculateTRIDDeadlines(applicationDate, closingDate);
  const milestones = [
    {
      label: "Application Received",
      date: applicationDate.toISOString(),
      icon: FileText,
      tone: "stable",
    },
    {
      label: "LE Deadline",
      date: deadlines.leDeadline.toISOString(),
      icon: CalendarClock,
      tone: "stable",
    },
    {
      label: "Earliest Closing",
      date: deadlines.earliestClosing.toISOString(),
      icon: CheckCircle2,
      tone: "stable",
    },
    {
      label: "CD Delivery Deadline",
      date: deadlines.cdDeadline.toISOString(),
      icon: AlertTriangle,
      tone: new Date() > deadlines.cdDeadline ? "critical" : "attention",
    },
  ] as const;

  return (
    <section
      data-testid="trid-timeline"
      className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">TRID Timeline</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">Disclosure delivery windows</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
          TRID
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {milestones.map((milestone) => {
          const Icon = milestone.icon;
          return (
            <div
              key={milestone.label}
              className={cn(
                "rounded-2xl border p-4",
                milestone.tone === "critical"
                  ? "border-rose-200 bg-rose-50"
                  : milestone.tone === "attention"
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-slate-50",
              )}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Icon className="size-4" />
                {milestone.label}
              </div>
              <p className="mt-2 text-sm text-slate-600">{formatDisclosureDate(milestone.date)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
