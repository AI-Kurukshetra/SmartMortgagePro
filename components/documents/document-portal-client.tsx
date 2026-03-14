"use client";

import Link from "next/link";
import { Alert, Box, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "@/components/documents/document-card";
import { DocumentChecklist } from "@/components/documents/document-checklist";
import { DocumentUploadZone } from "@/components/documents/document-upload-zone";
import { UploadProgress } from "@/components/documents/upload-progress";
import { useDocuments } from "@/hooks/use-documents";
import {
  formatLoanPriority,
  formatLoanStage,
  getDocumentChecklist,
  type DocumentRecord,
  type LoanDocumentSummary,
} from "@/lib/documents/shared";
import type { DocCategory, ProfileRole } from "@/types/database.types";

export function DocumentPortalClient({
  loan,
  initialDocuments,
  bootstrapError,
  viewerRole,
}: {
  loan: LoanDocumentSummary;
  initialDocuments: DocumentRecord[];
  bootstrapError?: string;
  viewerRole?: ProfileRole | null;
}) {
  const isBorrower = viewerRole === "borrower" || viewerRole === null;
  const [selectedCategory, setSelectedCategory] = useState<DocCategory>("pay_stub");
  const {
    documents,
    errorMessage,
    isBulkDownloading,
    pendingUploads,
    uploadFiles,
    downloadDocument,
    downloadAllDocuments,
  } = useDocuments({
    loanId: loan.id,
    initialDocuments,
  });

  const checklist = getDocumentChecklist(loan);

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          border: "1px solid #dbeafe",
          background:
            "linear-gradient(140deg, rgba(224,242,254,0.9) 0%, rgba(248,250,252,0.95) 55%, rgba(240,249,255,0.9) 100%)",
          p: { xs: 2.5, md: 3.5 },
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "#0284c7", letterSpacing: "0.16em", fontWeight: 700 }}
              >
                Document Upload Portal
              </Typography>
              <Typography variant="h4" sx={{ color: "#0f172a", mt: 0.5 }}>
                {loan.borrower_name}
              </Typography>
              <Typography variant="body1" sx={{ color: "#475569", mt: 0.5 }}>
                {loan.property_address}
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                {isBorrower
                  ? "Upload the items your loan team requested and track what has already been received."
                  : "Review borrower uploads, request refreshes, and download the file package for processing."}
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
              <Button
                type="button"
                variant="secondary"
                onClick={downloadAllDocuments}
                disabled={isBorrower || !documents.length || isBulkDownloading}
              >
                {isBulkDownloading ? "Preparing..." : "Download All Files"}
              </Button>
              <Link
                href={isBorrower ? `/my-loans/${loan.id}` : "/pipeline"}
                className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
              >
                {isBorrower ? "Back to Loan Status" : "Back to Pipeline"}
              </Link>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`Stage: ${formatLoanStage(loan.stage)}`} color="primary" />
            <Chip label={`Priority: ${formatLoanPriority(loan.priority)}`} />
            <Chip
              label={`Loan Amount: ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(loan.loan_amount)}`}
            />
            <Chip label={`${documents.length} files uploaded`} />
          </Stack>
        </Stack>
      </Paper>

      {bootstrapError && <Alert severity="warning">{bootstrapError}</Alert>}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <DocumentChecklist
            checklist={checklist}
            documents={documents}
            loanId={loan.id}
            viewerRole={viewerRole}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={2.5}>
            <DocumentUploadZone
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              onFilesSelected={(files) => {
                void uploadFiles(files, selectedCategory);
              }}
            />
            <UploadProgress uploads={pendingUploads} />
          </Stack>
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #dbeafe",
          borderRadius: 4,
          p: 2.5,
        }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ color: "#0f172a" }}>
              Uploaded Documents
            </Typography>
            <Typography variant="body2" sx={{ color: "#475569", mt: 0.5 }}>
              Newly uploaded files enter processing immediately and can be reviewed or downloaded from here.
            </Typography>
          </Box>

          {documents.length ? (
            <Stack spacing={1.5}>
              {documents.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onDownload={(documentId) => {
                    void downloadDocument(documentId);
                  }}
                />
              ))}
            </Stack>
          ) : (
            <Paper
              elevation={0}
              sx={{
                border: "1px dashed #cbd5e1",
                borderRadius: 4,
                p: 3,
                bgcolor: "#f8fafc",
              }}
            >
              <Typography variant="body1" sx={{ color: "#0f172a", fontWeight: 600 }}>
                No documents uploaded yet.
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", mt: 0.75 }}>
                Start by dragging files into the portal or browsing from your device.
              </Typography>
            </Paper>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
