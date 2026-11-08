import { AlertTriangle, ChevronDown, ChevronsUpDown, ChevronUp, Download, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import type { Classificacao } from "../api/types";
import ClassificacaoBadge from "../components/ClassificacaoBadge";
import HelpTooltip from "../components/HelpTooltip";
import { useDefinirExtrasDoTitulo } from "../components/layout/ExtrasDoTitulo";
import Pagination from "../components/Pagination";
import SeloSemDesconto from "../components/SeloSemDesconto";
import { useResultadosUltimaImportacao } from "../hooks/useResultadosUltimaImportacao";
import { classificacaoPorSlug, ORDEM_CLASSIFICACAO } from "../utils/classificacao";
import { exportarCsv } from "../utils/exportCsv";
import { formatarMoeda, formatarNumero } from "../utils/format";
import { descreverSituacaoDesconto, type SituacaoDesconto } from "../utils/situacaoDesconto";

const OPCOES_CLASSIFICACAO = ORDEM_CLASSIFICACAO;
const OPCOES_ITENS_POR_PAGINA = [10, 25, 50, 100];

interface LinhaProduto {
  codigo_produto: string;
  nome_produto: string;
  categoria: string | null;
  custo_gerencial_composto: number;
  preco_venda_unitario: number | null;
  giro_90d: number | null;
  classificacao: Classificacao;
  desconto_maximo_percentual: number | null;
  desconto_maximo_valor: number | null;
  situacao_desconto: SituacaoDesconto | null;
}

type ChaveOrdenacao =
  | "nome_produto"
  | "categoria"
  | "custo_gerencial_composto"
  | "preco_venda_unitario"
  | "giro_90d"
  | "classificacao"
  | "desconto_maximo_percentual"
  | "desconto_maximo_valor";

/** Compara em ordem crescente; valores vazios ficam sempre no começo. */
function compararLinhas(a: LinhaProduto, b: LinhaProduto, chave: ChaveOrdenacao): number {
  if (chave === "classificacao") {
    return ORDEM_CLASSIFICACAO.indexOf(a.classificacao) - ORDEM_CLASSIFICACAO.indexOf(b.classificacao);
  }
  const valorA = a[chave];
  const valorB = b[chave];
  if (valorA == null || valorB == null) return (valorA == null ? 0 : 1) - (valorB == null ? 0 : 1);
  if (typeof valorA === "string" && typeof valorB === "string") {
    return valorA.localeCompare(valorB, "pt-BR", { sensitivity: "base" });
  }
  return Number(valorA) - Number(valorB);
}

function SelosDoTitulo({
  totalProdutos,
  aviso,
}: {
  totalProdutos: number;
  aviso: { rotulo: string; detalhe: string } | null;
}) {
  return (
    <>
      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 ring-inset">
        {totalProdutos} produto{totalProdutos === 1 ? "" : "s"}
      </span>

      {aviso && (
        // O status fica no span para leitores de tela; o botão só dá foco pelo teclado.
        <span role="status" className="inline-flex">
          <button
            type="button"
            className="group relative inline-flex cursor-help items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-300 ring-inset"
          >
            <AlertTriangle size={13} aria-hidden="true" />
            {aviso.rotulo}
            <span className="sr-only"> {aviso.detalhe}</span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-full left-0 z-20 mt-1.5 w-64 rounded-md bg-slate-800 px-2.5 py-1.5 text-left text-xs font-normal text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
            >
              {aviso.detalhe}
            </span>
          </button>
        </span>
      )}
    </>
  );
}

export default function ProdutosPage() {
  const estado = useResultadosUltimaImportacao();
  // Filtros iniciais vindos do endereço, ex.: /produtos?classificacao=alta (links do painel).
  const [parametrosUrl] = useSearchParams();
  const [termoBusca, setTermoBusca] = useState(() => parametrosUrl.get("busca") ?? "");
  const [filtroClassificacao, setFiltroClassificacao] = useState<Classificacao | "todas">(
    () => classificacaoPorSlug(parametrosUrl.get("classificacao")) ?? "todas",
  );
  const [ordenacao, setOrdenacao] = useState<{ chave: ChaveOrdenacao; direcao: "asc" | "desc" } | null>(
    null,
  );
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(OPCOES_ITENS_POR_PAGINA[0]);

  const linhas: LinhaProduto[] = useMemo(() => {
    if (estado.status !== "sucesso") return [];

    return estado.dados
      .map((linha) => {
        const resultado = linha.resultados_analise;
        if (!resultado) return null;
        return {
          codigo_produto: linha.produtos.codigo_produto,
          nome_produto: linha.produtos.nome_produto,
          categoria: linha.produtos.categoria,
          custo_gerencial_composto: resultado.custo_gerencial_composto,
          preco_venda_unitario: linha.preco_venda_unitario,
          giro_90d: resultado.giro_90d,
          classificacao: resultado.classificacao,
          desconto_maximo_percentual: resultado.desconto_maximo_percentual,
          desconto_maximo_valor: resultado.desconto_maximo_valor,
          situacao_desconto:
            resultado.desconto_maximo_valor === 0 && linha.preco_venda_unitario != null
              ? descreverSituacaoDesconto(resultado.custo_gerencial_composto, linha.preco_venda_unitario)
              : null,
        };
      })
      .filter((linha): linha is LinhaProduto => linha != null);
  }, [estado]);

  const avisoSemDesconto = useMemo(() => {
    const contar = (tipo: SituacaoDesconto["tipo"]) =>
      linhas.filter((linha) => linha.situacao_desconto?.tipo === tipo).length;
    const contagens: [number, string][] = [
      [contar("prejuizo"), "com prejuízo"],
      [contar("sem_margem"), "sem margem"],
      [contar("no_limite"), "no limite"],
    ];
    const total = contagens.reduce((soma, [quantidade]) => soma + quantidade, 0);
    if (total === 0) return null;

    const detalhes = contagens
      .filter(([quantidade]) => quantidade > 0)
      .map(([quantidade, descricao]) => `${quantidade} ${descricao}`);
    const detalhe = new Intl.ListFormat("pt-BR", { type: "conjunction" }).format(detalhes);

    return {
      rotulo: `${total} sem desconto`,
      detalhe: `Sem espaço para desconto: ${detalhe}. Reveja o preço ou o custo antes de planejar uma promoção.`,
    };
  }, [linhas]);

  const linhasFiltradas = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();

    const filtradas = linhas.filter(
      (linha) =>
        (filtroClassificacao === "todas" || linha.classificacao === filtroClassificacao) &&
        (termo === "" ||
          linha.nome_produto.toLowerCase().includes(termo) ||
          linha.codigo_produto.toLowerCase().includes(termo)),
    );

    if (!ordenacao) return filtradas;

    const sinal = ordenacao.direcao === "asc" ? 1 : -1;
    return [...filtradas].sort((a, b) => compararLinhas(a, b, ordenacao.chave) * sinal);
  }, [linhas, filtroClassificacao, termoBusca, ordenacao]);

  const definirExtrasDoTitulo = useDefinirExtrasDoTitulo();
  const carregado = estado.status === "sucesso";
  const totalProdutos = linhas.length;

  // Selos ao lado do título "Produtos": total geral (ignora filtros) e aviso de sem desconto.
  useEffect(() => {
    if (!carregado) return;
    definirExtrasDoTitulo(<SelosDoTitulo totalProdutos={totalProdutos} aviso={avisoSemDesconto} />);
    return () => definirExtrasDoTitulo(null);
  }, [carregado, totalProdutos, avisoSemDesconto, definirExtrasDoTitulo]);

  const totalPaginas = Math.max(1, Math.ceil(linhasFiltradas.length / itensPorPagina));
  const paginaCorrigida = Math.min(paginaAtual, totalPaginas);
  const linhasPaginadas = linhasFiltradas.slice(
    (paginaCorrigida - 1) * itensPorPagina,
    paginaCorrigida * itensPorPagina,
  );

  function alternarOrdenacao(chave: ChaveOrdenacao) {
    setOrdenacao((atual) => {
      if (atual?.chave !== chave) return { chave, direcao: "asc" };
      return { chave, direcao: atual.direcao === "asc" ? "desc" : "asc" };
    });
  }

  function iconeOrdenacao(chave: ChaveOrdenacao): ReactNode {
    const ativo = ordenacao?.chave === chave;
    return (
      <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-slate-400">
        {ativo ? (
          ordenacao.direcao === "asc" ? (
            <ChevronUp size={14} className="text-slate-700" />
          ) : (
            <ChevronDown size={14} className="text-slate-700" />
          )
        ) : (
          <ChevronsUpDown size={13} />
        )}
      </span>
    );
  }

  function ariaSort(chave: ChaveOrdenacao): "ascending" | "descending" | "none" {
    if (ordenacao?.chave !== chave) return "none";
    return ordenacao.direcao === "asc" ? "ascending" : "descending";
  }

  function cabecalhoOrdenavel({
    chave,
    rotulo,
    largura,
    numerico = false,
    ajuda,
  }: {
    chave: ChaveOrdenacao;
    rotulo: string;
    largura: string;
    numerico?: boolean;
    ajuda?: string;
  }) {
    return (
      <th
        className={`sticky top-0 z-10 ${largura} border-b border-slate-200 bg-slate-50 px-4 py-3 ${
          numerico ? "text-right" : "text-left"
        }`}
        aria-sort={ariaSort(chave)}
      >
        <div className={`flex items-center gap-1 ${numerico ? "justify-end" : ""}`}>
          <button
            type="button"
            onClick={() => alternarOrdenacao(chave)}
            className={`flex cursor-pointer items-center gap-1 tracking-wide uppercase hover:text-slate-900 ${
              numerico ? "text-right" : "text-left"
            }`}
          >
            {rotulo}
            {iconeOrdenacao(chave)}
          </button>
          {ajuda && <HelpTooltip texto={ajuda} alinhar="direita" />}
        </div>
      </th>
    );
  }

  function exportarProdutos() {
    const cabecalho = [
      "Código",
      "Nome",
      "Categoria",
      "Custo gerencial (por unidade)",
      "Preço de venda",
      "Giro (90d)",
      "Classificação",
      "Desconto máximo (%)",
      "Desconto máximo (R$)",
      "Observação",
    ];

    const linhasCsv = linhasFiltradas.map((linha) => [
      linha.codigo_produto,
      linha.nome_produto,
      linha.categoria ?? "",
      formatarMoeda(linha.custo_gerencial_composto),
      linha.preco_venda_unitario != null ? formatarMoeda(linha.preco_venda_unitario) : "",
      linha.giro_90d != null ? formatarNumero(linha.giro_90d) : "",
      linha.classificacao,
      linha.desconto_maximo_percentual != null ? `${formatarNumero(linha.desconto_maximo_percentual)}%` : "",
      linha.desconto_maximo_valor != null ? formatarMoeda(linha.desconto_maximo_valor) : "",
      linha.situacao_desconto?.mensagem ?? "",
    ]);

    const dataDeHoje = new Date().toISOString().slice(0, 10);
    exportarCsv(`produtos-stockwise-${dataDeHoje}.csv`, cabecalho, linhasCsv);
  }

  if (estado.status === "carregando") return <p className="text-slate-500">Carregando...</p>;

  if (estado.status === "vazio") {
    return (
      <p className="text-slate-600">
        Nenhuma importação encontrada.{" "}
        <Link to="/" className="font-medium text-blue-600 hover:underline">
          Faça um upload primeiro
        </Link>
        .
      </p>
    );
  }

  if (estado.status === "erro") {
    return (
      <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {estado.mensagem}
      </p>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="search"
            placeholder="Buscar por nome ou código..."
            value={termoBusca}
            onChange={(evento) => {
              setTermoBusca(evento.target.value);
              setPaginaAtual(1);
            }}
            className="w-64 rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
          />
        </div>

        <label htmlFor="filtro-classificacao" className="sr-only">
          Classificação
        </label>
        <div className="relative">
          <select
            id="filtro-classificacao"
            value={filtroClassificacao}
            onChange={(evento) => {
              setFiltroClassificacao(evento.target.value as Classificacao | "todas");
              setPaginaAtual(1);
            }}
            className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-9 pl-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
          >
            <option value="todas">Todas as classificações</option>
            {OPCOES_CLASSIFICACAO.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
            size={16}
            aria-hidden="true"
          />
        </div>

        <button
          type="button"
          onClick={exportarProdutos}
          disabled={linhasFiltradas.length === 0}
          className="ml-auto flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={16} />
          Exportar Excel
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
        {/* Rolagem própria: o cabeçalho fica fixo e a paginação sempre visível. */}
        <div className="max-h-[calc(100vh-16rem)] overflow-auto">
          <table className="w-full min-w-[920px] table-fixed text-sm">
            <thead>
              <tr className="text-xs font-medium tracking-wide text-slate-600 uppercase">
                {cabecalhoOrdenavel({ chave: "nome_produto", rotulo: "Nome", largura: "w-[24%]" })}
                {cabecalhoOrdenavel({ chave: "categoria", rotulo: "Categoria", largura: "w-[11%]" })}
                {cabecalhoOrdenavel({
                  chave: "custo_gerencial_composto",
                  rotulo: "Custo gerencial",
                  largura: "w-[12%]",
                  numerico: true,
                  ajuda:
                    "Custo de 1 unidade: aquisição + armazenagem + oportunidade, proporcionais ao tempo em estoque. Ex: R$ 100 parado 30 dias pode chegar a R$ 101,99.",
                })}
                {cabecalhoOrdenavel({
                  chave: "preco_venda_unitario",
                  rotulo: "Preço de venda",
                  largura: "w-[11%]",
                  numerico: true,
                })}
                {cabecalhoOrdenavel({
                  chave: "giro_90d",
                  rotulo: "Giro (90d)",
                  largura: "w-[9%]",
                  numerico: true,
                  ajuda:
                    "Vendas dos últimos 90 dias em relação ao estoque, projetadas para um ano. Ex: giro 5,89 = nesse ritmo, o estoque giraria quase 6x por ano; perto de 0 = produto parado.",
                })}
                {cabecalhoOrdenavel({
                  chave: "classificacao",
                  rotulo: "Classificação",
                  largura: "w-[15%]",
                  ajuda:
                    "Combina giro, custo gerencial e estoque numa prioridade de ação. Alta = parado e caro, precisa de atenção. Baixa = saudável.",
                })}
                <th
                  className="sticky top-0 z-10 w-[18%] border-b border-slate-200 bg-blue-50 px-4 py-3 text-right"
                  aria-sort={
                    ordenacao?.chave === "desconto_maximo_valor"
                      ? ariaSort("desconto_maximo_valor")
                      : ariaSort("desconto_maximo_percentual")
                  }
                >
                  <div className="flex items-center justify-end gap-1 text-blue-900">
                    Desconto sugerido
                    <HelpTooltip
                      texto="Maior desconto possível por unidade sem perder a margem mínima de 10%. Ex: preço R$ 34,90, custo R$ 22,69 → até R$ 9,94 (28,48%)."
                      alinhar="direita"
                    />
                  </div>
                  <div className="mt-1 flex justify-end gap-3 normal-case">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacao("desconto_maximo_valor")}
                      aria-label="Ordenar por desconto em R$"
                      className="flex cursor-pointer items-center gap-0.5 text-slate-600 hover:text-slate-900"
                    >
                      R$
                      {iconeOrdenacao("desconto_maximo_valor")}
                    </button>
                    <button
                      type="button"
                      onClick={() => alternarOrdenacao("desconto_maximo_percentual")}
                      aria-label="Ordenar por desconto em %"
                      className="flex cursor-pointer items-center gap-0.5 text-slate-600 hover:text-slate-900"
                    >
                      %
                      {iconeOrdenacao("desconto_maximo_percentual")}
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linhasPaginadas.map((linha) => (
                <tr key={linha.codigo_produto} className="group transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="truncate font-semibold text-slate-800" title={linha.nome_produto}>
                      {linha.nome_produto}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{linha.codigo_produto}</p>
                  </td>
                  <td className="truncate px-4 py-3 text-slate-500" title={linha.categoria ?? undefined}>
                    {linha.categoria ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 tabular-nums">
                    {formatarMoeda(linha.custo_gerencial_composto)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 tabular-nums">
                    {linha.preco_venda_unitario != null ? formatarMoeda(linha.preco_venda_unitario) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 tabular-nums">
                    {linha.giro_90d != null ? formatarNumero(linha.giro_90d) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <ClassificacaoBadge classificacao={linha.classificacao} />
                  </td>
                  <td className="bg-blue-50/50 px-4 py-3 text-right group-hover:bg-blue-50">
                    {linha.situacao_desconto ? (
                      <SeloSemDesconto situacao={linha.situacao_desconto} />
                    ) : linha.desconto_maximo_valor != null ? (
                      <>
                        <p className="font-bold text-slate-900 tabular-nums">
                          {formatarMoeda(linha.desconto_maximo_valor)}
                        </p>
                        {linha.desconto_maximo_percentual != null && (
                          <p className="mt-0.5 text-xs font-medium text-slate-600 tabular-nums">
                            {formatarNumero(linha.desconto_maximo_percentual)}%
                          </p>
                        )}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          paginaAtual={paginaCorrigida}
          totalPaginas={totalPaginas}
          onMudarPagina={setPaginaAtual}
          totalItens={linhasFiltradas.length}
          totalSemFiltro={linhas.length}
          rotuloItens="produtos"
          itensPorPagina={itensPorPagina}
          opcoesItensPorPagina={OPCOES_ITENS_POR_PAGINA}
          onMudarItensPorPagina={(itens) => {
            setItensPorPagina(itens);
            setPaginaAtual(1);
          }}
        />
      </div>
    </section>
  );
}
