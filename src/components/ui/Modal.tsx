"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-ink-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${
          wide ? "max-w-2xl" : "max-w-md"
        } my-8 panel p-6 animate-in`}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl italic text-ink-950">{title}</h2>
          <button
            onClick={onClose}
            className="btn-ghost !p-1.5 -mr-1.5"
            aria-label="Close"
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
