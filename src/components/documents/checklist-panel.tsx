"use client";

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { ProgressRing } from "@/src/components/shared/progress-ring";
import { StatusChip } from "@/src/components/shared/status-chip";
import { REQUIRED_DOCUMENT_TYPES, type Document, type LoanType } from "@/src/types/smart-mortgage";

export function ChecklistPanel({
  loanType,
  documents,
  onRequestMissingDocs,
}: {
  loanType: LoanType;
  documents: Document[];
  onRequestMissingDocs: () => void;
}) {
  const requiredItems = REQUIRED_DOCUMENT_TYPES[loanType];
  const uploadedCount = requiredItems.filter((item) =>
    documents.some((document) => document.detectedType === item.type),
  ).length;

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
      <Stack spacing={2}>
        <Typography variant="h6">Checklist</Typography>
        <ProgressRing
          value={(uploadedCount / Math.max(requiredItems.length, 1)) * 100}
          label={`${uploadedCount}/${requiredItems.length}`}
        />

        {requiredItems.map((item) => {
          const document = documents.find((entry) => entry.detectedType === item.type);
          const status = document?.checklistStatus ?? "not_uploaded";

          return (
            <Box key={item.type}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#0A1628" }}>
                {item.label}
              </Typography>
              <StatusChip
                label={status.replaceAll("_", " ")}
                tone={
                  status === "verified"
                    ? "success"
                    : status === "expired"
                      ? "warning"
                      : status === "rejected"
                        ? "error"
                        : status === "uploaded_pending_review"
                          ? "info"
                          : "default"
                }
              />
            </Box>
          );
        })}

        <Button variant="outlined" onClick={onRequestMissingDocs}>
          Request Missing Docs
        </Button>
      </Stack>
    </Paper>
  );
}
