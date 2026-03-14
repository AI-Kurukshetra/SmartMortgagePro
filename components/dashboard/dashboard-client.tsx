"use client";

import { Alert } from "@mui/material";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { CreateLoanModal } from "@/components/pipeline/create-loan-modal";
import { PipelineFilters } from "@/components/pipeline/pipeline-filters";
import { PipelineKanban } from "@/components/pipeline/pipeline-kanban";
import { PipelineStats } from "@/components/pipeline/pipeline-stats";
import { Button } from "@/components/ui/button";
import { usePipeline } from "@/hooks/use-pipeline";
import type { PipelineViewer } from "@/lib/pipeline";
import type { LoanRecord, LoanStage } from "@/types/database.types";

type DashboardClientProps = {
  initialLoans: LoanRecord[];
  bootstrapError?: string;
  viewer?: PipelineViewer;
};

export function DashboardClient({
  initialLoans,
  bootstrapError,
  viewer = {},
}: DashboardClientProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdating, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const {
    canViewTeam,
    closeDateFilter,
    columns,
    loanOfficerFilter,
    searchTerm,
    setCloseDateFilter,
    setLoanOfficerFilter,
    setSearchTerm,
    setStageFilter,
    stageFilter,
    stats,
  } = usePipeline({
    loans: initialLoans,
    viewer,
  });

  const handleMoveLoan = async (loanId: string, stage: LoanStage) => {
    setErrorMessage(null);

    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/pipeline/${loanId}/stage`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ stage }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        if (!response.ok) {
          const msg = payload?.error ?? "Could not update the loan stage.";
          setErrorMessage(msg);
          toast.error(msg);
          return;
        }

        toast.success("Loan stage updated.");
        router.refresh();
      })();
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_100%)] p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Operations Hub
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">Loan pipeline and documents</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Move files through the pipeline, monitor urgency, and open each loan&apos;s document portal directly from the kanban cards.
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="shrink-0">
            <Plus className="size-4 mr-1" /> New loan
          </Button>
        </div>
      </div>

      {showCreateModal && (
        <CreateLoanModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            router.refresh();
          }}
        />
      )}

      {bootstrapError ? <Alert severity="warning">{bootstrapError}</Alert> : null}
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

      <PipelineStats {...stats} />

      <PipelineFilters
        canViewTeam={canViewTeam}
        closeDateFilter={closeDateFilter}
        loanOfficerFilter={loanOfficerFilter}
        onCloseDateFilterChange={setCloseDateFilter}
        onLoanOfficerFilterChange={setLoanOfficerFilter}
        onSearchTermChange={setSearchTerm}
        onStageFilterChange={setStageFilter}
        searchTerm={searchTerm}
        stageFilter={stageFilter}
      />

      <PipelineKanban
        columns={columns}
        isUpdating={isUpdating}
        onMoveLoan={handleMoveLoan}
        viewer={viewer}
      />
    </div>
  );
}
