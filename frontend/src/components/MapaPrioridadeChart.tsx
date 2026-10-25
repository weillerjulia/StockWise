import {
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import type { Classificacao } from "../api/types";
import { formatarMoeda, formatarNumero } from "../utils/format";

export interface PontoMapaPrioridade {
  nome_produto: string;
  classificacao: Classificacao;
  custo_gerencial_composto: number;
  giro_90d: number;
}

const ORDEM_CLASSIFICACAO: Classificacao[] = ["Prioridade Alta", "Prioridade Média", "Prioridade Baixa"];

// Cores mais fortes que as do gráfico de barras: em pontos pequenos os tons
// pastel somem no fundo branco. O formato do marcador repete a classificação
// para quem não distingue vermelho/verde.
const COR_PONTO: Record<Classificacao, string> = {
  "Prioridade Alta": "#dc2626",
  "Prioridade Média": "#f59e0b",
  "Prioridade Baixa": "#16a34a",
};

const FORMATO_PONTO: Record<Classificacao, "triangle" | "diamond" | "circle"> = {
  "Prioridade Alta": "triangle",
  "Prioridade Média": "diamond",
  "Prioridade Baixa": "circle",
};

function mediana(valores: number[]): number {
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 === 0 ? (ordenados[meio - 1] + ordenados[meio]) / 2 : ordenados[meio];
}

function MarcadorLegenda({ classificacao }: { classificacao: Classificacao }) {
  const cor = COR_PONTO[classificacao];
  const formato = FORMATO_PONTO[classificacao];
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      {formato === "triangle" && <polygon points="6,1 11,11 1,11" fill={cor} />}
      {formato === "diamond" && <polygon points="6,0.5 11.5,6 6,11.5 0.5,6" fill={cor} />}
      {formato === "circle" && <circle cx="6" cy="6" r="5" fill={cor} />}
    </svg>
  );
}

function TooltipPonto({ active, payload }: { active?: boolean; payload?: { payload: PontoMapaPrioridade }[] }) {
  if (!active || !payload?.length) return null;
  const ponto = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-800">{ponto.nome_produto}</p>
      <p className="mt-1 text-slate-600">{ponto.classificacao}</p>
      <p className="mt-1 text-slate-600">
        Custo gerencial: <span className="font-semibold text-slate-800">{formatarMoeda(ponto.custo_gerencial_composto)}</span>
      </p>
      <p className="text-slate-600">
        Giro (90d): <span className="font-semibold text-slate-800">{formatarNumero(ponto.giro_90d)}</span>
      </p>
    </div>
  );
}

export default function MapaPrioridadeChart({
  pontos,
  semGiro,
}: {
  pontos: PontoMapaPrioridade[];
  semGiro: number;
}) {
  if (pontos.length === 0) return null;

  const medianaGiro = mediana(pontos.map((p) => p.giro_90d));
  const medianaCusto = mediana(pontos.map((p) => p.custo_gerencial_composto));
  const maiorCusto = Math.max(...pontos.map((p) => p.custo_gerencial_composto));
  const topoEixoCusto = Math.ceil((maiorCusto * 1.1) / 100) * 100;

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
      <h2 className="text-sm font-semibold text-slate-800">Mapa de prioridade: giro × custo gerencial</h2>
      <p className="mt-1 text-xs text-slate-500">
        Cada ponto é um produto. As linhas tracejadas marcam a mediana do lote; o quadrante destacado reúne
        os produtos parados e caros, principais candidatos a promoção.
        {semGiro > 0 &&
          ` ${semGiro} produto${semGiro === 1 ? "" : "s"} com estoque zerado (giro indefinido) não aparece${semGiro === 1 ? "" : "m"} no mapa.`}
      </p>
      <ul className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
        {ORDEM_CLASSIFICACAO.map((classificacao) => (
          <li key={classificacao} className="flex items-center gap-1.5">
            <MarcadorLegenda classificacao={classificacao} />
            {classificacao}
          </li>
        ))}
      </ul>
      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="#f1f5f9" />
          <ReferenceArea
            x1={0}
            x2={medianaGiro}
            y1={medianaCusto}
            y2={topoEixoCusto}
            fill="#fee2e2"
            fillOpacity={0.4}
            label={{ value: "Parado e caro", position: "insideTopLeft", fill: "#991b1b", fontSize: 12 }}
          />
          <XAxis
            type="number"
            dataKey="giro_90d"
            name="Giro (90d)"
            padding={{ left: 12 }}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(valor) => formatarNumero(valor)}
            label={{ value: "Giro (90d)", position: "insideBottom", offset: -4, fill: "#64748b", fontSize: 12 }}
            height={40}
          />
          <YAxis
            type="number"
            dataKey="custo_gerencial_composto"
            name="Custo gerencial"
            domain={[0, topoEixoCusto]}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(valor) => formatarMoeda(valor)}
            width={90}
          />
          <ZAxis range={[70, 70]} />
          <ReferenceLine x={medianaGiro} stroke="#94a3b8" strokeDasharray="4 4" />
          <ReferenceLine y={medianaCusto} stroke="#94a3b8" strokeDasharray="4 4" />
          <Tooltip content={<TooltipPonto />} cursor={{ strokeDasharray: "3 3" }} />
          {ORDEM_CLASSIFICACAO.map((classificacao) => (
            <Scatter
              key={classificacao}
              name={classificacao}
              data={pontos.filter((p) => p.classificacao === classificacao)}
              fill={COR_PONTO[classificacao]}
              shape={FORMATO_PONTO[classificacao]}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
