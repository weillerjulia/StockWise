import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { salvarUltimaImportacaoId } from "../api/storage";
import ProdutosPage from "./ProdutosPage";

function criarLinha(
  codigo: string,
  nome: string,
  classificacao: "Prioridade Alta" | "Prioridade Média" | "Prioridade Baixa",
  custo: number,
) {
  return {
    id: codigo,
    produtos: { codigo_produto: codigo, nome_produto: nome, categoria: "Motor", fornecedor: "X" },
    resultados_analise: {
      custo_gerencial_composto: custo,
      giro_30d: 1,
      giro_90d: 1,
      giro_180d: 1,
      classificacao,
      score_prioridade: 0.5,
      desconto_maximo_percentual: 10,
      desconto_maximo_valor: 5,
    },
  };
}

const DADOS_MOCK = [
  criarLinha("AP-1", "Filtro de óleo", "Prioridade Alta", 100),
  criarLinha("AP-2", "Pastilha de freio", "Prioridade Média", 50),
  criarLinha("AP-3", "Vela de ignição", "Prioridade Baixa", 20),
];

describe("ProdutosPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => DADOS_MOCK }));
    salvarUltimaImportacaoId("importacao-1");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("renderiza todas as linhas de produtos da última importação", async () => {
    render(
      <MemoryRouter>
        <ProdutosPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Filtro de óleo")).toBeInTheDocument());

    expect(screen.getByText("Pastilha de freio")).toBeInTheDocument();
    expect(screen.getByText("Vela de ignição")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4); // 1 cabeçalho + 3 produtos
  });

  it("filtra a tabela por classificação", async () => {
    const usuario = userEvent.setup();
    render(
      <MemoryRouter>
        <ProdutosPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Filtro de óleo")).toBeInTheDocument());

    await usuario.selectOptions(screen.getByLabelText(/classificação/i), "Prioridade Alta");

    const linhas = screen.getAllByRole("row");
    expect(linhas).toHaveLength(2); // 1 cabeçalho + 1 produto de prioridade alta
    expect(within(linhas[1]).getByText("Filtro de óleo")).toBeInTheDocument();
    expect(screen.queryByText("Pastilha de freio")).not.toBeInTheDocument();
    expect(screen.queryByText("Vela de ignição")).not.toBeInTheDocument();
  });
});
