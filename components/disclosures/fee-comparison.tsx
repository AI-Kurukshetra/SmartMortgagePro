import { FeeToleranceTable } from "@/components/disclosures/fee-tolerance-table";
import type { DisclosureFeeRecord } from "@/lib/services/disclosures";
import type { FeeToleranceViolation } from "@/lib/services/fee-tolerance-checker";

export function FeeComparison({
  fees,
  violations,
}: {
  fees: DisclosureFeeRecord[];
  violations: FeeToleranceViolation[];
}) {
  return <FeeToleranceTable fees={fees} violations={violations} />;
}
