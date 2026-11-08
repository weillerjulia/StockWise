import { AlertTriangle, ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { Classificacao, ResultadoAnalise } from "../api/types";
import CardSecao from "../components/CardSecao";
import ClassificacaoBadge from "../components/ClassificacaoBadge";
import KpiCard from "../components/KpiCard";
import MapaPrioridadeChart, { type PontoMapaPrioridade } from "../components/MapaPrioridadeChart";
import MarcadorClassificacao from "../components/MarcadorClassificacao";
import { useResultadosUltimaImportacao } from "../hooks/useResultadosUltimaImportacao";
import { COR_CLASSIFICACAO, ORDEM_CLASSIFICACAO, SLUG_CLASSIFICACAO } from "../utils/classificacao";
import { formatarMoeda, formatarNumero } from "../utils/format";

// Chaves das séries empilhadas no gráfico de categorias (uma por prioridade).
const CHAVE_SERIE: Record<Classificacao, "alta" | "media" | "baixa"> = {
  "Prioridade Alta": "alta",
  "Prioridade Média": "media",
  "Prioridade Baixa": "baixa",
};

interface LinhaCategoria {
  categoria: string;
  alta: number;
  media: number;
  baixa: number;
  total: number;
}

function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 === 0 ? (ordenados[meio - 1] + ordenados[meio]) / 2 : ordenados[meio];
}

function percentual(parte: number, total: number): string {
  return total > 0 ? `${Math.round((parte / total) * 100)}%` : "0%";
}

function linkProdutos(classificacao: Classificacao): string {
  return `/produtos?classificacao=${SLUG_CLASSIFICACAO[classificacao]}`;
}

function TooltipCategoria({ active, payload }: { active?: boolean; payload?: { payload: LinhaCategoria }[] }) {
  if (!active || !payload?.length) return null;
  const linha = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-800">{linha.categoria}</p>
      <ul className="mt-1.5 space-y-1">
        {ORDEM_CLASSIFICACAO.map((classificacao) => (
          <li key={classificacao} className="flex items-center gap-1.5 text-slate-600">
            <MarcadorClassificacao classificacao={classificacao} tamanho={10} />
            {classificacao.replace("Prioridade ", "")}:
            <span className="ml-auto pl-3 font-semibold text-slate-800 tabular-nums">
              {formatarMoeda(linha[CHAVE_SERIE[classificacao]])}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 flex border-t border-slate-100 pt-1.5 text-slate-600">
        Total
        <span className="ml-auto pl-3 font-semibold text-slate-800 tabular-nums">{formatarMoeda(linha.total)}</span>
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const estado = useResultadosUltimaImportacao();

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

  const resultados: ResultadoAnalise[] = estado.dados
    .map((linha) => linha.resultados_analise)
    .filter((resultado): resultado is ResultadoAnalise => resultado != null);

  const produtos = estado.dados
    .map((linha) => {
      const resultado = linha.resultados_analise;
      if (!resultado) return null;
      return {
        nome_produto: linha.produtos.nome_produto,
        categoria: linha.produtos.categoria ?? "Sem categoria",
        classificacao: resultado.classificacao,
        custo_gerencial_composto: resultado.custo_gerencial_composto,
        giro_90d: resultado.giro_90d,
        dias_em_estoque: resultado.dias_em_estoque,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

  const pontosMapaPrioridade: PontoMapaPrioridade[] = produtos.flatMap((produto) =>
    produto.giro_90d == null ? [] : [{ ...produto, giro_90d: produto.giro_90d }],
  );

  const totalProdutos = resultados.length;

  // Valores: mesma base de cálculo de antes (custo gerencial unitário somado).
  const valorTotalImobilizado = resultados.reduce((total, r) => total + r.custo_gerencial_composto, 0);
  const potencialRecuperacao = resultados.reduce((total, r) => total + (r.desconto_maximo_valor ?? 0), 0);

  const resumoPorClassificacao = ORDEM_CLASSIFICACAO.map((classificacao) => {
    const daClasse = resultados.filter((r) => r.classificacao === classificacao);
    return {
      classificacao,
      quantidade: daClasse.length,
      valor: daClasse.reduce((total, r) => total + r.custo_gerencial_composto, 0),
    };
  });
  const resumoAlta = resumoPorClassificacao[0];
  const valorImobilizadoCritico = resumoAlta.valor;

  // Mesmos indicadores multiplicados pela quantidade em estoque de cada produto.
  const emEstoque = estado.dados.reduce(
    (acumulado, linha) => {
      const resultado = linha.resultados_analise;
      if (!resultado) return acumulado;
      const quantidade = linha.quantidade_estoque_atual;
      const valor = resultado.custo_gerencial_composto * quantidade;
      acumulado.unidades += quantidade;
      acumulado.valor += valor;
      if (resultado.classificacao === "Prioridade Alta") acumulado.critico += valor;
      acumulado.recuperacao += (resultado.desconto_maximo_valor ?? 0) * quantidade;
      return acumulado;
    },
    { unidades: 0, valor: 0, critico: 0, recuperacao: 0 },
  );

  const riscoRuptura = estado.dados.filter(
    (linha) => linha.quantidade_estoque_atual < linha.estoque_minimo,
  ).length;

  const giroTipico = mediana(
    produtos.map((p) => p.giro_90d).filter((giro): giro is number => giro != null),
  );

  const porCategoria = new Map<string, LinhaCategoria>();
  for (const produto of produtos) {
    const linha = porCategoria.get(produto.categoria) ?? {
      categoria: produto.categoria,
      alta: 0,
      media: 0,
      baixa: 0,
      total: 0,
    };
    linha[CHAVE_SERIE[produto.classificacao]] += produto.custo_gerencial_composto;
    linha.total += produto.custo_gerencial_composto;
    porCategoria.set(produto.categoria, linha);
  }
  const dadosPorCategoria = [...porCategoria.values()].sort((a, b) => b.total - a.total).slice(0, 10);
  const totalDaCategoria = new Map(dadosPorCategoria.map((linha) => [linha.categoria, linha.total]));

  const top5PorCusto = [...produtos]
    .sort((a, b) => b.custo_gerencial_composto - a.custo_gerencial_composto)
    .slice(0, 5);
  const top5ParadosHaMaisTempo = [...produtos].sort((a, b) => b.dias_em_estoque - a.dias_em_estoque).slice(0, 5);

  const qtdPrioridadeAlta = resumoAlta.quantidade;

  return (
    <section className="space-y-6">
      {/* Resumo em frase, com atalho para os produtos que pedem ação. */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <p className="text-sm text-slate-700">
          {qtdPrioridadeAlta > 0 ? (
            <>
              <span className="font-bold">
                {qtdPrioridadeAlta} produto{qtdPrioridadeAlta === 1 ? "" : "s"}
              </span>{" "}
              {qtdPrioridadeAlta === 1 ? "está" : "estão"} em prioridade alta, somando{" "}
              <span className="font-bold">{formatarMoeda(emEstoque.critico)}</span> de capital parado em estoque.
              Aplicando os descontos sugeridos, é possível recuperar até{" "}
              <span className="font-bold">{formatarMoeda(emEstoque.recuperacao)}</span> vendendo todo o estoque.
            </>
          ) : (
            "Nenhum produto em prioridade alta neste momento — estoque saudável."
          )}
        </p>
        {qtdPrioridadeAlta > 0 && (
          <Link
            to={linkProdutos("Prioridade Alta")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Ver produtos prioritários
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>

      {riscoRuptura > 0 && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm text-amber-900"
        >
          <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
          <span>
            <span className="font-bold">
              {riscoRuptura} produto{riscoRuptura === 1 ? "" : "s"}
            </span>{" "}
            {riscoRuptura === 1 ? "está" : "estão"} abaixo do estoque mínimo — risco de faltar para venda.
          </span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Valor total imobilizado (por unidade)"
          valor={formatarMoeda(valorTotalImobilizado)}
          contexto={`${totalProdutos} produto${totalProdutos === 1 ? "" : "s"} analisado${totalProdutos === 1 ? "" : "s"}`}
          ajuda="Soma do custo gerencial de 1 unidade (aquisição + armazenagem + oportunidade) de cada produto. Não considera a quantidade em estoque."
        />
        <KpiCard
          label="Valor imobilizado crítico (por unidade)"
          valor={formatarMoeda(valorImobilizadoCritico)}
          contexto={`${percentual(valorImobilizadoCritico, valorTotalImobilizado)} do total, em prioridade alta`}
          ajuda="Soma do custo gerencial de 1 unidade de cada produto em Prioridade Alta. Não considera a quantidade em estoque."
        />
        <KpiCard
          label="Potencial de recuperação (por unidade)"
          valor={formatarMoeda(potencialRecuperacao)}
          contexto="com os descontos sugeridos"
          ajuda="Soma do desconto máximo sugerido para 1 unidade de cada produto, mantendo a margem mínima de 10%. Não considera a quantidade em estoque."
          alinharAjuda="direita"
        />
        <KpiCard
          label="Giro típico (90d)"
          valor={giroTipico != null ? formatarNumero(giroTipico) : "-"}
          contexto="vezes por ano, no ritmo atual"
          ajuda="Mediana do giro de 90 dias, projetado para um ano: metade dos produtos gira mais que isso e metade gira menos. Ex: 2,26 = o produto típico renovaria o estoque pouco mais de 2x por ano."
          alinharAjuda="direita"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Valor total imobilizado (em estoque)"
          valor={formatarMoeda(emEstoque.valor)}
          contexto={`${formatarNumero(emEstoque.unidades, 0)} unidade${emEstoque.unidades === 1 ? "" : "s"} em estoque`}
          ajuda="Custo gerencial de cada produto multiplicado pela quantidade em estoque: o capital realmente parado."
        />
        <KpiCard
          label="Valor imobilizado crítico (em estoque)"
          valor={formatarMoeda(emEstoque.critico)}
          contexto={`${percentual(emEstoque.critico, emEstoque.valor)} do valor em estoque, em prioridade alta`}
          ajuda="Custo gerencial × quantidade em estoque, somando só os produtos em Prioridade Alta."
        />
        <KpiCard
          label="Potencial de recuperação (em estoque)"
          valor={formatarMoeda(emEstoque.recuperacao)}
          contexto="vendendo todo o estoque com os descontos sugeridos"
          ajuda="Desconto máximo sugerido por unidade multiplicado pela quantidade em estoque, mantendo a margem mínima de 10%."
          alinharAjuda="direita"
        />
      </div>

      <CardSecao
        titulo="Distribuição por prioridade"
        subtitulo="Quantos produtos estão em cada prioridade. Clique numa linha para ver os produtos."
        ajuda="Combina giro, custo gerencial e estoque numa prioridade de ação. Alta = parado e caro, precisa de atenção. Baixa = saudável."
      >
        <div
          className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100"
          role="img"
          aria-label={resumoPorClassificacao
            .map((item) => `${item.classificacao}: ${percentual(item.quantidade, totalProdutos)}`)
            .join(", ")}
        >
          {resumoPorClassificacao
            .filter((item) => item.quantidade > 0)
            .map((item) => (
              <div
                key={item.classificacao}
                style={{
                  width: `${(item.quantidade / totalProdutos) * 100}%`,
                  backgroundColor: COR_CLASSIFICACAO[item.classificacao],
                }}
              />
            ))}
        </div>

        <ul className="mt-4 divide-y divide-slate-100">
          {resumoPorClassificacao.map((item) => (
            <li key={item.classificacao}>
              <Link
                to={linkProdutos(item.classificacao)}
                className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-slate-50"
              >
                <MarcadorClassificacao classificacao={item.classificacao} />
                <span className="font-medium text-slate-800">{item.classificacao}</span>
                <span className="ml-auto font-semibold text-slate-800 tabular-nums">
                  {item.quantidade} produto{item.quantidade === 1 ? "" : "s"}
                </span>
                <span className="w-12 text-right text-slate-500 tabular-nums">
                  {percentual(item.quantidade, totalProdutos)}
                </span>
                <span className="hidden w-32 text-right text-slate-500 tabular-nums sm:inline">
                  {formatarMoeda(item.valor)}
                </span>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </CardSecao>

      <MapaPrioridadeChart pontos={pontosMapaPrioridade} semGiro={totalProdutos - pontosMapaPrioridade.length} />

      <CardSecao
        titulo="Top 10 categorias por valor imobilizado"
        subtitulo="Onde está o valor parado e quanto dele já está em prioridade alta. Passe o mouse para ver os valores."
      >
        <ul className="flex flex-wrap gap-4 text-xs text-slate-600">
          {ORDEM_CLASSIFICACAO.map((classificacao) => (
            <li key={classificacao} className="flex items-center gap-1.5">
              <MarcadorClassificacao classificacao={classificacao} />
              {classificacao}
            </li>
          ))}
        </ul>
        <ResponsiveContainer width="100%" height={Math.max(220, dadosPorCategoria.length * 36)}>
          <BarChart data={dadosPorCategoria} layout="vertical" margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="categoria"
              tick={{ fill: "#475569", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            {/* Coluna de totais à direita: o valor fica legível sem depender do eixo. */}
            <YAxis
              yAxisId="totais"
              orientation="right"
              type="category"
              dataKey="categoria"
              tickFormatter={(categoria: string) => formatarMoeda(totalDaCategoria.get(categoria) ?? 0)}
              tick={{ fill: "#1e293b", fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip content={<TooltipCategoria />} cursor={{ fill: "#f1f5f9" }} />
            {ORDEM_CLASSIFICACAO.map((classificacao) => (
              <Bar
                key={classificacao}
                dataKey={CHAVE_SERIE[classificacao]}
                name={classificacao}
                stackId="valor"
                fill={COR_CLASSIFICACAO[classificacao]}
                stroke="#ffffff"
                strokeWidth={2}
                barSize={20}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardSecao>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardSecao
          titulo="Top 5 produtos por custo gerencial"
          subtitulo="Os itens mais caros de manter em estoque."
        >
          <ListaTop5
            itens={top5PorCusto.map((produto) => ({
              ...produto,
              valor: formatarMoeda(produto.custo_gerencial_composto),
            }))}
          />
        </CardSecao>

        <CardSecao titulo="Top 5 produtos parados há mais tempo" subtitulo="Há quantos dias estão no estoque.">
          <ListaTop5
            itens={top5ParadosHaMaisTempo.map((produto) => ({
              ...produto,
              valor: `${produto.dias_em_estoque} dia${produto.dias_em_estoque === 1 ? "" : "s"}`,
            }))}
          />
        </CardSecao>
      </div>
    </section>
  );
}

function ListaTop5({
  itens,
}: {
  itens: { nome_produto: string; classificacao: Classificacao; valor: string }[];
}) {
  return (
    <ul className="divide-y divide-slate-100">
      {itens.map((item) => (
        <li key={item.nome_produto}>
          <Link
            to={`/produtos?busca=${encodeURIComponent(item.nome_produto)}`}
            className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-slate-50"
          >
            <span className="min-w-0 flex-1 truncate text-slate-700">{item.nome_produto}</span>
            <ClassificacaoBadge classificacao={item.classificacao} />
            <span className="w-24 text-right font-bold text-slate-800 tabular-nums">{item.valor}</span>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
