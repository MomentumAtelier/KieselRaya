"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Company, Contact } from "@/types/database";
import { DataTable } from "@/components/crud/DataTable";
import { RecordModal } from "@/components/crud/RecordModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ColumnConfig, FieldConfig } from "@/components/crud/types";
import { useDebounce } from "@/hooks/useDebounce";

type ContactRow = Contact & { companies: { name: string } | null };

export default function ContactsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [companyFilter, setCompanyFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContactRow | null>(null);
  const [deleting, setDeleting] = useState<ContactRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadCompanies = useCallback(async () => {
    const { data } = await supabase.from("companies").select("*").order("name");
    if (data) setCompanies(data as Company[]);
  }, [supabase]);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("contacts")
      .select("*, companies(name)")
      .order("created_at", { ascending: false });

    if (debouncedSearch.trim()) {
      const term = debouncedSearch.trim();
      query = query.or(
        `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,title.ilike.%${term}%`
      );
    }
    if (companyFilter) {
      query = query.eq("company_id", companyFilter);
    }
    const { data, error } = await query;
    if (!error && data) setContacts(data as unknown as ContactRow[]);
    setLoading(false);
  }, [supabase, debouncedSearch, companyFilter]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    load();
  }, [load]);

  const fields: FieldConfig[] = [
    { name: "first_name", label: "First name", type: "text", required: true },
    { name: "last_name", label: "Last name", type: "text" },
    { name: "title", label: "Job title", type: "text" },
    {
      name: "company_id",
      label: "Company",
      type: "select",
      options: companies.map((c) => ({ value: c.id, label: c.name })),
      placeholder: "No company",
    },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
  ];

  const columns: ColumnConfig<ContactRow>[] = [
    {
      key: "name",
      header: "Contact",
      render: (row) => (
        <div>
          <p className="font-medium text-ink-950">
            {row.first_name} {row.last_name ?? ""}
          </p>
          {row.title && <p className="text-xs text-ink-500">{row.title}</p>}
        </div>
      ),
    },
    { key: "company", header: "Company", render: (row) => row.companies?.name ?? "—" },
    { key: "email", header: "Email", render: (row) => row.email ?? "—" },
    { key: "phone", header: "Phone", render: (row) => row.phone ?? "—" },
  ];

  async function handleSubmit(values: Record<string, string | number | null>) {
    if (editing) {
      const { error } = await supabase.from("contacts").update(values).eq("id", editing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("contacts").insert(values);
      if (error) throw new Error(error.message);
    }
    setModalOpen(false);
    setEditing(null);
    await load();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("contacts").delete().eq("id", deleting.id);
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
        rows={contacts}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search contacts, email, title…"
        addLabel="Add contact"
        onAdd={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        onEdit={(row) => {
          setEditing(row);
          setModalOpen(true);
        }}
        onDelete={(row) => setDeleting(row)}
        emptyMessage="No contacts yet. Add your first contact."
        filterSlot={
          <select
            className="field-select max-w-[200px]"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        }
      />

      {modalOpen && (
        <RecordModal
          title={editing ? "Edit contact" : "Add contact"}
          fields={fields}
          initialValues={editing ?? {}}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete contact"
          message={`Delete "${deleting.first_name} ${deleting.last_name ?? ""}"?`}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
