"use client";

import { DownloadOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { Chip, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentCategoryBadge } from "@/components/documents/document-category-badge";
import type { DocumentRecord } from "@/lib/documents/shared";

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getDocumentAgeDays(createdAt: string, now: number) {
  const ageMs = now - new Date(createdAt).getTime();
  return Math.floor(ageMs / (1000 * 60 * 60 * 24));
}

export function DocumentCard({
  document,
  onDownload,
}: {
  document: DocumentRecord;
  onDownload: (documentId: string) => void;
}) {
  const [renderedAt] = useState(() => Date.now());
  const ageDays = getDocumentAgeDays(document.created_at, renderedAt);
  const needsAgeReview = ageDays > 60;
  const hasUpcomingExpiry =
    document.expires_at !== null &&
    new Date(document.expires_at).getTime() - renderedAt < 1000 * 60 * 60 * 24 * 14;

  return (
    <Paper
      elevation={0}
      data-testid="document-card"
      sx={{
        border: "1px solid #dbeafe",
        borderRadius: 4,
        p: 2,
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
          <Stack spacing={0.75}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a" }}>
              {document.file_name}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <DocumentCategoryBadge category={document.category} />
              <Chip
                size="small"
                label={document.status}
                color={
                  document.status === "verified"
                    ? "success"
                    : document.status === "rejected"
                      ? "error"
                      : document.status === "expired"
                        ? "warning"
                        : "primary"
                }
                sx={{ textTransform: "lowercase" }}
              />
            </Stack>
          </Stack>

          <Button type="button" size="sm" variant="secondary" onClick={() => onDownload(document.id)}>
            <DownloadOutlined sx={{ fontSize: 16, mr: 0.75 }} />
            Download
          </Button>
        </Stack>

        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
          <Typography variant="body2" sx={{ color: "#475569" }}>
            Uploaded {formatDate(document.created_at)}
          </Typography>
          <Typography variant="body2" sx={{ color: "#475569" }}>
            Size {formatFileSize(document.file_size)}
          </Typography>
          <Typography variant="body2" sx={{ color: "#475569" }}>
            Expires {formatDate(document.expires_at)}
          </Typography>
        </Stack>

        {(needsAgeReview || hasUpcomingExpiry) && (
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningAmberOutlined sx={{ fontSize: 18, color: "#b45309" }} />
            <Typography variant="caption" sx={{ color: "#92400e" }}>
              {needsAgeReview
                ? "This document is older than 60 days and may need a refresh."
                : "This document has an upcoming expiration date."}
            </Typography>
          </Stack>
        )}

        {document.rejection_reason && (
          <Typography variant="caption" sx={{ color: "#b91c1c" }}>
            Rejection reason: {document.rejection_reason}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
