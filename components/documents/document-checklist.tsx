"use client";

import Link from "next/link";
import { CheckCircleOutline, RadioButtonUncheckedOutlined } from "@mui/icons-material";
import { Box, Paper, Stack, Typography } from "@mui/material";
import type { ChecklistItem, DocumentRecord } from "@/lib/documents/shared";
import type { ProfileRole } from "@/types/database.types";

type DocumentChecklistProps = {
  checklist: ChecklistItem[];
  documents: DocumentRecord[];
  loanId: string;
  viewerRole?: ProfileRole | null;
};

export function DocumentChecklist({
  checklist,
  documents,
  loanId,
  viewerRole,
}: DocumentChecklistProps) {
  const isBorrower = viewerRole === "borrower" || viewerRole === null;

  return (
    <Paper
      elevation={0}
      data-testid="document-checklist"
      sx={{
        border: "1px solid #dbeafe",
        borderRadius: 4,
        p: 2.5,
        height: "100%",
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" sx={{ color: "#0f172a" }}>
            Required Document Checklist
          </Typography>
          <Typography variant="body2" sx={{ color: "#475569", mt: 0.5 }}>
            This checklist adapts to the current stage, balance, and priority of the loan.
          </Typography>
        </Box>

        <Stack spacing={1.25}>
          {checklist.map((item) => {
            const matches = documents.filter((document) => document.category === item.category).length;
            const complete = matches > 0;
            const Icon = complete ? CheckCircleOutline : RadioButtonUncheckedOutlined;

            return (
              <Stack
                key={item.category}
                direction="row"
                spacing={1.25}
                alignItems="flex-start"
                sx={{
                  borderRadius: 3,
                  bgcolor: item.required ? "#f8fafc" : "#ffffff",
                  px: 1.25,
                  py: 1,
                }}
              >
                <Icon
                  fontSize="small"
                  sx={{ mt: 0.35, color: complete ? "#0f766e" : "#94a3b8" }}
                />
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: complete ? "#0f766e" : "#64748b" }}>
                      {complete ? `${matches} uploaded` : item.required ? "Required" : "Optional"}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    {item.description}
                  </Typography>
                  {isBorrower ? (
                    <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#0A7EA4" }}>
                      {complete
                        ? "Already received. Re-upload if your team requests a fresher copy."
                        : "Upload this document from the panel on the right to keep your file moving."}
                    </Typography>
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      <Link
                        href={`/loans/${loanId}/messages?template=document_request&category=${item.category}`}
                        className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700 transition hover:bg-sky-100"
                      >
                        {complete ? "Request refresh" : "Request via message"}
                      </Link>
                    </Box>
                  )}
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
}
