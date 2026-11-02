import { useState } from "react";

import { SELOS_DESCONTO, type SituacaoDesconto } from "../utils/situacaoDesconto";

const ALTURA_ESTIMADA_TOOLTIP = 100;

export default function SeloSemDesconto({ situacao }: { situacao: SituacaoDesconto }) {
  const [ancora, setAncora] = useState<DOMRect | null>(null);
  const { rotulo, cores } = SELOS_DESCONTO[situacao.tipo];

  function abrir(evento: { currentTarget: HTMLElement }) {
    setAncora(evento.currentTarget.getBoundingClientRect());
  }

  function fechar() {
    setAncora(null);
  }

  // A tabela tem overflow próprio, que cortaria um tooltip absolute nas últimas linhas.
  const posicao =
    ancora &&
    (ancora.bottom + ALTURA_ESTIMADA_TOOLTIP > window.innerHeight
      ? { bottom: window.innerHeight - ancora.top + 6, left: ancora.left }
      : { top: ancora.bottom + 6, left: ancora.left });

  return (
    <span
      tabIndex={0}
      onMouseEnter={abrir}
      onMouseLeave={fechar}
      onFocus={abrir}
      onBlur={fechar}
      className={`relative inline-block cursor-help whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cores}`}
    >
      {rotulo}
      <span className="sr-only">{situacao.mensagem}</span>
      {posicao && (
        <span
          aria-hidden="true"
          style={posicao}
          className="pointer-events-none fixed z-20 w-60 whitespace-normal rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-normal text-white"
        >
          {situacao.mensagem}
        </span>
      )}
    </span>
  );
}
