"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conference } from "@/types/database";
import { DataTable } from "@/components/crud/DataTable";
import { RecordModal } from "@/components/crud/RecordModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ColumnConfig, FieldConfig } from "@/components/crud/types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, toDateInputValue } from "@/lib/utils";

const FIELDS: FieldConfig[] = [
  { name: "name", label: "Conference name", type: "text", required: true, colSpan: 2 },
  { name: "location", label: "Location", type: "text" },
  { name: "website", label: "Website", type: "url" },
  { name: "start_date", label: "Start date", type: "date" },
  { name: "end_date", label: "End date", type: "date" },
  { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
];

export default function ConferencesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Conference | null>(null);
  const [deleting, setDeleting] = useState<Conference | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("conferences").select("*").order("start_date", { ascending: true });
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.trim();
      query = query.or(`name.ilike.%${term}%,location.ilike.%${term}%`);
    }
    const { data, error } = await query;
    if (!error && data) setConferences(data as Conference[]);
    setLoading(false);
  }, [supabase, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnConfig<Conference>[] = [
    {
      key: "name",
      header: "Conference",
      render: (row) => (
        <div>
          <p className="font-medium text-ink-950">{row.name}</p>
          {row.website && (
            <a
              href={row.website.startsWith("http") ? row.website : `https://${row.website}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brass-600 hover:underline"
            >
              {row.website}
            </a>
          )}
        </div>
      ),
    },
    { key: "location", header: "Location", render: (row) => row.location ?? "—" },
    {
      key: "dates",
      header: "Dates",
      render: (row) =>
        row.start_date
          ? `${formatDate(row.start_date)}${row.end_date ? ` – ${formatDate(row.end_date)}` : ""}`
          : "—",
    },
  ];

  async function handleSubmit(values: Record<string, string | number | null>) {
    if (editing) {
      const { error } = await supabase.from("conferences").update(values).eq("id", editing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("conferences").insert(values);
      if (error) throw new Error(error.message);
    }
    setModalOpen(false);
    setEditing(null);
    await load();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("conferences").delete().eq("id", deleting.id);
    setDeleteLoading(false);
    if (!error) {
      setDeleting(null);
      await load();
    }
  }

  return (
    <div>
      <DataTable
        columns={columns}
        rows={conferences}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search conferences, locations…"
        addLabel="Add conference"
        onAdd={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        onEdit={(row) => {
          setEditing(row);
          setModalOpen(true);
        }}
        onDelete={(row) => setDeleting(row)}
        emptyMessage="No conferences yet."
      />

      {modalOpen && (
        <RecordModal
          title={editing ? "Edit conference" : "Add conference"}
          fields={FIELDS}
          initialValues={
            editing
              ? {
                  ...editing,
                  start_date: toDateInputValue(editing.start_date),
                  end_date: toDateInputValue(editing.end_date),
                }
              : {}
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
          title="Delete conference"
          message={`Delete "${deleting.name}"?`}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
