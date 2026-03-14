"use client";

import {
  DeleteOutlineRounded,
  DownloadRounded,
  HistoryRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { differenceInDays } from "date-fns";
import { useState } from "react";
import { HashBadge } from "@/src/components/blockchain/hash-badge";
import { VersionHistoryDrawer } from "@/src/components/documents/version-history-drawer";
import type { Document } from "@/src/types/smart-mortgage";

export function DocumentCard({
  document,
  listView = false,
  onView,
  onDownload,
  onDelete,
  onReplace,
  onVerify,
}: {
  document: Document;
  listView?: boolean;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onReplace: (file: File) => void;
  onVerify: () => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isExpired = differenceInDays(new Date(), new Date(document.uploadedAt)) > 60;

  return (
    <>
      <Card
        elevation={0}
        sx={{
          display: listView ? "flex" : "block",
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: 4,
        }}
      >
        {document.previewUrl ? (
          <CardMedia
            component="img"
            image={document.previewUrl}
            alt={document.fileName}
            sx={{ width: listView ? 180 : "100%", height: listView ? "auto" : 180, objectFit: "cover" }}
          />
        ) : (
          <Box
            sx={{
              minHeight: 160,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(10,22,40,0.04)",
              color: "#0A1628",
              fontWeight: 700,
            }}
          >
            PDF
          </Box>
        )}

        <CardContent sx={{ flex: 1 }}>
          <Stack spacing={1.25}>
            <Stack direction="row" justifyContent="space-between" spacing={1.5}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {document.fileName}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748B" }}>
                  Uploaded {new Date(document.uploadedAt).toLocaleDateString()} • v{document.version}
                </Typography>
              </Box>
              <HashBadge anchor={document.blockchain} status={document.blockchainStatus} />
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={document.category} />
              <Chip label={`${document.confidence}% confidence`} color={document.confidence < 75 ? "warning" : "success"} />
              {isExpired ? <Chip label="Older than 60 days" color="warning" /> : null}
              {document.fraudSignal.detected ? <Chip label={document.fraudSignal.label} color="error" /> : null}
            </Stack>

            {document.confidence < 75 ? (
              <Alert severity="warning">Low OCR confidence. Manual review and category override may be required.</Alert>
            ) : null}

            <Typography variant="body2" sx={{ color: "#475569" }}>
              {document.extractedFields.join(" | ")}
            </Typography>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Button startIcon={<VisibilityRounded />} onClick={onView}>
                View
              </Button>
              <Button startIcon={<DownloadRounded />} onClick={onDownload}>
                Download
              </Button>
              <Button component="label">
                Replace
                <input
                  hidden
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.heic"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onReplace(file);
                  }}
                />
              </Button>
              <Button startIcon={<DeleteOutlineRounded />} color="error" onClick={onDelete}>
                Delete
              </Button>
              <Button startIcon={<HistoryRounded />} onClick={() => setDrawerOpen(true)}>
                Versions
              </Button>
              <Button variant="outlined" onClick={onVerify}>
                Verify Integrity
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <VersionHistoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        versions={document.versions}
      />
    </>
  );
}
