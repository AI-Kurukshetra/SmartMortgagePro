import { AlertTriangle, FileStack, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { ChangedCircumstanceForm } from "@/components/disclosures/changed-circumstance-form";
import { DisclosureCard } from "@/components/disclosures/disclosure-card";
import { DisclosureTimeline } from "@/components/disclosures/disclosure-timeline";
import { GenerateDisclosureButton } from "@/components/disclosures/generate-disclosure-button";
import {
  formatDisclosureType,
  getDisclosureDetail,
  getLoanDisclosureSummary,
  listDisclosuresByLoanId,
} from "@/lib/services/disclosures";

export const dynamic = "force-dynamic";

export default async function LoanDisclosuresPage({
  params,
}: {
  params: Promise<{ loanId: string }>;
}) {
  const { loanId } = await params;
  const loan = await getLoanDisclosureSummary(loanId);

  if (!loan) {
    notFound();
  }

  const disclosures = await listDisclosuresByLoanId(loanId);
  const latestClosingDisclosure =
    disclosures.find((item) => item.type === "closing_disclosure") ?? null;
  const closingDisclosureDetail = latestClosingDisclosure
    ? await getDisclosureDetail(loanId, latestClosingDisclosure.id)
    : null;
  const violationCount = closingDisclosureDetail?.toleranceResult.violations.length ?? 0;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(8,145,178,0.16),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_100%)] p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Disclosure Center
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">{loan.borrower_name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Generate and track Loan Estimates, Closing Disclosures, and borrower delivery status without leaving the loan file.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <GenerateDisclosureButton
              loanId={loan.id}
              type="loan_estimate"
              testId="generate-le-btn"
            />
            <GenerateDisclosureButton loanId={loan.id} type="closing_disclosure" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FileStack className="size-4 text-sky-700" />
              Active disclosures
            </div>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{disclosures.length}</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="size-4 text-emerald-700" />
              Latest closing file
            </div>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {latestClosingDisclosure
                ? formatDisclosureType(latestClosingDisclosure.type)
                : "No closing disclosure yet"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <AlertTriangle className="size-4 text-amber-700" />
              Tolerance findings
            </div>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{violationCount}</p>
          </div>
        </div>
      </section>

      <DisclosureTimeline loan={loan} />

      {latestClosingDisclosure ? (
        <ChangedCircumstanceForm loanId={loan.id} supersedesId={latestClosingDisclosure.id} />
      ) : null}

      <section
        data-testid="disclosure-list"
        className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Disclosure Inventory
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Generated packages</h2>
        </div>

        {disclosures.length ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {disclosures.map((disclosure) => (
              <DisclosureCard key={disclosure.id} disclosure={disclosure} loanId={loan.id} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-lg font-semibold text-slate-950">No disclosures generated yet.</p>
            <p className="mt-2 text-sm text-slate-600">
              Start with the Loan Estimate to establish TRID timing for this file.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
