import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  valor: string;
  indicador?: ReactNode;
}

export default function KpiCard({ label, valor, indicador }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-slate-800">{valor}</span>
        {indicador}
      </div>
    </div>
  );
}
