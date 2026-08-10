import type { Classificacao } from "../api/types";

const CORES: Record<Classificacao, string> = {
  "Prioridade Alta": "bg-red-600",
  "Prioridade Média": "bg-amber-500",
  "Prioridade Baixa": "bg-green-600",
};

export default function ClassificacaoBadge({ classificacao }: { classificacao: Classificacao }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold text-white ${CORES[classificacao]}`}
    >
      {classificacao}
    </span>
  );
}
