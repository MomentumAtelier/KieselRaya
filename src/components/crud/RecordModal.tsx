"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import type { FieldConfig } from "./types";

export function RecordModal({
  title,
  fields,
  initialValues,
  onClose,
  onSubmit,
  submitLabel = "Save",
}: {
  title: string;
  fields: FieldConfig[];
  initialValues: Record<string, string | number | null | undefined>;
  onClose: () => void;
  onSubmit: (values: Record<string, string | number | null>) => Promise<void>;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      const v = initialValues[field.name];
      initial[field.name] = v === null || v === undefined ? "" : String(v);
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, string | number | null> = {};
      for (const field of fields) {
        const raw = values[field.name] ?? "";
        if (field.type === "number") {
          payload[field.name] = raw === "" ? null : Number(raw);
        } else {
          payload[field.name] = raw === "" ? null : raw;
        }
      }
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  }

  return (
    <Modal title={title} onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.name} className={field.colSpan === 2 ? "sm:col-span-2" : ""}>
              <label className="field-label" htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-clay-600"> *</span>}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  id={field.name}
                  className="field-input min-h-[88px] resize-y"
                  required={field.required}
                  placeholder={field.placeholder}
                  value={values[field.name] ?? ""}
                  onChange={(e) => setField(field.name, e.target.value)}
                />
              ) : field.type === "select" ? (
                <select
                  id={field.name}
                  className="field-select"
                  required={field.required}
                  value={values[field.name] ?? ""}
                  onChange={(e) => setField(field.name, e.target.value)}
                >
                  <option value="">{field.placeholder ?? "Select…"}</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={field.name}
                  type={field.type}
                  step={field.step}
                  className="field-input"
                  required={field.required}
                  placeholder={field.placeholder}
                  value={values[field.name] ?? ""}
                  onChange={(e) => setField(field.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-4 text-sm text-clay-600 bg-clay-500/10 border border-clay-500/30 rounded-sm2 px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-accent" disabled={submitting}>
            {submitting ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
