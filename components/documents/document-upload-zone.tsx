"use client";

import { CloudUploadOutlined } from "@mui/icons-material";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDocumentCategory } from "@/lib/documents/shared";
import type { DocCategory } from "@/types/database.types";

const categories: DocCategory[] = [
  "pay_stub",
  "w2",
  "bank_statement",
  "tax_return",
  "id_document",
  "employment_letter",
  "other",
];

type DocumentUploadZoneProps = {
  selectedCategory: DocCategory;
  onCategoryChange: (category: DocCategory) => void;
  onFilesSelected: (files: File[]) => void;
};

export function DocumentUploadZone({
  selectedCategory,
  onCategoryChange,
  onFilesSelected,
}: DocumentUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileList = (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    onFilesSelected(files);
  };

  return (
    <Paper
      elevation={0}
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
            Upload Documents
          </Typography>
          <Typography variant="body2" sx={{ color: "#475569", mt: 0.5 }}>
            PDF, JPG, and PNG files are supported, up to 50MB each.
          </Typography>
        </Box>

        <FormControl fullWidth size="small">
          <InputLabel id="document-category-label">Category</InputLabel>
          <Select
            labelId="document-category-label"
            label="Category"
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value as DocCategory)}
          >
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {formatDocumentCategory(category)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box
          data-testid="upload-dropzone"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            handleFileList(event.dataTransfer.files);
          }}
          sx={{
            border: "2px dashed",
            borderColor: isDragActive ? "#0284c7" : "#7dd3fc",
            bgcolor: isDragActive ? "#e0f2fe" : "#f8fdff",
            borderRadius: 4,
            px: 3,
            py: 5,
            textAlign: "center",
            transition: "all 150ms ease",
          }}
        >
          <Stack spacing={1.5} alignItems="center">
            <CloudUploadOutlined sx={{ fontSize: 38, color: "#0284c7" }} />
            <Typography variant="h6" sx={{ color: "#0f172a" }}>
              Drop files here
            </Typography>
            <Typography variant="body2" sx={{ color: "#475569", maxWidth: 420 }}>
              Drag and drop one or more files into this portal, or browse from your device.
            </Typography>
            <Button type="button" onClick={() => inputRef.current?.click()}>
              Browse Files
            </Button>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Selected category: {formatDocumentCategory(selectedCategory)}
            </Typography>
          </Stack>
        </Box>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          multiple
          hidden
          onChange={(event) => {
            handleFileList(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </Stack>
    </Paper>
  );
}
