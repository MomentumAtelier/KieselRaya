"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Company, Contact, Conference, Opportunity, RelatedEntity, Task } from "@/types/database";
import { DataTable } from "@/components/crud/DataTable";
import { RecordModal } from "@/components/crud/RecordModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ColumnConfig, FieldConfig } from "@/components/crud/types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, toDateInputValue } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-ink-900/10 text-ink-700",
  in_progress: "bg-brass-400/25 text-brass-600",
  completed: "bg-emerald-600/15 text-emerald-700",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-ink-900/10 text-ink-600",
  medium: "bg-brass-400/25 text-brass-600",
  high: "bg-clay-500/20 text-clay-600",
};

export default function TasksPage() {
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [relatedLabels, setRelatedLabels] = useState<Record<string, string>>({});
  const [relatedOptions, setRelatedOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadRelated = useCallback(async () => {
    const [{ data: companies }, { data: contacts }, { data: opportunities }, { data: conferences }] =
      await Promise.all([
        supabase.from("companies").select("id,name"),
        supabase.from("contacts").select("id,first_name,last_name"),
        supabase.from("opportunities").select("id,name"),
        supabase.from("conferences").select("id,name"),
      ]);

    const labels: Record<string, string> = {};
    const options: { value: string; label: string }[] = [{ value: "none:none", label: "None" }];

    (companies as Company[] | null)?.forEach((c) => {
      labels[`company:${c.id}`] = c.name;
      options.push({ value: `company:${c.id}`, label: `Company — ${c.name}` });
    });
    (contacts as Contact[] | null)?.forEach((c) => {
      const name = `${c.first_name} ${c.last_name ?? ""}`.trim();
      labels[`contact:${c.id}`] = name;
      options.push({ value: `contact:${c.id}`, label: `Contact — ${name}` });
    });
    (opportunities as Opportunity[] | null)?.forEach((o) => {
      labels[`opportunity:${o.id}`] = o.name;
      options.push({ value: `opportunity:${o.id}`, label: `Opportunity — ${o.name}` });
    });
    (conferences as Conference[] | null)?.forEach((c) => {
      labels[`conference:${c.id}`] = c.name;
      options.push({ value: `conference:${c.id}`, label: `Conference — ${c.name}` });
    });

    setRelatedLabels(labels);
    setRelatedOptions(options);
  }, [supabase]);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("tasks").select("*").order("due_date", { ascending: true });
    if (debouncedSearch.trim()) {
      query = query.ilike("title", `%${debouncedSearch.trim()}%`);
    }
    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }
    const { data, error } = await query;
    if (!error && data) setTasks(data as Task[]);
    setLoading(false);
  }, [supabase, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadRelated();
  }, [loadRelated]);

  useEffect(() => {
    load();
  }, [load]);

  const fields: FieldConfig[] = [
    { name: "title", label: "Task", type: "text", required: true, colSpan: 2 },
    { name: "due_date", label: "Due date", type: "date" },
    { name: "status", label: "Status", type: "select", required: true, options: STATUS_OPTIONS },
    {
      name: "priority",
      label: "Priority",
      type: "select",
      required: true,
      options: PRIORITY_OPTIONS,
    },
    { name: "related_to", label: "Related to", type: "select", options: relatedOptions },
    { name: "description", label: "Notes", type: "textarea", colSpan: 2 },
  ];

  const columns: ColumnConfig<Task>[] = [
    {
      key: "title",
      header: "Task",
      render: (row) => (
        <div>
          <p className="font-medium text-ink-950">{row.title}</p>
          {row.related_to_type !== "none" && row.related_to_id && (
            <p className="text-xs text-ink-500">
              {relatedLabels[`${row.related_to_type}:${row.related_to_id}`] ?? ""}
            </p>
          )}
        </div>
      ),
    },
    { key: "due", header: "Due", render: (row) => formatDate(row.due_date) },
    {
      key: "priority",
      header: "Priority",
      render: (row) => (
        <span className={`badge ${PRIORITY_STYLES[row.priority]}`}>
          {PRIORITY_OPTIONS.find((p) => p.value === row.priority)?.label}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span className={`badge ${STATUS_STYLES[row.status]}`}>
          {STATUS_OPTIONS.find((s) => s.value === row.status)?.label}
        </span>
      ),
    },
  ];

  function toPayload(values: Record<string, string | number | null>) {
    const related = String(values.related_to ?? "none:none");
    const [related_to_type, related_to_id] = related.split(":") as [RelatedEntity, string];
    const { related_to, ...rest } = values;
    void related_to;
    return {
      ...rest,
      related_to_type,
      related_to_id: related_to_type === "none" ? null : related_to_id,
    };
  }

  async function handleSubmit(values: Record<string, string | number | null>) {
    const payload = toPayload(values);
    if (editing) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", editing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("tasks").insert(payload);
      if (error) throw new Error(error.message);
    }
    setModalOpen(false);
    setEditing(null);
    await load();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("tasks").delete().eq("id", deleting.id);
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
        rows={tasks}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search follow-ups…"
        addLabel="Add follow-up"
        onAdd={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        onEdit={(row) => {
          setEditing(row);
          setModalOpen(true);
        }}
        onDelete={(row) => setDeleting(row)}
        emptyMessage="No follow-up tasks yet."
        filterSlot={
          <select
            className="field-select max-w-[160px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        }
      />

      {modalOpen && (
        <RecordModal
          title={editing ? "Edit follow-up" : "Add follow-up"}
          fields={fields}
          initialValues={
            editing
              ? {
                  ...editing,
                  due_date: toDateInputValue(editing.due_date),
                  related_to:
                    editing.related_to_type !== "none" && editing.related_to_id
                      ? `${editing.related_to_type}:${editing.related_to_id}`
                      : "none:none",
                }
              : { status: "pending", priority: "medium", related_to: "none:none" }
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
          title="Delete follow-up"
          message={`Delete "${deleting.title}"?`}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
