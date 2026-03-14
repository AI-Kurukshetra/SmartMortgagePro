const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeDate(input: Date | string) {
  const value = input instanceof Date ? input : new Date(input);
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function toIsoDate(value: Date) {
  return value.toISOString();
}

export function businessDays(date: Date | string, days: number) {
  let count = 0;
  const result = normalizeDate(date);
  const direction = days >= 0 ? 1 : -1;
  const remaining = Math.abs(days);

  while (count < remaining) {
    result.setUTCDate(result.getUTCDate() + direction);
    const day = result.getUTCDay();
    if (day !== 0 && day !== 6) {
      count += 1;
    }
  }

  return result;
}

export function dayDiff(from: Date | string, to: Date | string) {
  const fromDate = normalizeDate(from);
  const toDate = normalizeDate(to);
  return Math.round((toDate.getTime() - fromDate.getTime()) / DAY_MS);
}

export function calculateTRIDDeadlines(applicationDate: Date | string, closingDate?: Date | string | null) {
  const normalizedApplicationDate = normalizeDate(applicationDate);
  const normalizedClosingDate = closingDate ? normalizeDate(closingDate) : null;

  return {
    applicationDate: toIsoDate(normalizedApplicationDate),
    closingDate: normalizedClosingDate ? toIsoDate(normalizedClosingDate) : null,
    leDeadline: toIsoDate(businessDays(normalizedApplicationDate, 3)),
    earliestClosing: toIsoDate(businessDays(normalizedApplicationDate, 7)),
    cdDeadline: normalizedClosingDate ? toIsoDate(businessDays(normalizedClosingDate, -3)) : null,
  };
}

export function checkTRIDCompliance({
  applicationDate,
  closingDate,
  leIssuedDate,
  cdIssuedDate,
  now = new Date(),
}: {
  applicationDate: Date | string;
  closingDate?: Date | string | null;
  leIssuedDate?: Date | string | null;
  cdIssuedDate?: Date | string | null;
  now?: Date;
}) {
  const deadlines = calculateTRIDDeadlines(applicationDate, closingDate);
  const warnings: string[] = [];
  const violations: string[] = [];

  if (leIssuedDate) {
    if (dayDiff(deadlines.leDeadline, leIssuedDate) > 0) {
      violations.push("Loan Estimate was issued after the 3-business-day TRID deadline.");
    }
  } else {
    const leWindow = dayDiff(now, deadlines.leDeadline);
    if (leWindow < 0) {
      violations.push("Loan Estimate deadline passed without an issuance event.");
    } else if (leWindow <= 1) {
      warnings.push(`Loan Estimate deadline is due in ${leWindow} day(s).`);
    }
  }

  if (deadlines.cdDeadline) {
    if (cdIssuedDate) {
      if (dayDiff(deadlines.cdDeadline, cdIssuedDate) > 0) {
        violations.push("Closing Disclosure was issued after the 3-business-day waiting period.");
      }
    } else {
      const cdWindow = dayDiff(now, deadlines.cdDeadline);
      if (cdWindow < 0) {
        violations.push("Closing Disclosure deadline passed without an issuance event.");
      } else if (cdWindow <= 1) {
        warnings.push(`Closing Disclosure deadline is due in ${cdWindow} day(s).`);
      }
    }
  }

  return {
    deadlines,
    isCompliant: violations.length === 0,
    warnings,
    violations,
  };
}
