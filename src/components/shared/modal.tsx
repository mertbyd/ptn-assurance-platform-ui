"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@chakra-ui/react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: "md" | "lg" | "xl";
}

export function Modal({ open, title, description, children, footer, onClose, size = "lg" }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 md:items-center md:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-700 bg-slate-900 shadow-[0_30px_120px_rgba(0,0,0,0.55)] md:rounded-3xl",
          size === "md" && "max-w-2xl",
          size === "lg" && "max-w-4xl",
          size === "xl" && "max-w-6xl",
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-700/70 px-5 py-4 md:px-6 md:py-5">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold tracking-[-0.02em] text-slate-100 md:text-xl">
              {title}
            </h2>
            {description ? <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-400">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon" aria-label="Pencereyi kapat" onClick={onClose}>
            <X />
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">{children}</div>
        {footer ? <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-700/70 bg-slate-950/30 px-5 py-4 md:px-6">{footer}</footer> : null}
      </section>
    </div>
  );
}
