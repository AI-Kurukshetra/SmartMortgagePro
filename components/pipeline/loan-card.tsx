import Link from "next/link";
import { Clock3, MapPin, TriangleAlert } from "lucide-react";
import {
  formatCurrency,
  formatShortDate,
  getCloseTone,
  getDaysInStage,
  getHealthTone,
  getOutstandingTaskCount,
  type PipelineViewer,
} from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import type { LoanPriority, LoanRecord } from "@/types/database.types";
import { LoanHealthIndicator } from "@/components/pipeline/loan-health-indicator";

type LoanCardProps = {
  draggable?: boolean;
  isDragging?: boolean;
  loan: LoanRecord;
  onDragStart?: (loan: LoanRecord) => void;
  viewer: PipelineViewer;
};

const priorityClasses: Record<LoanPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-sky-100 text-sky-700",
  high: "bg-rose-100 text-rose-700",
};

function getViewerInitials(viewer: PipelineViewer) {
  const label = viewer.fullName || viewer.email || "LO";
  return label
    .split(/[ @]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function LoanCard({ draggable, isDragging, loan, onDragStart, viewer }: LoanCardProps) {
  const daysInStage = getDaysInStage(loan);
  const outstandingTasks = getOutstandingTaskCount(loan);

  return (
    <article
      data-testid="loan-card"
      draggable={draggable}
      onDragStart={() => onDragStart?.(loan)}
      className={cn(
        "rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-transform",
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "scale-[0.98] opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-900">{loan.borrower_name}</p>
          <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="size-3.5" />
            <span className="line-clamp-1">{loan.property_address}</span>
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-950 text-xs font-semibold text-white">
          {getViewerInitials(viewer)}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-lg font-semibold text-slate-900">{formatCurrency(loan.loan_amount)}</p>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
            priorityClasses[loan.priority],
          )}
        >
          {loan.priority}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span data-testid="days-in-stage">
          <LoanHealthIndicator
            tone={getHealthTone(daysInStage)}
            value={`${daysInStage}d in stage`}
          />
        </span>
        <span data-testid="outstanding-tasks">
          <LoanHealthIndicator
            tone={outstandingTasks >= 5 ? "critical" : outstandingTasks >= 3 ? "attention" : "stable"}
            value={`${outstandingTasks} open tasks`}
          />
        </span>
        <LoanHealthIndicator
          tone={getCloseTone(loan.expected_close_date)}
          value={`Close ${formatShortDate(loan.expected_close_date)}`}
        />
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Clock3 className="size-3.5" />
        <span>Last moved {formatShortDate(loan.updated_at)}</span>
        <Link
          href={`/loans/${loan.id}/messages`}
          className="ml-auto rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Messages
        </Link>
        <Link
          href={`/loans/${loan.id}/compliance`}
          className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
        >
          Compliance
        </Link>
        <Link
          href={`/loans/${loan.id}/documents`}
          className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
        >
          Documents
        </Link>
        <Link
          href={`/loans/${loan.id}/disclosures`}
          className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Disclosures
        </Link>
        {outstandingTasks >= 5 ? <TriangleAlert className="size-3.5 text-rose-500" /> : null}
      </div>
    </article>
  );
}
