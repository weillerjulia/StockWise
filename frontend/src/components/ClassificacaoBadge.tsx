import type { Classificacao } from "../api/types";
import MarcadorClassificacao from "./MarcadorClassificacao";

const FUNDO: Record<Classificacao, string> = {
  "Prioridade Alta": "bg-red-50 ring-red-200",
  "Prioridade Média": "bg-amber-50 ring-amber-200",
  "Prioridade Baixa": "bg-green-50 ring-green-200",
};

export default function ClassificacaoBadge({ classificacao }: { classificacao: Classificacao }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold text-slate-800 ring-1 ring-inset ${FUNDO[classificacao]}`}
    >
      <MarcadorClassificacao classificacao={classificacao} tamanho={10} />
      {classificacao}
    </span>
  );
}
