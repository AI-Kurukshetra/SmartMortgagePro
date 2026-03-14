"use client";

import { CloudUploadRounded } from "@mui/icons-material";
import { Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { useDropzone } from "react-dropzone";

export function UploadZone({
  onFilesAccepted,
  progressByName,
}: {
  onFilesAccepted: (files: File[]) => void;
  progressByName: Record<string, number>;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/heic": [".heic"],
    },
    maxSize: 50 * 1024 * 1024,
    onDropAccepted: onFilesAccepted,
  });

  const uploads = Object.entries(progressByName);

  return (
    <Stack spacing={2}>
      <Paper
        {...getRootProps()}
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          border: isDragActive ? "2px solid #1565C0" : "2px dashed rgba(21,101,192,0.32)",
          bgcolor: isDragActive ? "rgba(21,101,192,0.06)" : "white",
          cursor: "pointer",
          transition: "all 200ms ease",
        }}
      >
        <input {...getInputProps({ "aria-label": "Upload mortgage documents" })} />
        <Stack spacing={1.25} alignItems="center" textAlign="center">
          <CloudUploadRounded sx={{ color: "#1565C0", fontSize: 42 }} />
          <Typography variant="h6">Drag and drop files into the vault</Typography>
          <Typography variant="body2" sx={{ color: "#64748B", maxWidth: 520 }}>
            Supports PDF, JPG, PNG, and HEIC up to 50MB. OCR classification and blockchain anchoring start automatically after upload.
          </Typography>
        </Stack>
      </Paper>

      {uploads.length ? (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
          <Stack spacing={1.25}>
            {uploads.map(([name, progress]) => (
              <Box key={name}>
                <Typography variant="caption" sx={{ color: "#0A1628" }}>
                  {name}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ mt: 0.75, height: 8, borderRadius: 999 }}
                />
              </Box>
            ))}
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  );
}
