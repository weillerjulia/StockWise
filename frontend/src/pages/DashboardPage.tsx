import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { Classificacao, ResultadoAnalise } from "../api/types";
import { useResultadosUltimaImportacao } from "../hooks/useResultadosUltimaImportacao";

const ORDEM_CLASSIFICACAO: Classificacao[] = ["Prioridade Alta", "Prioridade Média", "Prioridade Baixa"];

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DashboardPage() {
  const estado = useResultadosUltimaImportacao();

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

  const resultados: ResultadoAnalise[] = estado.dados
    .map((linha) => linha.resultados_analise)
    .filter((resultado): resultado is ResultadoAnalise => resultado != null);

  const dadosGrafico = ORDEM_CLASSIFICACAO.map((classificacao) => ({
    classificacao,
    quantidade: resultados.filter((r) => r.classificacao === classificacao).length,
  }));

  const valorImobilizadoCritico = resultados
    .filter((r) => r.classificacao === "Prioridade Alta")
    .reduce((total, r) => total + r.custo_gerencial_composto, 0);

  return (
    <section>
      <h1>Visão geral</h1>

      <div>
        <h2>Valor imobilizado em produtos críticos (Prioridade Alta)</h2>
        <p>{formatarMoeda(valorImobilizadoCritico)}</p>
      </div>

      <div>
        <h2>Produtos por classificação</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="classificacao" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="quantidade" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
