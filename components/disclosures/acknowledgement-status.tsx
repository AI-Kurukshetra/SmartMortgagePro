import { formatDisclosureDateTime, type DisclosureRecord } from "@/lib/services/disclosures";

export function AcknowledgementStatus({ disclosure }: { disclosure: DisclosureRecord }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
        Borrower Acknowledgement
      </p>
      <h3 className="mt-2 text-xl font-semibold text-slate-950">Delivery and consent</h3>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Sent to borrower</p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {formatDisclosureDateTime(disclosure.sent_to_borrower_at)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Acknowledged</p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {formatDisclosureDateTime(disclosure.acknowledged_by_borrower_at)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {disclosure.acknowledgement_method
              ? `Method: ${disclosure.acknowledgement_method}`
              : "Awaiting borrower acknowledgement."}
          </p>
        </div>
      </div>
    </section>
  );
}
