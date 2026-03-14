import Link from "next/link";
import { redirect } from "next/navigation";
import { Chip, Paper, Stack, Typography } from "@mui/material";
import { MessageSquareText } from "lucide-react";
import { countUnreadMessagesForUser, listCommunicationInbox } from "@/lib/services/messages";
import { createServerClient } from "@/lib/supabase/server";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [threads, unreadCount] = await Promise.all([
    listCommunicationInbox(user.id),
    countUnreadMessagesForUser(user.id),
  ]);

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(140deg, rgba(26,60,94,0.08) 0%, rgba(255,255,255,0.96) 55%, rgba(10,126,164,0.08) 100%)",
          p: { xs: 2.5, md: 3.5 },
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="overline" sx={{ color: "secondary.dark", letterSpacing: "0.16em", fontWeight: 700 }}>
            Communication Hub
          </Typography>
          <Typography variant="h4">Inbox</Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Review the latest borrower and team conversations across your active loan files.
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`${threads.length} active threads`} />
            <Chip color={unreadCount ? "secondary" : "default"} label={`${unreadCount} unread`} />
          </Stack>
        </Stack>
      </Paper>

      {threads.length ? (
        <Stack spacing={1.5}>
          {threads.map((thread) => (
            <Link key={thread.id} href={`/loans/${thread.loan.id}/messages`} className="block">
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: "divider",
                  p: 2.5,
                  transition: "border-color 150ms ease, transform 150ms ease",
                  "&:hover": {
                    borderColor: "secondary.main",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                  <Stack spacing={1} sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ color: "text.primary" }}>
                      {thread.subject || "Untitled conversation"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {thread.loan.borrower_name} · {thread.loan.property_address}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {thread.last_message_preview || "No message preview available yet."}
                    </Typography>
                  </Stack>

                  <Stack spacing={1} alignItems={{ xs: "flex-start", md: "flex-end" }}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip size="small" label={thread.thread_type.replace(/_/g, " ")} />
                      <Chip size="small" label={thread.loan.stage} />
                      <Chip
                        size="small"
                        label={formatMoney(thread.loan.loan_amount)}
                        sx={{ fontFamily: "var(--font-geist-mono), monospace" }}
                      />
                      {thread.unread_count ? (
                        <Chip size="small" color="secondary" label={`${thread.unread_count} unread`} />
                      ) : null}
                    </Stack>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {thread.last_sender_name
                        ? `Last update from ${thread.last_sender_name}`
                        : "No sender yet"}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Link>
          ))}
        </Stack>
      ) : (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px dashed",
            borderColor: "divider",
            px: 3,
            py: 8,
            textAlign: "center",
          }}
        >
          <MessageSquareText size={44} className="mx-auto text-slate-300" />
          <Typography variant="h6" sx={{ mt: 1.5 }}>
            No messages yet
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.75 }}>
            Open a loan file and start a document request, status update, or approval notice.
          </Typography>
        </Paper>
      )}
    </Stack>
  );
}
