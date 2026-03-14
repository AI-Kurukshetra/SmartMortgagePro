"use client";

import { LinearProgress, Paper, Stack, Typography } from "@mui/material";

type PendingUpload = {
  id: string;
  fileName: string;
  progress: number;
  status: "uploading" | "processing" | "error";
  errorMessage?: string;
};

export function UploadProgress({ uploads }: { uploads: PendingUpload[] }) {
  if (!uploads.length) {
    return null;
  }

  return (
    <Stack spacing={1.5}>
      {uploads.map((upload) => (
        <Paper
          key={upload.id}
          elevation={0}
          sx={{
            border: "1px solid #dbeafe",
            borderRadius: 3,
            p: 1.5,
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                {upload.fileName}
              </Typography>
              <Typography variant="caption" sx={{ color: "#475569", textTransform: "capitalize" }}>
                {upload.status}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={upload.progress}
              color={upload.status === "error" ? "error" : "primary"}
              sx={{ height: 9, borderRadius: 999 }}
            />
            {upload.errorMessage && (
              <Typography variant="caption" sx={{ color: "#b91c1c" }}>
                {upload.errorMessage}
              </Typography>
            )}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
