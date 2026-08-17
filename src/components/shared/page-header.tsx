import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">{eyebrow}</div> : null}
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-slate-50 md:text-3xl">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-400 md:text-[15px]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2" data-print-hidden="true">{actions}</div> : null}
    </div>
  );
}
