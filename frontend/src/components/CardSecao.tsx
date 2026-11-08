import type { ReactNode } from "react";

import HelpTooltip from "./HelpTooltip";

/** Bloco padrão do painel: título, subtítulo dizendo para que serve e ajuda opcional. */
export default function CardSecao({
  titulo,
  subtitulo,
  ajuda,
  children,
  className = "",
}: {
  titulo: string;
  subtitulo?: string;
  ajuda?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-md ${className}`}>
      <div className="flex items-center gap-1.5">
        <h2 className="text-sm font-semibold text-slate-800">{titulo}</h2>
        {ajuda && <HelpTooltip texto={ajuda} />}
      </div>
      {subtitulo && <p className="mt-1 text-xs text-slate-500">{subtitulo}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
