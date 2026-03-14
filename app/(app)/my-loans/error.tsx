"use client";

import { Alert, AlertTitle, Button, Stack } from "@mui/material";

export default function BorrowerStatusError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Stack spacing={2}>
      <Alert
        severity="error"
        action={
          <Button color="inherit" onClick={reset} size="small">
            Retry
          </Button>
        }
      >
        <AlertTitle>Borrower status portal failed to load</AlertTitle>
        {error.message || "Unable to load your loan status right now."}
      </Alert>
    </Stack>
  );
}
