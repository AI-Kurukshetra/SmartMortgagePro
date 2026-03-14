import { NextResponse } from "next/server";
import { countUnreadMessagesForUser, listCommunicationInbox } from "@/lib/services/messages";
import { createServerClient } from "@/lib/supabase/server";

async function getAuthenticatedUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const [threads, unreadCount] = await Promise.all([
      listCommunicationInbox(user.id),
      countUnreadMessagesForUser(user.id),
    ]);

    return NextResponse.json(
      {
        ok: true,
        threads,
        unreadCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/communications failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load communications inbox.",
      },
      { status: 500 },
    );
  }
}
