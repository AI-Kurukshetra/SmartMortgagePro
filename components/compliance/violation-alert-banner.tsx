"use client";

import { Alert, AlertTitle } from "@mui/material";
import type { ComplianceOverview } from "@/lib/services/compliance";

export function ViolationAlertBanner({ overview }: { overview: ComplianceOverview }) {
  if (overview.violation === 0 && overview.warning === 0) {
    return null;
  }

  return (
    <Alert data-testid="violation-alert-banner" severity={overview.violation > 0 ? "error" : "warning"}>
      <AlertTitle>
        {overview.violation > 0 ? "Compliance issues need attention" : "Upcoming compliance deadlines"}
      </AlertTitle>
      {overview.violation > 0
        ? `${overview.violation} violation(s) and ${overview.warning} warning(s) are open on this file.`
        : `${overview.warning} warning(s) are approaching on this file.`}
    </Alert>
  );
}
