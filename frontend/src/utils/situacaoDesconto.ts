import { formatarMoeda } from "./format";

// Mesmo valor de MARGEM_MINIMA_PERCENTUAL_PADRAO em backend/app/services/desconto_maximo.py.
export const MARGEM_MINIMA_PERCENTUAL = 10;

export type TipoSituacaoDesconto = "prejuizo" | "sem_margem" | "no_limite";

// Todos os selos usam a mesma cor neutra, para não competir com as cores da classificação.
const CORES_SELO = "bg-slate-50 text-slate-700 ring-slate-300";

export const SELOS_DESCONTO: Record<TipoSituacaoDesconto, { rotulo: string; cores: string }> = {
  prejuizo: { rotulo: "Prejuízo", cores: CORES_SELO },
  sem_margem: { rotulo: "Sem margem", cores: CORES_SELO },
  no_limite: { rotulo: "No limite", cores: CORES_SELO },
};

export interface SituacaoDesconto {
  tipo: TipoSituacaoDesconto;
  mensagem: string;
}

export function descreverSituacaoDesconto(custo: number, precoVenda: number): SituacaoDesconto {
  // Calcula em centavos para arredondar igual ao backend, sem erro de ponto flutuante.
  const custoCentavos = Math.round(custo * 100);
  const precoCentavos = Math.round(precoVenda * 100);
  const minimoCentavos = Math.round((custoCentavos * (100 + MARGEM_MINIMA_PERCENTUAL)) / 100);

  if (precoCentavos < custoCentavos) {
    return {
      tipo: "prejuizo",
      mensagem: `Vendendo com prejuízo: o preço está ${formatarMoeda((custoCentavos - precoCentavos) / 100)} abaixo do custo.`,
    };
  }

  if (precoCentavos < minimoCentavos) {
    return {
      tipo: "sem_margem",
      mensagem: `Sem espaço para desconto: faltam ${formatarMoeda((minimoCentavos - precoCentavos) / 100)} para atingir o preço mínimo de ${formatarMoeda(minimoCentavos / 100)}.`,
    };
  }

  return {
    tipo: "no_limite",
    mensagem: `No limite: qualquer desconto deixa o preço abaixo da margem de ${MARGEM_MINIMA_PERCENTUAL}%.`,
  };
}
