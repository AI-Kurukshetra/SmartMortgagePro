"use client";

import { Paper, Stack, Typography } from "@mui/material";
import type { ComplianceCheckView } from "@/lib/services/compliance-rules";

export function WaiverForm({ checks }: { checks: ComplianceCheckView[] }) {
  const waivedChecks = checks.filter((check) => check.status === "waived");

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        p: 2.5,
      }}
    >
      <Stack spacing={1.25}>
        <Typography variant="h6">Waiver governance</Typography>
        <Typography color="text.secondary" variant="body2">
          Waivers should remain rare, documented, and approved by underwriting or compliance leadership. This panel surfaces any currently waived checks and their rationale.
        </Typography>

        {waivedChecks.length ? (
          waivedChecks.map((check) => (
            <div key={check.id}>
              <Typography sx={{ fontWeight: 600 }} variant="body2">
                {check.checkName}
              </Typography>
              <Typography color="secondary.main" variant="body2">
                {check.waiverReason ?? "Waiver logged without a reason."}
              </Typography>
            </div>
          ))
        ) : (
          <Typography variant="body2">No waivers are currently recorded for this file.</Typography>
        )}
      </Stack>
    </Paper>
  );
}
