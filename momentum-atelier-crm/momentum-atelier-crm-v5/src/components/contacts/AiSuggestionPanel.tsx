"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export function AiSuggestionPanel({ contactId }: { contactId: string }) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/suggest-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }
      setSuggestion(data.suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-bronze-500/25 bg-gradient-to-br from-bronze-400/[0.06] to-transparent p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={15} className="text-bronze-600" />
        <p className="text-xs font-medium uppercase tracking-wide text-bronze-600">
          Suggested next move
        </p>
      </div>

      {suggestion ? (
        <p className="text-sm text-ink-800 leading-relaxed">{suggestion}</p>
      ) : error ? (
        <p className="text-sm text-clay-600">{error}</p>
      ) : (
        <p className="text-sm text-ink-500">
          Generate a suggested next action and conversation starter based on this contact's
          profile and recent activity.
        </p>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn-bronze mt-4 text-xs !py-1.5"
        type="button"
      >
        {loading ? "Thinking…" : suggestion ? "Regenerate" : "Generate suggestion"}
      </button>
    </div>
  );
}
