import Link from "next/link";
import { AlertTriangle, ArrowLeft, FileCheck2 } from "lucide-react";
import { notFound } from "next/navigation";
import { AcknowledgementStatus } from "@/components/disclosures/acknowledgement-status";
import { ChangedCircumstanceForm } from "@/components/disclosures/changed-circumstance-form";
import { DisclosureDeliveryTracker } from "@/components/disclosures/disclosure-delivery-tracker";
import { FeeToleranceTable } from "@/components/disclosures/fee-tolerance-table";
import {
  formatDisclosureStatus,
  formatDisclosureType,
  getDisclosureDetail,
  getLoanDisclosureSummary,
} from "@/lib/services/disclosures";

export const dynamic = "force-dynamic";

export default async function DisclosureDetailPage({
  params,
}: {
  params: Promise<{ loanId: string; disclosureId: string }>;
}) {
  const { loanId, disclosureId } = await params;
  const loan = await getLoanDisclosureSummary(loanId);

  if (!loan) {
    notFound();
  }

  const detail = await getDisclosureDetail(loanId, disclosureId);
  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_100%)] p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
        <Link
          href={`/loans/${loan.id}/disclosures`}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-white"
        >
          <ArrowLeft className="size-4" />
          Back to disclosures
        </Link>

        <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Disclosure Detail
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              {formatDisclosureType(detail.disclosure.type)}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {loan.borrower_name} · Version {detail.disclosure.version} ·{" "}
              {formatDisclosureStatus(detail.disclosure.status)}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileCheck2 className="size-4 text-sky-700" />
                Fee status
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {detail.toleranceResult.compliant ? "Compliant" : "Violation detected"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <AlertTriangle className="size-4 text-amber-700" />
                Findings
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {detail.toleranceResult.violations.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <FeeToleranceTable
          fees={detail.fees}
          violations={detail.toleranceResult.violations}
        />

        <div className="space-y-6">
          <DisclosureDeliveryTracker disclosure={detail.disclosure} />
          <AcknowledgementStatus disclosure={detail.disclosure} />
        </div>
      </div>

      {detail.disclosure.type === "closing_disclosure" ? (
        <ChangedCircumstanceForm loanId={loan.id} supersedesId={detail.disclosure.id} />
      ) : null}
    </div>
  );
}
