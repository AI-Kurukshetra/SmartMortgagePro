import { cn } from "@/lib/utils";

type LoanHealthIndicatorProps = {
  tone: "stable" | "attention" | "critical" | "neutral";
  value: string;
};

const toneClasses: Record<LoanHealthIndicatorProps["tone"], string> = {
  stable: "border-emerald-200 bg-emerald-50 text-emerald-700",
  attention: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
};

export function LoanHealthIndicator({ tone, value }: LoanHealthIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        toneClasses[tone],
      )}
    >
      {value}
    </span>
  );
}
