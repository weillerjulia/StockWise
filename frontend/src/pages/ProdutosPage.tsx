import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { Classificacao } from "../api/types";
import ClassificacaoBadge from "../components/ClassificacaoBadge";
import { useResultadosUltimaImportacao } from "../hooks/useResultadosUltimaImportacao";
import { formatarMoeda, formatarNumero } from "../utils/format";

const OPCOES_CLASSIFICACAO: Classificacao[] = ["Prioridade Alta", "Prioridade Média", "Prioridade Baixa"];

interface LinhaProduto {
  codigo_produto: string;
  nome_produto: string;
  categoria: string | null;
  custo_gerencial_composto: number;
  giro_90d: number | null;
  classificacao: Classificacao;
  desconto_maximo_percentual: number | null;
  desconto_maximo_valor: number | null;
}

type ChaveOrdenacao = "custo_gerencial_composto" | "giro_90d";

export default function ProdutosPage() {
  const estado = useResultadosUltimaImportacao();
  const [filtroClassificacao, setFiltroClassificacao] = useState<Classificacao | "todas">("todas");
  const [ordenacao, setOrdenacao] = useState<{ chave: ChaveOrdenacao; direcao: "asc" | "desc" } | null>(
    null,
  );

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
          giro_90d: resultado.giro_90d,
          classificacao: resultado.classificacao,
          desconto_maximo_percentual: resultado.desconto_maximo_percentual,
          desconto_maximo_valor: resultado.desconto_maximo_valor,
        };
      })
      .filter((linha): linha is LinhaProduto => linha != null);
  }, [estado]);

  const linhasFiltradas = useMemo(() => {
    const filtradas =
      filtroClassificacao === "todas"
        ? linhas
        : linhas.filter((linha) => linha.classificacao === filtroClassificacao);

    if (!ordenacao) return filtradas;

    const sinal = ordenacao.direcao === "asc" ? 1 : -1;
    return [...filtradas].sort((a, b) => {
      const valorA = a[ordenacao.chave] ?? -Infinity;
      const valorB = b[ordenacao.chave] ?? -Infinity;
      return (valorA - valorB) * sinal;
    });
  }, [linhas, filtroClassificacao, ordenacao]);

  function alternarOrdenacao(chave: ChaveOrdenacao) {
    setOrdenacao((atual) => {
      if (atual?.chave !== chave) return { chave, direcao: "asc" };
      return { chave, direcao: atual.direcao === "asc" ? "desc" : "asc" };
    });
  }

  function indicadorOrdenacao(chave: ChaveOrdenacao): string {
    if (ordenacao?.chave !== chave) return "";
    return ordenacao.direcao === "asc" ? " ▲" : " ▼";
  }

  function ariaSort(chave: ChaveOrdenacao): "ascending" | "descending" | "none" {
    if (ordenacao?.chave !== chave) return "none";
    return ordenacao.direcao === "asc" ? "ascending" : "descending";
  }

  if (estado.status === "carregando") return <p>Carregando...</p>;

  if (estado.status === "vazio") {
    return (
      <p>
        Nenhuma importação encontrada. <Link to="/">Faça um upload primeiro</Link>.
      </p>
    );
  }

  if (estado.status === "erro") {
    return <p role="alert">{estado.mensagem}</p>;
  }

  return (
    <section>
      <h1>Produtos</h1>

      <label htmlFor="filtro-classificacao">Classificação</label>
      <select
        id="filtro-classificacao"
        value={filtroClassificacao}
        onChange={(evento) => setFiltroClassificacao(evento.target.value as Classificacao | "todas")}
      >
        <option value="todas">Todas</option>
        {OPCOES_CLASSIFICACAO.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>

      <p>
        {linhasFiltradas.length} produto{linhasFiltradas.length === 1 ? "" : "s"}
      </p>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Categoria</th>
            <th aria-sort={ariaSort("custo_gerencial_composto")}>
              <button type="button" onClick={() => alternarOrdenacao("custo_gerencial_composto")}>
                Custo gerencial{indicadorOrdenacao("custo_gerencial_composto")}
              </button>
            </th>
            <th aria-sort={ariaSort("giro_90d")}>
              <button type="button" onClick={() => alternarOrdenacao("giro_90d")}>
                Giro (90d){indicadorOrdenacao("giro_90d")}
              </button>
            </th>
            <th>Classificação</th>
            <th>Desconto máximo sugerido</th>
          </tr>
        </thead>
        <tbody>
          {linhasFiltradas.map((linha) => (
            <tr key={linha.codigo_produto}>
              <td>{linha.nome_produto}</td>
              <td>{linha.categoria}</td>
              <td>{formatarMoeda(linha.custo_gerencial_composto)}</td>
              <td>{linha.giro_90d != null ? formatarNumero(linha.giro_90d) : "-"}</td>
              <td>
                <ClassificacaoBadge classificacao={linha.classificacao} />
              </td>
              <td>
                {linha.desconto_maximo_percentual != null && linha.desconto_maximo_valor != null
                  ? `${formatarNumero(linha.desconto_maximo_percentual)}% (${formatarMoeda(linha.desconto_maximo_valor)})`
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
