"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import { Button } from "@/components/ui/button";
import type { MessageTemplateDraft } from "@/lib/messages/templates";
import { messageTemplateDefinitions } from "@/lib/messages/templates";
import type { DocCategory } from "@/types/database.types";

export function MessageTemplates({
  category,
  onApplyTemplate,
}: {
  category?: DocCategory;
  onApplyTemplate: (draft: MessageTemplateDraft) => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 4,
        p: 2.5,
      }}
    >
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h6" sx={{ color: "text.primary" }}>
            Message templates
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Launch a standard communication, then edit before sending.
          </Typography>
        </Box>

        {messageTemplateDefinitions.map((template) => (
          <Stack
            key={template.label}
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{
              borderRadius: 3,
              bgcolor: "#f8fafc",
              px: 1.5,
              py: 1.25,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                {template.label}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {template.description}
              </Typography>
            </Box>

              <Button
                type="button"
                variant="secondary"
                onClick={() => onApplyTemplate(template.createDraft(category))}
              >
              Use template
            </Button>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
