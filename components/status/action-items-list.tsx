import { Alert, AlertTitle, Button, Stack, Typography } from "@mui/material";
import type { BorrowerActionItem } from "@/lib/services/borrower-status";

const severityByTone = {
  critical: "error",
  attention: "warning",
  info: "info",
  success: "success",
} as const;

export function ActionItemsList({ items }: { items: BorrowerActionItem[] }) {
  return (
    <Stack data-testid="action-items" spacing={1.5}>
      {items.map((item) => (
        <Alert
          key={item.id}
          severity={severityByTone[item.tone]}
          sx={{ borderRadius: 3, alignItems: "flex-start" }}
          action={
            item.ctaHref && item.ctaLabel ? (
              <Button
                href={item.ctaHref}
                size="small"
                variant="text"
                sx={{ whiteSpace: "nowrap" }}
              >
                {item.ctaLabel}
              </Button>
            ) : undefined
          }
        >
          <AlertTitle sx={{ mb: 0.5 }}>{item.title}</AlertTitle>
          <Typography variant="body2">{item.description}</Typography>
        </Alert>
      ))}
    </Stack>
  );
}
