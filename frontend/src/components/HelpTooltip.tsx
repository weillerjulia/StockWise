import { HelpCircle } from "lucide-react";

interface HelpTooltipProps {
  texto: string;
  alinhar?: "esquerda" | "direita";
}

export default function HelpTooltip({ texto, alinhar = "esquerda" }: HelpTooltipProps) {
  const posicao = alinhar === "esquerda" ? "left-0" : "right-0";

  return (
    <span className="group relative inline-flex" tabIndex={0}>
      <HelpCircle size={13} className="cursor-help text-slate-400" aria-hidden="true" />
      <span className="sr-only">{texto}</span>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full ${posicao} z-20 mt-1.5 w-60 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-normal normal-case text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100`}
      >
        {texto}
      </span>
    </span>
  );
}
