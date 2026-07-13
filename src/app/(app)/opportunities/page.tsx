"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Company, Contact, Opportunity } from "@/types/database";
import { OPPORTUNITY_STAGES } from "@/types/database";
import { DataTable } from "@/components/crud/DataTable";
import { RecordModal } from "@/components/crud/RecordModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ColumnConfig, FieldConfig } from "@/components/crud/types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency, formatDate, toDateInputValue } from "@/lib/utils";
import { KanbanSquare } from "lucide-react";

type OppRow = Opportunity & {
  companies: { name: string } | null;
  contacts: { first_name: string; last_name: string | null } | null;
};

const STAGE_STYLES: Record<string, string> = {
  lead: "bg-ink-900/10 text-ink-700",
  qualified: "bg-brass-400/25 text-brass-600",
  proposal: "bg-brass-500/25 text-brass-600",
  negotiation: "bg-clay-500/20 text-clay-600",
  won: "bg-emerald-600/15 text-emerald-700",
  lost: "bg-ink-900/10 text-ink-500 line-through",
};

export default function OpportunitiesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [opportunities, setOpportunities] = useState<OppRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [stageFilter, setStageFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OppRow | null>(null);
  const [deleting, setDeleting] = useState<OppRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadLookups = useCallback(async () => {
    const [{ data: c }, { data: ct }] = await Promise.all([
      supabase.from("companies").select("*").order("name"),
      supabase.from("contacts").select("*").order("first_name"),
    ]);
    if (c) setCompanies(c as Company[]);
    if (ct) setContacts(ct as Contact[]);
  }, [supabase]);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("opportunities")
      .select("*, companies(name), contacts(first_name, last_name)")
      .order("created_at", { ascending: false });

    if (debouncedSearch.trim()) {
      query = query.ilike("name", `%${debouncedSearch.trim()}%`);
    }
    if (stageFilter) {
      query = query.eq("stage", stageFilter);
    }
    const { data, error } = await query;
    if (!error && data) setOpportunities(data as unknown as OppRow[]);
    setLoading(false);
  }, [supabase, debouncedSearch, stageFilter]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    load();
  }, [load]);

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
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
  ];

  const columns: ColumnConfig<OppRow>[] = [
    { key: "name", header: "Opportunity", render: (row) => <p className="font-medium text-ink-950">{row.name}</p> },
    { key: "company", header: "Company", render: (row) => row.companies?.name ?? "—" },
    {
      key: "contact",
      header: "Contact",
      render: (row) =>
        row.contacts ? `${row.contacts.first_name} ${row.contacts.last_name ?? ""}` : "—",
    },
    {
      key: "stage",
      header: "Stage",
      render: (row) => (
        <span className={`badge ${STAGE_STYLES[row.stage]}`}>
          {OPPORTUNITY_STAGES.find((s) => s.value === row.stage)?.label ?? row.stage}
        </span>
      ),
    },
    { key: "value", header: "Value", render: (row) => formatCurrency(row.value) },
    {
      key: "close",
      header: "Expected close",
      render: (row) => formatDate(row.expected_close_date),
    },
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

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("opportunities").delete().eq("id", deleting.id);
    setDeleteLoading(false);
    if (!error) {
      setDeleting(null);
      await load();
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Link href="/pipeline" className="btn-secondary">
          <KanbanSquare size={15} />
          View as pipeline
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={opportunities}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search opportunities…"
        addLabel="Add opportunity"
        onAdd={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        onEdit={(row) => {
          setEditing(row);
          setModalOpen(true);
        }}
        onDelete={(row) => setDeleting(row)}
        emptyMessage="No opportunities yet."
        filterSlot={
          <select
            className="field-select max-w-[180px]"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="">All stages</option>
            {OPPORTUNITY_STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        }
      />

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

      {deleting && (
        <ConfirmDialog
          title="Delete opportunity"
          message={`Delete "${deleting.name}"?`}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
