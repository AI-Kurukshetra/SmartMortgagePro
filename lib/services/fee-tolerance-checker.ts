import type { FeeTolerance } from "@/types/database.types";

export const ZERO_TOLERANCE = [
  "Origination Charges",
  "Points",
  "Application Fee",
  "Underwriting Fee",
  "Transfer Taxes",
] as const;

export const TEN_PERCENT_TOLERANCE = [
  "Recording Fees",
  "Required Third-Party Services (shopping list)",
] as const;

export type FeeInput = {
  name: string;
  category: string;
  amount: number;
};

export type FeeToleranceViolation = {
  fee: string;
  type: FeeTolerance;
  le: number;
  cd: number;
  overage: number;
};

export function getToleranceType(category: string): FeeTolerance {
  if ((ZERO_TOLERANCE as readonly string[]).includes(category)) return "zero";
  if ((TEN_PERCENT_TOLERANCE as readonly string[]).includes(category)) return "ten_percent";
  return "unlimited";
}

export function checkFeeTolerances(leFees: FeeInput[], cdFees: FeeInput[]) {
  const violations: FeeToleranceViolation[] = [];
  let tenPctLE = 0;
  let tenPctCD = 0;

  for (const cd of cdFees) {
    const le = leFees.find((fee) => fee.name === cd.name);
    if (!le) continue;

    const toleranceType = getToleranceType(cd.category);
    if (toleranceType === "zero" && cd.amount > le.amount) {
      violations.push({
        fee: cd.name,
        type: "zero",
        le: le.amount,
        cd: cd.amount,
        overage: cd.amount - le.amount,
      });
      continue;
    }

    if (toleranceType === "ten_percent") {
      tenPctLE += le.amount;
      tenPctCD += cd.amount;
    }
  }

  const tenPercentCap = tenPctLE * 1.1;
  if (tenPctCD > tenPercentCap) {
    violations.push({
      fee: "10% Aggregate",
      type: "ten_percent",
      le: tenPctLE,
      cd: tenPctCD,
      overage: tenPctCD - tenPercentCap,
    });
  }

  return {
    violations,
    compliant: violations.length === 0,
  };
}
