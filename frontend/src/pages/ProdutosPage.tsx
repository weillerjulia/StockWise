import { ChevronDown, ChevronsUpDown, ChevronUp, Download, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { Classificacao } from "../api/types";
import ClassificacaoBadge from "../components/ClassificacaoBadge";
import HelpTooltip from "../components/HelpTooltip";
import Pagination from "../components/Pagination";
import { useResultadosUltimaImportacao } from "../hooks/useResultadosUltimaImportacao";
import { exportarCsv } from "../utils/exportCsv";
import { formatarMoeda, formatarNumero } from "../utils/format";

const OPCOES_CLASSIFICACAO: Classificacao[] = ["Prioridade Alta", "Prioridade Média", "Prioridade Baixa"];
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
}

type ChaveOrdenacao =
  | "custo_gerencial_composto"
  | "giro_90d"
  | "desconto_maximo_percentual"
  | "desconto_maximo_valor";

export default function ProdutosPage() {
  const estado = useResultadosUltimaImportacao();
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroClassificacao, setFiltroClassificacao] = useState<Classificacao | "todas">("todas");
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
        };
      })
      .filter((linha): linha is LinhaProduto => linha != null);
  }, [estado]);

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
    return [...filtradas].sort((a, b) => {
      const valorA = a[ordenacao.chave] ?? -Infinity;
      const valorB = b[ordenacao.chave] ?? -Infinity;
      return (valorA - valorB) * sinal;
    });
  }, [linhas, filtroClassificacao, termoBusca, ordenacao]);

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

  function exportarProdutos() {
    const cabecalho = [
      "Nome",
      "Categoria",
      "Custo gerencial",
      "Preço de venda",
      "Giro (90d)",
      "Classificação",
      "Desconto máximo (%)",
      "Desconto máximo (R$)",
    ];

    const linhasCsv = linhasFiltradas.map((linha) => [
      linha.nome_produto,
      linha.categoria ?? "",
      formatarMoeda(linha.custo_gerencial_composto),
      linha.preco_venda_unitario != null ? formatarMoeda(linha.preco_venda_unitario) : "",
      linha.giro_90d != null ? formatarNumero(linha.giro_90d) : "",
      linha.classificacao,
      linha.desconto_maximo_percentual != null ? `${formatarNumero(linha.desconto_maximo_percentual)}%` : "",
      linha.desconto_maximo_valor != null ? formatarMoeda(linha.desconto_maximo_valor) : "",
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
        <select
          id="filtro-classificacao"
          value={filtroClassificacao}
          onChange={(evento) => {
            setFiltroClassificacao(evento.target.value as Classificacao | "todas");
            setPaginaAtual(1);
          }}
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
        >
          <option value="todas">Todas as classificações</option>
          {OPCOES_CLASSIFICACAO.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>

        <span className="text-sm text-slate-500">
          {linhasFiltradas.length} produto{linhasFiltradas.length === 1 ? "" : "s"}
        </span>

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
        <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] table-fixed text-sm">
          <thead>
            <tr className="text-left text-xs font-medium tracking-wide text-slate-600 uppercase">
              <th className="w-[18%] px-4 py-3">Nome</th>
              <th className="w-[10%] px-4 py-3">Categoria</th>
              <th className="w-[11%] px-4 py-3" aria-sort={ariaSort("custo_gerencial_composto")}>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("custo_gerencial_composto")}
                    className="flex items-center gap-1 tracking-wide text-slate-600 uppercase hover:text-slate-700"
                  >
                    Custo gerencial
                    {iconeOrdenacao("custo_gerencial_composto")}
                  </button>
                  <HelpTooltip
                    texto="Custo de aquisição + armazenagem + oportunidade, proporcionais ao tempo em estoque. Ex: R$ 100 parado 30 dias pode chegar a R$ 101,99."
                    alinhar="direita"
                  />
                </div>
              </th>
              <th className="w-[11%] px-4 py-3">Preço de venda</th>
              <th className="w-[8%] px-4 py-3" aria-sort={ariaSort("giro_90d")}>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("giro_90d")}
                    className="flex items-center gap-1 tracking-wide text-slate-600 uppercase hover:text-slate-700"
                  >
                    Giro (90d)
                    {iconeOrdenacao("giro_90d")}
                  </button>
                  <HelpTooltip
                    texto="Vendas dos últimos 90 dias em relação ao estoque. Ex: giro 5,89 = girou quase 6x o estoque; perto de 0 = produto parado."
                    alinhar="direita"
                  />
                </div>
              </th>
              <th className="w-[13%] px-4 py-3">
                <div className="flex items-center gap-1">
                  Classificação
                  <HelpTooltip
                    texto="Combina giro, custo gerencial e estoque numa prioridade de ação. Alta = parado e caro, precisa de atenção. Baixa = saudável."
                    alinhar="direita"
                  />
                </div>
              </th>
              <th className="w-[14%] px-4 py-3" aria-sort={ariaSort("desconto_maximo_percentual")}>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("desconto_maximo_percentual")}
                    className="flex items-center gap-1 tracking-wide text-slate-600 uppercase hover:text-slate-700"
                  >
                    Desconto máximo sugerido (%)
                    {iconeOrdenacao("desconto_maximo_percentual")}
                  </button>
                  <HelpTooltip
                    texto="Maior desconto possível sem perder a margem mínima de 10%. Ex: preço R$ 34,90, custo R$ 22,69 → até 28,48% (R$ 9,94)."
                    alinhar="direita"
                  />
                </div>
              </th>
              <th className="w-[15%] px-4 py-3" aria-sort={ariaSort("desconto_maximo_valor")}>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("desconto_maximo_valor")}
                    className="flex items-center gap-1 tracking-wide text-slate-600 uppercase hover:text-slate-700"
                  >
                    Desconto máximo sugerido (R$)
                    {iconeOrdenacao("desconto_maximo_valor")}
                  </button>
                  <HelpTooltip
                    texto="Maior desconto possível sem perder a margem mínima de 10%. Ex: preço R$ 34,90, custo R$ 22,69 → até 28,48% (R$ 9,94)."
                    alinhar="direita"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {linhasPaginadas.map((linha) => (
              <tr key={linha.codigo_produto} className="transition-colors hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{linha.nome_produto}</td>
                <td className="px-4 py-3 text-slate-600">{linha.categoria}</td>
                <td className="px-4 py-3 text-slate-600">{formatarMoeda(linha.custo_gerencial_composto)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {linha.preco_venda_unitario != null ? formatarMoeda(linha.preco_venda_unitario) : "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {linha.giro_90d != null ? formatarNumero(linha.giro_90d) : "-"}
                </td>
                <td className="px-4 py-3">
                  <ClassificacaoBadge classificacao={linha.classificacao} />
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {linha.desconto_maximo_percentual != null
                    ? `${formatarNumero(linha.desconto_maximo_percentual)}%`
                    : "-"}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {linha.desconto_maximo_valor != null ? formatarMoeda(linha.desconto_maximo_valor) : "-"}
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
