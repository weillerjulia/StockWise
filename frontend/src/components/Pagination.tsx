import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  onMudarPagina: (pagina: number) => void;
  /** Quantidade de itens após filtros (o que está sendo paginado). */
  totalItens: number;
  /** Quantidade antes dos filtros; quando diferente de totalItens, o resumo indica o filtro. */
  totalSemFiltro?: number;
  /** Nome dos itens no plural, usado no resumo. Ex: "produtos". */
  rotuloItens?: string;
  itensPorPagina: number;
  opcoesItensPorPagina?: number[];
  onMudarItensPorPagina?: (itens: number) => void;
}

type ItemPaginacao = number | "reticencias-inicio" | "reticencias-fim";

/** Primeira, última e vizinhas da atual; lacunas viram "…" (ou o número, se faltar só um). */
export function calcularPaginasVisiveis(paginaAtual: number, totalPaginas: number): ItemPaginacao[] {
  if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1);

  const paginas = new Set([1, totalPaginas, paginaAtual - 1, paginaAtual, paginaAtual + 1]);
  if (paginaAtual <= 3) [2, 3, 4].forEach((p) => paginas.add(p));
  if (paginaAtual >= totalPaginas - 2) [0, 1, 2].forEach((d) => paginas.add(totalPaginas - 1 - d));

  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= totalPaginas).sort((a, b) => a - b);
  const itens: ItemPaginacao[] = [];
  ordenadas.forEach((pagina, indice) => {
    const anterior = ordenadas[indice - 1];
    if (anterior != null && pagina - anterior === 2) itens.push(anterior + 1);
    else if (anterior != null && pagina - anterior > 2) {
      itens.push(pagina > paginaAtual ? "reticencias-fim" : "reticencias-inicio");
    }
    itens.push(pagina);
  });
  return itens;
}

const ESTILO_BOTAO =
  "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";

export default function Pagination({
  paginaAtual,
  totalPaginas,
  onMudarPagina,
  totalItens,
  totalSemFiltro,
  rotuloItens = "itens",
  itensPorPagina,
  opcoesItensPorPagina,
  onMudarItensPorPagina,
}: PaginationProps) {
  const filtrado = totalSemFiltro != null && totalSemFiltro !== totalItens;
  const inicio = (paginaAtual - 1) * itensPorPagina + 1;
  const fim = Math.min(paginaAtual * itensPorPagina, totalItens);

  let resumo: string;
  if (totalItens === 0) {
    resumo = filtrado ? `Nenhum resultado (de ${totalSemFiltro} ${rotuloItens})` : `Nenhum item`;
  } else {
    resumo = `Mostrando ${inicio} a ${fim} de ${totalItens}`;
    resumo += filtrado ? ` (filtrado de ${totalSemFiltro} ${rotuloItens})` : ` ${rotuloItens}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
      <p className="text-sm text-slate-500">{resumo}</p>

      <div className="flex flex-wrap items-center gap-6">
        {opcoesItensPorPagina && onMudarItensPorPagina && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Itens por página
            <select
              value={itensPorPagina}
              onChange={(evento) => onMudarItensPorPagina(Number(evento.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
            >
              {opcoesItensPorPagina.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>
          </label>
        )}

        {totalPaginas > 1 && (
          <nav aria-label="Paginação" className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Página anterior"
              onClick={() => onMudarPagina(paginaAtual - 1)}
              disabled={paginaAtual === 1}
              className={`${ESTILO_BOTAO} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <ChevronLeft size={16} />
            </button>

            {calcularPaginasVisiveis(paginaAtual, totalPaginas).map((item) =>
              typeof item === "number" ? (
                <button
                  key={item}
                  type="button"
                  aria-label={`Página ${item}`}
                  aria-current={item === paginaAtual ? "page" : undefined}
                  onClick={() => onMudarPagina(item)}
                  className={`${ESTILO_BOTAO} ${
                    item === paginaAtual
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item}
                </button>
              ) : (
                <span key={item} aria-hidden="true" className="px-1 text-sm text-slate-400">
                  …
                </span>
              ),
            )}

            <button
              type="button"
              aria-label="Próxima página"
              onClick={() => onMudarPagina(paginaAtual + 1)}
              disabled={paginaAtual === totalPaginas}
              className={`${ESTILO_BOTAO} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
