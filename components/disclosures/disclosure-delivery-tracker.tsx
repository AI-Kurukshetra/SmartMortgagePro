import { CheckCircle2, CircleDashed, Send, Stamp } from "lucide-react";
import { formatDisclosureDateTime, type DisclosureRecord } from "@/lib/services/disclosures";
import { cn } from "@/lib/utils";

export function DisclosureDeliveryTracker({ disclosure }: { disclosure: DisclosureRecord }) {
  const steps = [
    {
      label: "Generated",
      value: formatDisclosureDateTime(disclosure.issued_date),
      done: Boolean(disclosure.issued_date),
      icon: Stamp,
    },
    {
      label: "Delivered",
      value: formatDisclosureDateTime(disclosure.sent_to_borrower_at),
      done: Boolean(disclosure.sent_to_borrower_at),
      icon: Send,
    },
    {
      label: "Acknowledged",
      value: formatDisclosureDateTime(disclosure.acknowledged_by_borrower_at),
      done: Boolean(disclosure.acknowledged_by_borrower_at),
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
        Delivery Tracker
      </p>
      <h3 className="mt-2 text-xl font-semibold text-slate-950">Disclosure lifecycle</h3>

      <div className="mt-4 space-y-3">
        {steps.map((step) => {
          const Icon = step.done ? step.icon : CircleDashed;
          return (
            <div
              key={step.label}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-4",
                step.done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl",
                  step.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500",
                )}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                <p className="text-sm text-slate-600">{step.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
