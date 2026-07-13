"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Company, Contact, Conference, Opportunity, RelatedEntity, Task } from "@/types/database";
import { RecordModal } from "@/components/crud/RecordModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { FieldConfig } from "@/components/crud/types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, toDateInputValue } from "@/lib/utils";
import { Search, Plus, Pencil, Trash2, Check, AlertCircle, CalendarDays, Clock } from "lucide-react";

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

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-ink-900/10 text-ink-600",
  medium: "bg-bronze-400/25 text-bronze-600",
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

  async function toggleComplete(task: Task) {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    const { error } = await supabase.from("tasks").update({ status: nextStatus }).eq("id", task.id);
    if (error) await load();
  }

  const today = new Date().toISOString().slice(0, 10);
  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const overdue = activeTasks.filter((t) => t.due_date && t.due_date < today);
  const dueToday = activeTasks.filter((t) => t.due_date === today);
  const upcoming = activeTasks.filter((t) => !t.due_date || t.due_date > today);
  const completed = tasks.filter((t) => t.status === "completed");

  function TaskCard({ task }: { task: Task }) {
    const related =
      task.related_to_type !== "none" && task.related_to_id
        ? relatedLabels[`${task.related_to_type}:${task.related_to_id}`]
        : null;
    return (
      <div className="group panel panel-hover p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => toggleComplete(task)}
            className={`mt-0.5 h-5 w-5 rounded-full border shrink-0 flex items-center justify-center transition-colors ${
              task.status === "completed"
                ? "bg-emerald-600 border-emerald-600 text-parchment-50"
                : "border-ink-900/25 hover:border-brass-500"
            }`}
            aria-label="Toggle complete"
            type="button"
          >
            {task.status === "completed" && <Check size={12} />}
          </button>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium ${
                task.status === "completed" ? "text-ink-500 line-through" : "text-ink-950"
              }`}
            >
              {task.title}
            </p>
            {related && <p className="text-xs text-brass-600 mt-0.5">{related}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${PRIORITY_STYLES[task.priority]}`}>
                {PRIORITY_OPTIONS.find((p) => p.value === task.priority)?.label}
              </span>
              {task.due_date && <span className="text-xs text-ink-500">{formatDate(task.due_date)}</span>}
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex shrink-0 gap-1">
            <button
              onClick={() => {
                setEditing(task);
                setModalOpen(true);
              }}
              className="btn-ghost !p-1.5"
              aria-label="Edit"
              type="button"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => setDeleting(task)}
              className="btn-ghost !p-1.5 hover:!text-clay-600"
              aria-label="Delete"
              type="button"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  function TaskColumn({
    icon: Icon,
    title,
    items,
    accent,
  }: {
    icon: typeof AlertCircle;
    title: string;
    items: Task[];
    accent: string;
  }) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon size={15} className={accent} />
          <h2 className="font-display text-lg italic text-ink-950">{title}</h2>
          <span className="badge bg-ink-900/10 text-ink-700">{items.length}</span>
        </div>
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((t) => <TaskCard key={t.id} task={t} />)
          ) : (
            <p className="text-sm text-ink-500 px-1">Nothing here.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="panel p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search follow-ups…"
              className="field-input pl-8"
            />
          </div>
          <select
            className="field-select max-w-[180px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Active tasks</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="sm:ml-auto">
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="btn-accent w-full sm:w-auto"
            >
              <Plus size={15} />
              Add follow-up
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="panel p-10 text-center text-ink-500">Loading…</div>
      ) : statusFilter ? (
        <div className="space-y-3">
          {tasks.length > 0 ? (
            tasks.map((t) => <TaskCard key={t.id} task={t} />)
          ) : (
            <div className="panel p-10 text-center text-ink-500">No tasks match this filter.</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TaskColumn icon={AlertCircle} title="Overdue" items={overdue} accent="text-clay-600" />
          <TaskColumn icon={CalendarDays} title="Today" items={dueToday} accent="text-brass-600" />
          <TaskColumn icon={Clock} title="Upcoming" items={upcoming} accent="text-bronze-600" />
        </div>
      )}

      {!statusFilter && completed.length > 0 && (
        <p className="text-xs text-ink-500 mt-6">
          {completed.length} completed task{completed.length === 1 ? "" : "s"} hidden — filter by
          "Completed" above to view.
        </p>
      )}

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
