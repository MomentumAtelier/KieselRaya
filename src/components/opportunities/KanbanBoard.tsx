"use client";

import { useState } from "react";
import { OPPORTUNITY_STAGES, type OpportunityStage } from "@/types/database";
import { KanbanCard, type KanbanOpportunity } from "./KanbanCard";
import { formatCurrency } from "@/lib/utils";

export function KanbanBoard({
  opportunities,
  onCardClick,
  onStageChange,
}: {
  opportunities: KanbanOpportunity[];
  onCardClick: (opportunity: KanbanOpportunity) => void;
  onStageChange: (id: string, stage: OpportunityStage) => void;
}) {
  const [dragOverStage, setDragOverStage] = useState<OpportunityStage | null>(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {OPPORTUNITY_STAGES.map((stage) => {
        const stageOpps = opportunities.filter((o) => o.stage === stage.value);
        const total = stageOpps.reduce((sum, o) => sum + (o.value ?? 0), 0);

        return (
          <div
            key={stage.value}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage.value);
            }}
            onDragLeave={() => setDragOverStage((s) => (s === stage.value ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/opportunity-id");
              if (id) onStageChange(id, stage.value);
              setDragOverStage(null);
            }}
            className={`w-72 shrink-0 rounded-sm2 border transition-colors ${
              dragOverStage === stage.value
                ? "border-brass-500 bg-brass-400/10"
                : "border-ink-900/10 bg-ink-900/[0.02]"
            }`}
          >
            <div className="px-3 py-3 border-b border-ink-900/10">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-950">{stage.label}</p>
                <span className="badge bg-ink-900/10 text-ink-700">{stageOpps.length}</span>
              </div>
              <p className="font-mono text-xs text-ink-500 mt-0.5">{formatCurrency(total)}</p>
            </div>

            <div className="p-2.5 space-y-2.5 min-h-[120px] max-h-[65vh] overflow-y-auto">
              {stageOpps.map((opp) => (
                <KanbanCard
                  key={opp.id}
                  opportunity={opp}
                  onClick={() => onCardClick(opp)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/opportunity-id", opp.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                />
              ))}
              {stageOpps.length === 0 && (
                <p className="text-xs text-ink-500 text-center py-6">Drop here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
