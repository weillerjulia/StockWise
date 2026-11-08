import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { salvarUltimaImportacaoId } from "../api/storage";
import DashboardPage from "./DashboardPage";

function criarLinha(
  codigo: string,
  classificacao: "Prioridade Alta" | "Prioridade Média" | "Prioridade Baixa",
  custo: number,
  giro: number,
  estoque = { atual: 10, minimo: 2 },
) {
  return {
    id: codigo,
    preco_venda_unitario: custo * 2,
    quantidade_estoque_atual: estoque.atual,
    estoque_minimo: estoque.minimo,
    produtos: { codigo_produto: codigo, nome_produto: `Produto ${codigo}`, categoria: "Motor", fornecedor: "X" },
    resultados_analise: {
      custo_gerencial_composto: custo,
      giro_30d: giro,
      giro_90d: giro,
      giro_180d: giro,
      classificacao,
      score_prioridade: 0.5,
      desconto_maximo_percentual: 10,
      desconto_maximo_valor: 5,
      dias_em_estoque: 30,
    },
  };
}

const DADOS_MOCK = [
  criarLinha("AP-1", "Prioridade Alta", 300, 0.5),
  criarLinha("AP-2", "Prioridade Média", 100, 2),
  criarLinha("AP-3", "Prioridade Baixa", 50, 6),
  criarLinha("AP-4", "Prioridade Baixa", 50, 8),
];

function renderizar() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => DADOS_MOCK }));
    salvarUltimaImportacaoId("importacao-1");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("mostra os indicadores com contexto e o giro típico pela mediana", async () => {
    renderizar();

    await waitFor(() => expect(screen.getByText("R$ 500,00")).toBeInTheDocument());
    expect(screen.getByText("4 produtos analisados")).toBeInTheDocument();
    expect(screen.getByText("60% do total, em prioridade alta")).toBeInTheDocument();
    // Mediana de 0,5 / 2 / 6 / 8 = (2 + 6) / 2
    expect(screen.getByText("4,00")).toBeInTheDocument();
  });

  it("mostra os valores multiplicados pela quantidade em estoque", async () => {
    renderizar();

    // 4 produtos × 10 unidades: (300 + 100 + 50 + 50) × 10
    await waitFor(() => expect(screen.getByText("R$ 5.000,00")).toBeInTheDocument());
    expect(screen.getByText("40 unidades em estoque")).toBeInTheDocument();
    // Crítico: 300 × 10
    expect(screen.getAllByText("R$ 3.000,00")).toHaveLength(2); // card + frase de resumo
    expect(screen.getByText("60% do valor em estoque, em prioridade alta")).toBeInTheDocument();
    // Recuperação: 5 por unidade × 10 unidades × 4 produtos
    expect(screen.getAllByText("R$ 200,00")).toHaveLength(2); // card + frase de resumo
  });

  it("leva cada prioridade da distribuição para Produtos já filtrado", async () => {
    renderizar();

    const linkAlta = await screen.findByRole("link", { name: /Prioridade Alta\s*1 produto\s*25%/ });
    expect(linkAlta).toHaveAttribute("href", "/produtos?classificacao=alta");
    expect(screen.getByRole("link", { name: /Prioridade Baixa\s*2 produtos\s*50%/ })).toHaveAttribute(
      "href",
      "/produtos?classificacao=baixa",
    );
    expect(screen.getByRole("link", { name: /ver produtos prioritários/i })).toHaveAttribute(
      "href",
      "/produtos?classificacao=alta",
    );
  });

  it("só mostra o alerta de ruptura quando há produto abaixo do estoque mínimo", async () => {
    renderizar();
    await screen.findByText("4 produtos analisados");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("alerta quando há produtos abaixo do estoque mínimo", async () => {
    const dados = [...DADOS_MOCK, criarLinha("AP-5", "Prioridade Média", 80, 1, { atual: 1, minimo: 5 })];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => dados }));
    renderizar();

    const alerta = await screen.findByRole("alert");
    expect(within(alerta).getByText("1 produto")).toBeInTheDocument();
    expect(alerta).toHaveTextContent(/abaixo do estoque mínimo/);
  });
});
