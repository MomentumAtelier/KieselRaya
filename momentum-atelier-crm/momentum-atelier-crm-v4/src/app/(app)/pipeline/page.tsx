"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Company, Contact } from "@/types/database";
import { OPPORTUNITY_STAGES, type OpportunityStage } from "@/types/database";
import { KanbanBoard } from "@/components/opportunities/KanbanBoard";
import type { KanbanOpportunity } from "@/components/opportunities/KanbanCard";
import { RecordModal } from "@/components/crud/RecordModal";
import type { FieldConfig } from "@/components/crud/types";
import { toDateInputValue } from "@/lib/utils";
import { ListFilter } from "lucide-react";

export default function PipelinePage() {
  const supabase = useMemo(() => createClient(), []);
  const [opportunities, setOpportunities] = useState<KanbanOpportunity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KanbanOpportunity | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: opps }, { data: c }, { data: ct }] = await Promise.all([
      supabase
        .from("opportunities")
        .select("*, companies(name), contacts(first_name, last_name)")
        .neq("stage", "lost")
        .order("created_at", { ascending: false }),
      supabase.from("companies").select("*").order("name"),
      supabase.from("contacts").select("*").order("first_name"),
    ]);
    if (opps) setOpportunities(opps as unknown as KanbanOpportunity[]);
    if (c) setCompanies(c as Company[]);
    if (ct) setContacts(ct as Contact[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStageChange(id: string, stage: OpportunityStage) {
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, stage } : o)));
    const { error } = await supabase.from("opportunities").update({ stage }).eq("id", id);
    if (error) await load();
  }

  const fields: FieldConfig[] = [
    { name: "name", label: "Opportunity name", type: "text", required: true, colSpan: 2 },
    {
      name: "company_id",
      label: "Company",
      type: "select",
      options: companies.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      name: "contact_id",
      label: "Primary contact",
      type: "select",
      options: contacts.map((c) => ({
        value: c.id,
        label: `${c.first_name} ${c.last_name ?? ""}`.trim(),
      })),
    },
    {
      name: "stage",
      label: "Stage",
      type: "select",
      required: true,
      options: OPPORTUNITY_STAGES.map((s) => ({ value: s.value, label: s.label })),
    },
    { name: "value", label: "Value (USD)", type: "number", step: "0.01" },
    { name: "probability", label: "Probability (%)", type: "number" },
    { name: "expected_close_date", label: "Expected close date", type: "date" },
    { name: "next_step", label: "Next step", type: "text", colSpan: 2 },
    { name: "competitors", label: "Competitors", type: "text" },
    { name: "products", label: "Products / services", type: "text" },
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
  ];

  async function handleSubmit(values: Record<string, string | number | null>) {
    if (editing) {
      const { error } = await supabase.from("opportunities").update(values).eq("id", editing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("opportunities").insert(values);
      if (error) throw new Error(error.message);
    }
    setModalOpen(false);
    setEditing(null);
    await load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-ink-600">
          Drag cards between stages to update them instantly. Lost opportunities are hidden here —
          manage them from the{" "}
          <Link href="/opportunities" className="text-brass-600 hover:underline">
            list view
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <Link href="/opportunities" className="btn-secondary">
            <ListFilter size={15} />
            List view
          </Link>
          <button
            className="btn-accent"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Add opportunity
          </button>
        </div>
      </div>

      {loading ? (
        <div className="panel p-10 text-center text-ink-500">Loading pipeline…</div>
      ) : (
        <KanbanBoard
          opportunities={opportunities}
          onCardClick={(opp) => {
            setEditing(opp);
            setModalOpen(true);
          }}
          onStageChange={handleStageChange}
        />
      )}

      {modalOpen && (
        <RecordModal
          title={editing ? "Edit opportunity" : "Add opportunity"}
          fields={fields}
          initialValues={
            editing
              ? { ...editing, expected_close_date: toDateInputValue(editing.expected_close_date) }
              : { stage: "lead", probability: 10 }
          }
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
