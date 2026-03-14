"use client";

import { ViewAgendaRounded, ViewModuleRounded } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuditTrailTable } from "@/src/components/blockchain/audit-trail-table";
import { ChecklistPanel } from "@/src/components/documents/checklist-panel";
import { DocumentCard } from "@/src/components/documents/document-card";
import { UploadZone } from "@/src/components/documents/upload-zone";
import { ErrorBoundary } from "@/src/components/shared/error-boundary";
import { useToast } from "@/src/components/shared/toast-provider";
import { useBlockchainAudit } from "@/src/hooks/use-blockchain-audit";
import { useDocumentUpload } from "@/src/hooks/use-document-upload";
import { mockDocumentService } from "@/src/services/document-service";
import { mockLoanService } from "@/src/services/loan-service";
import { useDocumentStore } from "@/src/store/document-store";

type VaultTab = "vault" | "audit";

export default function DocumentVaultPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const submission = useMemo(() => mockLoanService.getSubmissionSync(), []);
  const loanId = submission?.loanId ?? "";
  const loanType = submission?.application.loanType ?? "purchase";
  const { viewMode, setViewMode } = useDocumentStore();
  const [tab, setTab] = useState<VaultTab>("vault");
  const {
    documents,
    isLoadingDocuments,
    uploadDocument,
    deleteDocument,
    replaceDocument,
    uploadProgress,
    isDeleting,
  } = useDocumentUpload(loanId);
  const { auditTrail, verifyDocument, isVerifying } = useBlockchainAudit(loanId);

  useEffect(() => {
    if (!loanId) {
      pushToast({
        message: "Submit the loan application first to unlock the document vault.",
        severity: "warning",
      });
    }
  }, [loanId, pushToast]);

  if (!loanId) {
    return (
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px dashed rgba(15,23,42,0.18)" }}>
        <Typography variant="h6">Document vault unavailable</Typography>
        <Typography variant="body2" sx={{ mt: 1, color: "#64748B" }}>
          A loan record is created after the application is submitted.
        </Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/apply")}>
          Return to application
        </Button>
      </Paper>
    );
  }

  return (
    <ErrorBoundary title="Document Vault Failure">
      <Stack spacing={3}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            justifyContent="space-between"
            spacing={2}
            alignItems={{ xs: "flex-start", lg: "center" }}
          >
            <Box>
              <Typography variant="h6">Loan #{submission?.referenceNumber}</Typography>
              <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
                Upload, classify, verify, and anchor documents to the mock Ethereum audit layer.
              </Typography>
            </Box>

            <ToggleButtonGroup
              exclusive
              value={viewMode}
              onChange={(_, next) => next && setViewMode(next)}
              size="small"
            >
              <ToggleButton value="grid" aria-label="Grid view">
                <ViewModuleRounded fontSize="small" />
              </ToggleButton>
              <ToggleButton value="list" aria-label="List view">
                <ViewAgendaRounded fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Paper>

        <Tabs value={tab} onChange={(_, next) => setTab(next)} aria-label="Document vault sections">
          <Tab label="Vault" value="vault" />
          <Tab label="Audit Trail" value="audit" />
        </Tabs>

        {tab === "vault" ? (
          <Stack spacing={2.5}>
            <UploadZone
              progressByName={uploadProgress}
              onFilesAccepted={(files) => {
                files.forEach((file) => {
                  void uploadDocument(file).then(() => {
                    pushToast({
                      message: `${file.name} uploaded and anchored to the blockchain audit trail.`,
                      severity: "success",
                    });
                  });
                });
              }}
            />

            <Stack direction={{ xs: "column", xl: "row" }} spacing={2.5} alignItems="flex-start">
              <Box sx={{ width: { xs: "100%", xl: 320 }, flexShrink: 0 }}>
                <ChecklistPanel
                  loanType={loanType}
                  documents={documents}
                  onRequestMissingDocs={() =>
                    pushToast({
                      message: "Reminder sent for missing documents.",
                      severity: "info",
                    })
                  }
                />
              </Box>

              <Box
                sx={{
                  flex: 1,
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns:
                    viewMode === "grid"
                      ? { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }
                      : "1fr",
                  gap: 2,
                }}
              >
                {isLoadingDocuments
                  ? Array.from({ length: 3 }, (_, index) => (
                      <Skeleton key={index} variant="rounded" height={280} />
                    ))
                  : documents.map((document) => (
                      <DocumentCard
                        key={document.id}
                        document={document}
                        listView={viewMode === "list"}
                        onView={() => {
                          void mockDocumentService.recordDocumentAction(document.id, "view", {
                            id: "borrower",
                            fullName: "Jordan Bennett",
                            email: "jordan.bennett@smartmortgagepro.test",
                            role: "borrower",
                          });
                          pushToast({
                            message: `Viewing ${document.fileName}.`,
                            severity: "info",
                          });
                        }}
                        onDownload={() => {
                          void mockDocumentService.recordDocumentAction(document.id, "download", {
                            id: "borrower",
                            fullName: "Jordan Bennett",
                            email: "jordan.bennett@smartmortgagepro.test",
                            role: "borrower",
                          });
                          pushToast({
                            message: `${document.fileName} downloaded.`,
                            severity: "success",
                          });
                        }}
                        onDelete={() => {
                          const reason = window.prompt("Reason for deleting this document?", "Superseded by updated version");
                          if (!reason) return;
                          void deleteDocument({ documentId: document.id, reason }).then(() =>
                            pushToast({
                              message: `${document.fileName} deleted.`,
                              severity: "warning",
                            }),
                          );
                        }}
                        onReplace={(file) => {
                          void replaceDocument({ documentId: document.id, file }).then(() =>
                            pushToast({
                              message: `${document.fileName} replaced with a new version.`,
                              severity: "success",
                            }),
                          );
                        }}
                        onVerify={() => {
                          void verifyDocument(document.id)
                            .then((result) =>
                              pushToast({
                                message: result.matches
                                  ? `Integrity verified for ${document.fileName}.`
                                  : `Integrity mismatch detected for ${document.fileName}.`,
                                severity: result.matches ? "success" : "error",
                              }),
                            )
                            .catch((error: Error) =>
                              pushToast({ message: error.message, severity: "error" }),
                            );
                        }}
                      />
                    ))}
              </Box>
            </Stack>

            {isDeleting ? <Alert severity="warning">Deleting document…</Alert> : null}
            {isVerifying ? <Alert severity="info">Verifying document integrity…</Alert> : null}
          </Stack>
        ) : (
          <ErrorBoundary title="Audit Trail Failure">
            <AuditTrailTable entries={auditTrail} />
          </ErrorBoundary>
        )}
      </Stack>
    </ErrorBoundary>
  );
}
