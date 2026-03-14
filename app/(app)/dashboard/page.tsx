import { redirect } from "next/navigation";
import { getAuthenticatedViewer } from "@/lib/auth/session";
import { PipelinePage } from "@/components/pipeline/pipeline-page";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const viewer = await getAuthenticatedViewer();
  if (viewer?.role === "borrower") {
    redirect("/my-loans");
  }

  return <PipelinePage />;
}
