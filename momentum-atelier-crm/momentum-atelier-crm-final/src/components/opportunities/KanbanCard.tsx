"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import type { Opportunity } from "@/types/database";
import { ArrowRight, ShieldAlert } from "lucide-react";

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
  const decisionMaker = opportunity.contacts
    ? `${opportunity.contacts.first_name} ${opportunity.contacts.last_name ?? ""}`.trim()
    : null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-grab active:cursor-grabbing rounded-xl border border-ink-900/[0.07] bg-parchment-50 p-4 shadow-panel hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300"
    >
      <p className="text-sm font-medium text-ink-950 leading-snug">{opportunity.name}</p>
      {opportunity.companies?.name && (
        <p className="text-xs text-ink-600 mt-0.5">{opportunity.companies.name}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="font-mono text-xs text-brass-600 font-medium">
          {formatCurrency(opportunity.value)}
        </span>
        {opportunity.probability !== null && (
          <span className="text-[11px] text-bronze-600 font-medium">
            {opportunity.probability}%
          </span>
        )}
      </div>

      {decisionMaker && (
        <p className="text-[11px] text-ink-500 mt-2 truncate">{decisionMaker}</p>
      )}

      {opportunity.next_step && (
        <p className="text-[11px] text-ink-700 mt-2 flex items-start gap-1">
          <ArrowRight size={11} className="mt-0.5 shrink-0 text-bronze-600" />
          <span className="line-clamp-1">{opportunity.next_step}</span>
        </p>
      )}

      {opportunity.competitors && (
        <p className="text-[11px] text-clay-600 mt-1.5 flex items-start gap-1">
          <ShieldAlert size={11} className="mt-0.5 shrink-0" />
          <span className="line-clamp-1">{opportunity.competitors}</span>
        </p>
      )}

      <div className="flex items-center justify-end mt-2">
        <span className="text-[11px] text-ink-500">
          {formatDate(opportunity.expected_close_date)}
        </span>
      </div>
    </div>
  );
}
