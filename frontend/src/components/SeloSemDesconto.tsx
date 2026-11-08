import { Info } from "lucide-react";
import { useState } from "react";

import { SELOS_DESCONTO, type SituacaoDesconto } from "../utils/situacaoDesconto";

const ALTURA_ESTIMADA_TOOLTIP = 100;
const LARGURA_TOOLTIP = 240;

export default function SeloSemDesconto({ situacao }: { situacao: SituacaoDesconto }) {
  const [ancora, setAncora] = useState<DOMRect | null>(null);
  const { rotulo, cores } = SELOS_DESCONTO[situacao.tipo];

  function abrir(evento: { currentTarget: HTMLElement }) {
    setAncora(evento.currentTarget.getBoundingClientRect());
  }

  // O selo fica na última coluna: alinha o tooltip pela direita para não sair da tela.
  function esquerda(retangulo: DOMRect) {
    return Math.max(8, Math.min(retangulo.left, retangulo.right - LARGURA_TOOLTIP));
  }

  function fechar() {
    setAncora(null);
  }

  // A tabela tem overflow próprio, que cortaria um tooltip absolute nas últimas linhas.
  const posicao =
    ancora &&
    (ancora.bottom + ALTURA_ESTIMADA_TOOLTIP > window.innerHeight
      ? { bottom: window.innerHeight - ancora.top + 6, left: esquerda(ancora) }
      : { top: ancora.bottom + 6, left: esquerda(ancora) });

  return (
    <button
      type="button"
      onMouseEnter={abrir}
      onMouseLeave={fechar}
      onFocus={abrir}
      onBlur={fechar}
      className={`relative inline-flex cursor-help items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cores}`}
    >
      <Info size={12} className="text-slate-500" aria-hidden="true" />
      {rotulo}
      <span className="sr-only">{situacao.mensagem}</span>
      {posicao && (
        <span
          aria-hidden="true"
          style={posicao}
          className="pointer-events-none fixed z-20 w-60 whitespace-normal rounded-md bg-slate-800 px-2.5 py-1.5 text-left text-xs font-normal text-white"
        >
          {situacao.mensagem}
        </span>
      )}
    </button>
  );
}
