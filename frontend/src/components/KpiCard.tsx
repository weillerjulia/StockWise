import HelpTooltip from "./HelpTooltip";

interface KpiCardProps {
  label: string;
  valor: string;
  /** Linha curta que dá referência ao número. Ex: "23% do total". */
  contexto?: string;
  ajuda?: string;
  alinharAjuda?: "esquerda" | "direita";
  /** Ponto vermelho ao lado do rótulo, para indicadores que pedem atenção. */
  alerta?: boolean;
  /** Classe Tailwind da borda esquerda colorida. Ex: "border-l-red-400". */
  corBorda?: string;
  /** Usados na tela de Upload (resumo da última importação). */
  tamanhoValor?: "grande" | "pequeno";
  corValor?: string;
}

export default function KpiCard({
  label,
  valor,
  contexto,
  ajuda,
  alinharAjuda,
  alerta,
  corBorda,
  tamanhoValor = "grande",
  corValor,
}: KpiCardProps) {
  const classeValor = tamanhoValor === "pequeno" ? "text-base font-semibold" : "text-2xl font-bold";

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-md ${
        corBorda ? `border-l-4 ${corBorda}` : ""
      }`}
    >
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
        {alerta && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden="true" />}
        {ajuda && <HelpTooltip texto={ajuda} alinhar={alinharAjuda} />}
      </div>
      <p className={`mt-2 tabular-nums ${classeValor} ${corValor ?? "text-slate-800"}`}>{valor}</p>
      {contexto && <p className="mt-1 text-xs text-slate-500">{contexto}</p>}
    </div>
  );
}
