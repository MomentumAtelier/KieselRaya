"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import type { Opportunity } from "@/types/database";

export type KanbanOpportunity = Opportunity & {
  companies: { name: string } | null;
  contacts: { first_name: string; last_name: string | null } | null;
};

export function KanbanCard({
  opportunity,
  onClick,
  onDragStart,
}: {
  opportunity: KanbanOpportunity;
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-grab active:cursor-grabbing rounded-sm2 border border-ink-900/10 bg-parchment-50 p-3 shadow-sm hover:shadow-panel transition-shadow"
    >
      <p className="text-sm font-medium text-ink-950 leading-snug">{opportunity.name}</p>
      {opportunity.companies?.name && (
        <p className="text-xs text-ink-600 mt-0.5">{opportunity.companies.name}</p>
      )}
      <div className="flex items-center justify-between mt-3">
        <span className="font-mono text-xs text-brass-600">
          {formatCurrency(opportunity.value)}
        </span>
        <span className="text-[11px] text-ink-500">
          {formatDate(opportunity.expected_close_date)}
        </span>
      </div>
    </div>
  );
}
