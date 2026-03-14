"use client";

import { Alert, AlertTitle, Button, Stack } from "@mui/material";

export default function LoanComplianceError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Stack spacing={2}>
      <Alert
        action={
          <Button color="inherit" onClick={reset} size="small">
            Retry
          </Button>
        }
        severity="error"
      >
        <AlertTitle>Compliance dashboard failed to load</AlertTitle>
        {error.message || "Unable to fetch compliance data for this loan."}
      </Alert>
    </Stack>
  );
}
