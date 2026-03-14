import { LoanCard } from "@/components/pipeline/loan-card";
import { cn } from "@/lib/utils";
import type { PipelineViewer } from "@/lib/pipeline";
import type { LoanRecord, LoanStage } from "@/types/database.types";

type PipelineColumnProps = {
  draggingLoanId?: string | null;
  isDropTarget?: boolean;
  label: string;
  loans: LoanRecord[];
  onDropStage: (stage: LoanStage) => void;
  onDragStart: (loan: LoanRecord) => void;
  stage: LoanStage;
  viewer: PipelineViewer;
};

export function PipelineColumn({
  draggingLoanId,
  isDropTarget,
  label,
  loans,
  onDropStage,
  onDragStart,
  stage,
  viewer,
}: PipelineColumnProps) {
  return (
    <section
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDropStage(stage)}
      className={cn(
        "min-h-[420px] rounded-[28px] border border-slate-200 bg-slate-100/80 p-4",
        isDropTarget && "border-sky-400 bg-sky-50",
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">{label}</h3>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{loans.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        {loans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-500">
            Drop a loan here to move it into {label.toLowerCase()}.
          </div>
        ) : (
          loans.map((loan) => (
            <LoanCard
              key={loan.id}
              draggable
              isDragging={draggingLoanId === loan.id}
              loan={loan}
              onDragStart={onDragStart}
              viewer={viewer}
            />
          ))
        )}
      </div>
    </section>
  );
}
