import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  onMudarPagina: (pagina: number) => void;
  itensPorPagina?: number;
  opcoesItensPorPagina?: number[];
  onMudarItensPorPagina?: (itens: number) => void;
}

export default function Pagination({
  paginaAtual,
  totalPaginas,
  onMudarPagina,
  itensPorPagina,
  opcoesItensPorPagina,
  onMudarItensPorPagina,
}: PaginationProps) {
  const mostrarSeletor =
    itensPorPagina != null && opcoesItensPorPagina != null && onMudarItensPorPagina != null;

  if (totalPaginas <= 1 && !mostrarSeletor) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-2 py-3">
      {mostrarSeletor ? (
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
      ) : (
        <span />
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onMudarPagina(paginaAtual - 1)}
            disabled={paginaAtual === 1}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          <span className="text-sm text-slate-500">
            Página {paginaAtual} de {totalPaginas}
          </span>

          <button
            type="button"
            onClick={() => onMudarPagina(paginaAtual + 1)}
            disabled={paginaAtual === totalPaginas}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
