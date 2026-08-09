import type { Classificacao } from "../api/types";

const CORES: Record<Classificacao, string> = {
  "Prioridade Alta": "#dc2626",
  "Prioridade Média": "#f59e0b",
  "Prioridade Baixa": "#16a34a",
};

export default function ClassificacaoBadge({ classificacao }: { classificacao: Classificacao }) {
  return (
    <span className="badge-classificacao" style={{ backgroundColor: CORES[classificacao] }}>
      {classificacao}
    </span>
  );
}
