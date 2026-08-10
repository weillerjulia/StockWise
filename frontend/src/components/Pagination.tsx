import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  onMudarPagina: (pagina: number) => void;
}

export default function Pagination({ paginaAtual, totalPaginas, onMudarPagina }: PaginationProps) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-2 py-3">
      <button
        type="button"
        onClick={() => onMudarPagina(paginaAtual - 1)}
        disabled={paginaAtual === 1}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Próxima
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
