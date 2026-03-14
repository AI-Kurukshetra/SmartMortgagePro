import { formatCurrency } from "@/lib/pipeline";
import type { DisclosureFeeRecord } from "@/lib/services/disclosures";
import type { FeeToleranceViolation } from "@/lib/services/fee-tolerance-checker";
import { cn } from "@/lib/utils";

function violationForFee(violations: FeeToleranceViolation[], feeName: string) {
  return violations.find((item) => item.fee === feeName);
}

export function FeeToleranceTable({
  fees,
  violations,
}: {
  fees: DisclosureFeeRecord[];
  violations: FeeToleranceViolation[];
}) {
  return (
    <section
      data-testid="fee-tolerance-table"
      className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
    >
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Fee Tolerances
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">Loan Estimate vs Closing Disclosure</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Fee</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 text-right font-semibold">LE</th>
              <th className="px-5 py-3 text-right font-semibold">CD</th>
              <th className="px-5 py-3 font-semibold">Tolerance</th>
              <th className="px-5 py-3 text-right font-semibold">Overage</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((fee) => {
              const violation = violationForFee(violations, fee.fee_name);
              return (
                <tr
                  key={fee.id}
                  className={cn(
                    "border-t border-slate-100",
                    violation ? "bg-rose-50/70 text-rose-900" : "text-slate-700",
                  )}
                >
                  <td className="px-5 py-4 font-medium">{fee.fee_name}</td>
                  <td className="px-5 py-4">{fee.fee_category}</td>
                  <td className="px-5 py-4 text-right font-mono">
                    {formatCurrency(Number(fee.le_amount ?? 0))}
                  </td>
                  <td className="px-5 py-4 text-right font-mono">
                    {formatCurrency(Number(fee.cd_amount ?? 0))}
                  </td>
                  <td className="px-5 py-4 uppercase tracking-[0.14em]">{fee.tolerance_type}</td>
                  <td className="px-5 py-4 text-right font-mono">
                    {violation ? formatCurrency(violation.overage) : "OK"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
