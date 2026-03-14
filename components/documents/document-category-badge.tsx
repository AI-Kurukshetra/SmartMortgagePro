"use client";

import { Chip } from "@mui/material";
import { formatDocumentCategory } from "@/lib/documents/shared";
import type { DocCategory } from "@/types/database.types";

export function DocumentCategoryBadge({ category }: { category: DocCategory }) {
  return (
    <Chip
      size="small"
      label={formatDocumentCategory(category)}
      sx={{
        bgcolor: "#e0f2fe",
        color: "#075985",
        fontWeight: 600,
      }}
    />
  );
}
