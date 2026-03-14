"use client";

import { useState } from "react";
import { ArrowRightLeft, X } from "lucide-react";
import { pipelineStageLabels, type PipelineViewer } from "@/lib/pipeline";
import { Button } from "@/components/ui/button";
import { PipelineColumn } from "@/components/pipeline/pipeline-column";
import type { LoanRecord, LoanStage } from "@/types/database.types";

type PipelineKanbanProps = {
  columns: Array<{
    label: string;
    loans: LoanRecord[];
    stage: LoanStage;
  }>;
  isUpdating: boolean;
  onMoveLoan: (loanId: string, stage: LoanStage) => Promise<void>;
  viewer: PipelineViewer;
};

type PendingStageChange = {
  loan: LoanRecord;
  nextStage: LoanStage;
} | null;

export function PipelineKanban({
  columns,
  isUpdating,
  onMoveLoan,
  viewer,
}: PipelineKanbanProps) {
  const [draggingLoan, setDraggingLoan] = useState<LoanRecord | null>(null);
  const [pendingStageChange, setPendingStageChange] = useState<PendingStageChange>(null);
  const [dropStage, setDropStage] = useState<LoanStage | null>(null);

  const handleStageDrop = (stage: LoanStage) => {
    if (!draggingLoan || draggingLoan.stage === stage) {
      setDropStage(null);
      return;
    }

    setPendingStageChange({
      loan: draggingLoan,
      nextStage: stage,
    });
    setDropStage(stage);
  };

  const closeModal = () => {
    setDraggingLoan(null);
    setDropStage(null);
    setPendingStageChange(null);
  };

  return (
    <>
      <div
        data-testid="pipeline-kanban"
        className="grid gap-4 xl:grid-cols-5"
        onDragEnd={() => setDropStage(null)}
      >
        {columns.map((column) => (
          <PipelineColumn
            key={column.stage}
            draggingLoanId={draggingLoan?.id}
            isDropTarget={dropStage === column.stage}
            label={column.label}
            loans={column.loans}
            onDragStart={(loan) => setDraggingLoan(loan)}
            onDropStage={handleStageDrop}
            stage={column.stage}
            viewer={viewer}
          />
        ))}
      </div>

      {pendingStageChange ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                  Confirm transition
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                  {pendingStageChange.loan.borrower_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
              <span>{pipelineStageLabels[pendingStageChange.loan.stage]}</span>
              <ArrowRightLeft className="size-4 text-slate-400" />
              <span>{pipelineStageLabels[pendingStageChange.nextStage]}</span>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Moving this loan updates the active pipeline stage for the team.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                disabled={isUpdating}
                onClick={async () => {
                  await onMoveLoan(pendingStageChange.loan.id, pendingStageChange.nextStage);
                  closeModal();
                }}
              >
                {isUpdating ? "Updating..." : "Move loan"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
