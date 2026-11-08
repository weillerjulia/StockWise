import type { Classificacao } from "../api/types";

export const ORDEM_CLASSIFICACAO: Classificacao[] = ["Prioridade Alta", "Prioridade Média", "Prioridade Baixa"];

/**
 * Paleta única de prioridade, usada em gráficos, mapa e selos.
 * Validada (skill dataviz) para separação em daltonismo e entre si. A mostarda tem
 * contraste < 3:1 com o branco, por isso nunca aparece sozinha: sempre com rótulo
 * escrito e com o formato do marcador (▲ ◆ ●) repetindo a classificação.
 */
export const COR_CLASSIFICACAO: Record<Classificacao, string> = {
  "Prioridade Alta": "#b91c1c",
  "Prioridade Média": "#ca8a04",
  "Prioridade Baixa": "#15803d",
};

export const FORMATO_CLASSIFICACAO: Record<Classificacao, "triangle" | "diamond" | "circle"> = {
  "Prioridade Alta": "triangle",
  "Prioridade Média": "diamond",
  "Prioridade Baixa": "circle",
};

/** Valor usado no endereço da página de Produtos: /produtos?classificacao=alta */
export const SLUG_CLASSIFICACAO: Record<Classificacao, string> = {
  "Prioridade Alta": "alta",
  "Prioridade Média": "media",
  "Prioridade Baixa": "baixa",
};

export function classificacaoPorSlug(slug: string | null): Classificacao | null {
  return ORDEM_CLASSIFICACAO.find((classificacao) => SLUG_CLASSIFICACAO[classificacao] === slug) ?? null;
}
