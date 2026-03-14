import Link from "next/link";
import { FileBadge2, FileClock, ShieldAlert } from "lucide-react";
import {
  formatDisclosureDate,
  formatDisclosureStatus,
  formatDisclosureType,
  type DisclosureRecord,
} from "@/lib/services/disclosures";
import { cn } from "@/lib/utils";

const statusClasses = {
  draft: "bg-slate-100 text-slate-700",
  generated: "bg-amber-100 text-amber-800",
  sent: "bg-sky-100 text-sky-700",
  acknowledged: "bg-emerald-100 text-emerald-700",
  expired: "bg-rose-100 text-rose-700",
  superseded: "bg-slate-200 text-slate-700",
} as const;

export function DisclosureCard({
  disclosure,
  loanId,
}: {
  disclosure: DisclosureRecord;
  loanId: string;
}) {
  const Icon = disclosure.type === "closing_disclosure" ? ShieldAlert : FileBadge2;

  return (
    <article
      className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
      data-testid="disclosure-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-950 text-white">
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Version {disclosure.version}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">
              {formatDisclosureType(disclosure.type)}
            </h3>
          </div>
        </div>

        <span
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
            statusClasses[disclosure.status],
          )}
        >
          {formatDisclosureStatus(disclosure.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Issued</p>
          <p className="mt-1 font-medium text-slate-900">{formatDisclosureDate(disclosure.issued_date)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Due</p>
          <p className="mt-1 font-medium text-slate-900">{formatDisclosureDate(disclosure.due_date)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <FileClock className="size-4" />
        <span>{disclosure.file_path ? "PDF prepared" : "Pending PDF render"}</span>
        <Link
          href={`/loans/${loanId}/disclosures/${disclosure.id}`}
          className="ml-auto rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
        >
          Open details
        </Link>
      </div>
    </article>
  );
}
