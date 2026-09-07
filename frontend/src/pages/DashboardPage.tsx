import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import KpiCard from "../components/KpiCard";
import type { Classificacao, ResultadoAnalise } from "../api/types";
import { useResultadosUltimaImportacao } from "../hooks/useResultadosUltimaImportacao";
import { formatarMoeda, formatarNumero } from "../utils/format";

const ORDEM_CLASSIFICACAO: Classificacao[] = ["Prioridade Alta", "Prioridade Média", "Prioridade Baixa"];

const COR_GRAFICO_CLASSIFICACAO: Record<Classificacao, string> = {
  "Prioridade Alta": "#fecaca",
  "Prioridade Média": "#fed7aa",
  "Prioridade Baixa": "#bbf7d0",
};

const COR_BORDA_CLASSIFICACAO: Record<Classificacao, string> = {
  "Prioridade Alta": "border-l-red-400",
  "Prioridade Média": "border-l-orange-400",
  "Prioridade Baixa": "border-l-green-400",
};

function interpolarCor(corClara: string, corEscura: string, t: number): string {
  const paraRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [r1, g1, b1] = paraRgb(corClara);
  const [r2, g2, b2] = paraRgb(corEscura);
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  const paraHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${paraHex(lerp(r1, r2))}${paraHex(lerp(g1, g2))}${paraHex(lerp(b1, b2))}`;
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

  const produtosComCusto = estado.dados
    .map((linha) => {
      const resultado = linha.resultados_analise;
      if (!resultado) return null;
      return {
        nome_produto: linha.produtos.nome_produto,
        categoria: linha.produtos.categoria ?? "Sem categoria",
        custo_gerencial_composto: resultado.custo_gerencial_composto,
        giro_90d: resultado.giro_90d,
        dias_em_estoque: resultado.dias_em_estoque,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

  const contagemPorClassificacao = Object.fromEntries(
    ORDEM_CLASSIFICACAO.map((classificacao) => [
      classificacao,
      resultados.filter((r) => r.classificacao === classificacao).length,
    ]),
  ) as Record<Classificacao, number>;

  const dadosGrafico = ORDEM_CLASSIFICACAO.map((classificacao) => ({
    classificacao,
    quantidade: contagemPorClassificacao[classificacao],
  }));

  const valorTotalImobilizado = resultados.reduce((total, r) => total + r.custo_gerencial_composto, 0);

  const valorImobilizadoCritico = resultados
    .filter((r) => r.classificacao === "Prioridade Alta")
    .reduce((total, r) => total + r.custo_gerencial_composto, 0);

  const potencialRecuperacao = resultados.reduce((total, r) => total + (r.desconto_maximo_valor ?? 0), 0);

  const riscoRuptura = estado.dados.filter(
    (linha) => linha.quantidade_estoque_atual < linha.estoque_minimo,
  ).length;

  const valorPorCategoria = new Map<string, number>();
  for (const item of produtosComCusto) {
    valorPorCategoria.set(
      item.categoria,
      (valorPorCategoria.get(item.categoria) ?? 0) + item.custo_gerencial_composto,
    );
  }
  const dadosPorCategoria = [...valorPorCategoria.entries()]
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  const maiorValorCategoria = Math.max(...dadosPorCategoria.map((item) => item.valor), 1);

  const top5PorCusto = [...produtosComCusto]
    .sort((a, b) => b.custo_gerencial_composto - a.custo_gerencial_composto)
    .slice(0, 5);

  const top5ParadosHaMaisTempo = [...produtosComCusto]
    .sort((a, b) => b.dias_em_estoque - a.dias_em_estoque)
    .slice(0, 5);

  const giros90d = produtosComCusto
    .map((item) => item.giro_90d)
    .filter((giro): giro is number => giro != null);
  const giroMedioGeral = giros90d.length > 0 ? giros90d.reduce((total, g) => total + g, 0) / giros90d.length : null;

  const qtdPrioridadeAlta = contagemPorClassificacao["Prioridade Alta"];
  const temAlerta = qtdPrioridadeAlta > 0;

  return (
    <section>
      <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-md">
        {temAlerta ? (
          <>
            <span className="font-bold">
              {qtdPrioridadeAlta} produto{qtdPrioridadeAlta === 1 ? "" : "s"}
            </span>{" "}
            {qtdPrioridadeAlta === 1 ? "está" : "estão"} em prioridade alta, somando{" "}
            <span className="font-bold">{formatarMoeda(valorImobilizadoCritico)}</span> de capital parado.
            Aplicando os descontos sugeridos, é possível recuperar até{" "}
            <span className="font-bold">{formatarMoeda(potencialRecuperacao)}</span>.
          </>
        ) : (
          "Nenhum produto em prioridade alta neste momento — estoque saudável."
        )}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total de produtos" valor={String(resultados.length)} />
        <KpiCard label="Valor total imobilizado" valor={formatarMoeda(valorTotalImobilizado)} />
        <KpiCard label="Valor imobilizado (crítico)" valor={formatarMoeda(valorImobilizadoCritico)} />
        <KpiCard label="Potencial de recuperação" valor={formatarMoeda(potencialRecuperacao)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Prioridade Alta"
          valor={String(contagemPorClassificacao["Prioridade Alta"])}
          corBorda={COR_BORDA_CLASSIFICACAO["Prioridade Alta"]}
          alerta
        />
        <KpiCard
          label="Prioridade Média"
          valor={String(contagemPorClassificacao["Prioridade Média"])}
          corBorda={COR_BORDA_CLASSIFICACAO["Prioridade Média"]}
        />
        <KpiCard label="Risco de ruptura" valor={String(riscoRuptura)} corBorda="border-l-orange-400" />
        <KpiCard
          label="Giro médio geral (90d)"
          valor={giroMedioGeral != null ? formatarNumero(giroMedioGeral) : "-"}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <h2 className="text-sm font-semibold text-slate-800">Produtos por classificação</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="classificacao" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
              {dadosGrafico.map((item) => (
                <Cell key={item.classificacao} fill={COR_GRAFICO_CLASSIFICACAO[item.classificacao]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <h2 className="text-sm font-semibold text-slate-800">Valor imobilizado por categoria (R$)</h2>
        <ResponsiveContainer width="100%" height={Math.max(300, dadosPorCategoria.length * 36)}>
          <BarChart data={dadosPorCategoria} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              domain={[0, Math.ceil(maiorValorCategoria * 1.1)]}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={(valor) => formatarMoeda(valor)}
            />
            <YAxis type="category" dataKey="categoria" tick={{ fill: "#64748b", fontSize: 12 }} width={150} />
            <Tooltip formatter={(valor) => formatarMoeda(Number(valor))} />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
              {dadosPorCategoria.map((item) => (
                <Cell
                  key={item.categoria}
                  fill={interpolarCor("#eff6ff", "#93c5fd", item.valor / maiorValorCategoria)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
          <h2 className="text-sm font-semibold text-slate-800">Top 5 produtos por custo gerencial</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {top5PorCusto.map((produto) => (
              <li key={produto.nome_produto} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-700">{produto.nome_produto}</span>
                <span className="font-bold text-slate-800">{formatarMoeda(produto.custo_gerencial_composto)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
          <h2 className="text-sm font-semibold text-slate-800">Top 5 produtos parados há mais tempo</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {top5ParadosHaMaisTempo.map((produto) => (
              <li key={produto.nome_produto} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-700">{produto.nome_produto}</span>
                <span className="font-bold text-slate-800">
                  {produto.dias_em_estoque} dia{produto.dias_em_estoque === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
