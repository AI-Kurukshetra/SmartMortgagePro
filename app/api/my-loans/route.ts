import { NextResponse } from "next/server";
import { getAuthenticatedViewer } from "@/lib/auth/session";
import { listBorrowerLoans } from "@/lib/services/borrower-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (viewer.role && viewer.role !== "borrower") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const loans = await listBorrowerLoans(viewer.userId);
    return NextResponse.json({ ok: true, loans }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Borrower loans could not be loaded.",
      },
      { status: 500 },
    );
  }
}
