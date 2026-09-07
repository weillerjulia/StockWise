import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  valor: string;
  indicador?: ReactNode;
  corBorda?: string;
  corValor?: string;
  alerta?: boolean;
  tamanhoValor?: "grande" | "pequeno";
}

export default function KpiCard({
  label,
  valor,
  indicador,
  corBorda,
  corValor,
  alerta,
  tamanhoValor = "grande",
}: KpiCardProps) {
  const classeValor = tamanhoValor === "pequeno" ? "text-base font-semibold" : "text-3xl font-bold";

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-md ${
        corBorda ? `border-l-4 ${corBorda}` : ""
      }`}
    >
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {alerta && <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`${classeValor} ${corValor ?? "text-slate-800"}`}>{valor}</span>
        {indicador}
      </div>
    </div>
  );
}
