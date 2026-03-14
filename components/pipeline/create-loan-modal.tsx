"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { createLoanAction } from "@/actions/loans";
import { Button } from "@/components/ui/button";

type CreateLoanModalProps = {
  onClose: () => void;
  onCreated: () => void;
};

export function CreateLoanModal({ onClose, onCreated }: CreateLoanModalProps) {
  const [isPending, startTransition] = useTransition();
  const [fields, setFields] = useState({
    borrowerName: "",
    propertyAddress: "",
    loanAmount: "",
    priority: "medium" as "low" | "medium" | "high",
    expectedCloseDate: "",
    borrowerEmail: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      void (async () => {
        const result = await createLoanAction({
          borrowerName: fields.borrowerName,
          propertyAddress: fields.propertyAddress,
          loanAmount: Number(fields.loanAmount),
          priority: fields.priority,
          expectedCloseDate: fields.expectedCloseDate || undefined,
          borrowerEmail: fields.borrowerEmail || undefined,
        });

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        toast.success("Loan created and added to the pipeline.");
        onCreated();
      })();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              New loan file
            </p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-950">Create loan</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Borrower name <span className="text-red-500">*</span>
              </label>
              <input
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                placeholder="Full name"
                value={fields.borrowerName}
                onChange={(e) => setFields((f) => ({ ...f, borrowerName: e.target.value }))}
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Borrower email
                <span className="ml-1 text-slate-400">(links account)</span>
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                placeholder="borrower@email.com"
                value={fields.borrowerEmail}
                onChange={(e) => setFields((f) => ({ ...f, borrowerEmail: e.target.value }))}
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Property address <span className="text-red-500">*</span>
              </label>
              <input
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                placeholder="123 Main St, City, ST 00000"
                value={fields.propertyAddress}
                onChange={(e) => setFields((f) => ({ ...f, propertyAddress: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Loan amount ($) <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                min={1}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                placeholder="450000"
                value={fields.loanAmount}
                onChange={(e) => setFields((f) => ({ ...f, loanAmount: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">Priority</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                value={fields.priority}
                onChange={(e) =>
                  setFields((f) => ({ ...f, priority: e.target.value as "low" | "medium" | "high" }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Expected close date
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                value={fields.expectedCloseDate}
                onChange={(e) => setFields((f) => ({ ...f, expectedCloseDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create loan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
