"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { GenerateDisclosureButton } from "@/components/disclosures/generate-disclosure-button";

const reasons = [
  "Rate lock adjustment",
  "Borrower-requested change",
  "Property valuation update",
  "Loan amount revision",
  "Title or recording fee change",
] as const;

export function ChangedCircumstanceForm({
  loanId,
  supersedesId,
}: {
  loanId: string;
  supersedesId: string;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <section
      className="rounded-[28px] border border-amber-200 bg-amber-50 p-5"
      data-testid="redisclose-btn"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <AlertTriangle className="size-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Changed Circumstance
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">Generate re-disclosure</h3>
          <p className="mt-2 text-sm text-slate-600">
            Required when fee or loan-term changes materially affect the previously delivered disclosure.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Reason
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <option value="">Select a reason</option>
            {reasons.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            placeholder="Document the operational reason for re-disclosure."
          />
        </label>
      </div>

      {error ? <p className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <div className="mt-4">
        <GenerateDisclosureButton
          loanId={loanId}
          type="closing_disclosure"
          supersedesId={supersedesId}
          changeReason={reason}
          changeNotes={notes}
          label="Generate Re-disclosure"
          onError={setError}
        />
      </div>
    </section>
  );
}
