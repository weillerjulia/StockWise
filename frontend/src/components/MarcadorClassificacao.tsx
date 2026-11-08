import type { Classificacao } from "../api/types";
import { COR_CLASSIFICACAO, FORMATO_CLASSIFICACAO } from "../utils/classificacao";

/** Marcador ▲ ◆ ● na cor da prioridade: o formato repete a informação da cor. */
export default function MarcadorClassificacao({
  classificacao,
  tamanho = 12,
}: {
  classificacao: Classificacao;
  tamanho?: number;
}) {
  const cor = COR_CLASSIFICACAO[classificacao];
  const formato = FORMATO_CLASSIFICACAO[classificacao];
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
      {formato === "triangle" && <polygon points="6,1 11,11 1,11" fill={cor} />}
      {formato === "diamond" && <polygon points="6,0.5 11.5,6 6,11.5 0.5,6" fill={cor} />}
      {formato === "circle" && <circle cx="6" cy="6" r="5" fill={cor} />}
    </svg>
  );
}
