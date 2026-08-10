import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import KpiCard from "../components/KpiCard";
import type { Classificacao, ResultadoAnalise } from "../api/types";
import { useResultadosUltimaImportacao } from "../hooks/useResultadosUltimaImportacao";
import { formatarMoeda } from "../utils/format";

const ORDEM_CLASSIFICACAO: Classificacao[] = ["Prioridade Alta", "Prioridade Média", "Prioridade Baixa"];

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

  const valorImobilizadoCritico = resultados
    .filter((r) => r.classificacao === "Prioridade Alta")
    .reduce((total, r) => total + r.custo_gerencial_composto, 0);

  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-800">Visão geral</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total de produtos" valor={String(resultados.length)} />
        <KpiCard
          label="Prioridade Alta"
          valor={String(contagemPorClassificacao["Prioridade Alta"])}
          indicador={<span className="h-2 w-2 rounded-full bg-red-600" />}
        />
        <KpiCard
          label="Prioridade Média"
          valor={String(contagemPorClassificacao["Prioridade Média"])}
          indicador={<span className="h-2 w-2 rounded-full bg-amber-500" />}
        />
        <KpiCard label="Valor imobilizado (crítico)" valor={formatarMoeda(valorImobilizadoCritico)} />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-800">Produtos por classificação</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="classificacao" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="quantidade" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
