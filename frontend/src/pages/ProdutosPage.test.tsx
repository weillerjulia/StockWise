import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { salvarUltimaImportacaoId } from "../api/storage";
import { exportarCsv } from "../utils/exportCsv";
import AppLayout from "../components/layout/AppLayout";
import ProdutosPage from "./ProdutosPage";

// Renderiza dentro do layout: os selos de total e de aviso ficam na Topbar, ao lado do título.
function renderizarPagina() {
  return render(
    <MemoryRouter initialEntries={["/produtos"]}>
      <AppLayout>
        <ProdutosPage />
      </AppLayout>
    </MemoryRouter>,
  );
}

vi.mock("../utils/exportCsv", () => ({ exportarCsv: vi.fn() }));

function criarLinha(
  codigo: string,
  nome: string,
  classificacao: "Prioridade Alta" | "Prioridade Média" | "Prioridade Baixa",
  custo: number,
) {
  return {
    id: codigo,
    preco_venda_unitario: custo * 2,
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
    renderizarPagina();

    await waitFor(() => expect(screen.getByText("Filtro de óleo")).toBeInTheDocument());

    expect(screen.getByText("Pastilha de freio")).toBeInTheDocument();
    expect(screen.getByText("Vela de ignição")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4); // 1 cabeçalho + 3 produtos
  });

  it("mostra o código abaixo do nome e o desconto em R$ com o % embaixo", async () => {
    renderizarPagina();

    await waitFor(() => expect(screen.getByText("Filtro de óleo")).toBeInTheDocument());
    const linha = screen.getAllByRole("row")[1];
    expect(within(linha).getByText("AP-1")).toBeInTheDocument();
    expect(within(linha).getByText("R$ 5,00")).toBeInTheDocument();
    expect(within(linha).getByText("10,00%")).toBeInTheDocument();
  });

  it("ordena por nome e por classificação ao clicar no cabeçalho", async () => {
    const usuario = userEvent.setup();
    renderizarPagina();

    await waitFor(() => expect(screen.getByText("Filtro de óleo")).toBeInTheDocument());
    const nomesNaOrdem = () =>
      screen
        .getAllByRole("row")
        .slice(1)
        .map((linha) => within(linha).getAllByRole("cell")[0].querySelector("p")?.textContent);

    await usuario.click(screen.getByRole("button", { name: "Nome" }));
    await usuario.click(screen.getByRole("button", { name: "Nome" }));
    expect(nomesNaOrdem()).toEqual(["Vela de ignição", "Pastilha de freio", "Filtro de óleo"]);

    await usuario.click(screen.getByRole("button", { name: "Classificação" }));
    expect(nomesNaOrdem()).toEqual(["Filtro de óleo", "Pastilha de freio", "Vela de ignição"]);
    expect(screen.getByRole("columnheader", { name: /classificação/i })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("filtra a tabela por classificação", async () => {
    const usuario = userEvent.setup();
    renderizarPagina();

    await waitFor(() => expect(screen.getByText("Filtro de óleo")).toBeInTheDocument());

    await usuario.selectOptions(screen.getByLabelText(/classificação/i), "Prioridade Alta");

    const linhas = screen.getAllByRole("row");
    expect(linhas).toHaveLength(2); // 1 cabeçalho + 1 produto de prioridade alta
    expect(within(linhas[1]).getByText("Filtro de óleo")).toBeInTheDocument();
    expect(screen.queryByText("Pastilha de freio")).not.toBeInTheDocument();
    expect(screen.queryByText("Vela de ignição")).not.toBeInTheDocument();
  });

  it.each([
    ["Prejuízo", 100, 90, /o preço está R\$\s10,00 abaixo do custo/],
    ["Sem margem", 430.04, 469, /faltam R\$\s4,04 para atingir o preço mínimo de R\$\s473,04/],
    ["No limite", 22.69, 24.96, /qualquer desconto deixa o preço abaixo da margem de 10%/],
  ])("explica o desconto zero com o selo %s", async (rotulo, custo, preco, mensagem) => {
    const linha = criarLinha("AP-4", "Radiador", "Prioridade Alta", custo);
    linha.preco_venda_unitario = preco;
    linha.resultados_analise.desconto_maximo_percentual = 0;
    linha.resultados_analise.desconto_maximo_valor = 0;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [linha] }));

    renderizarPagina();

    await waitFor(() => expect(screen.getByText(rotulo)).toBeInTheDocument());

    expect(screen.getByText(mensagem)).toBeInTheDocument();
    expect(screen.queryByText("0,00%")).not.toBeInTheDocument();
  });

  function criarLinhaSemDesconto(codigo: string, custo: number, preco: number) {
    const linha = criarLinha(codigo, `Produto ${codigo}`, "Prioridade Alta", custo);
    linha.preco_venda_unitario = preco;
    linha.resultados_analise.desconto_maximo_percentual = 0;
    linha.resultados_analise.desconto_maximo_valor = 0;
    return linha;
  }

  it("resume no indicador os produtos sem desconto, ignorando os filtros", async () => {
    const usuario = userEvent.setup();
    const dados = [
      ...DADOS_MOCK,
      criarLinhaSemDesconto("AP-4", 100, 90),
      criarLinhaSemDesconto("AP-5", 430.04, 469),
      criarLinhaSemDesconto("AP-6", 430.04, 470),
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => dados }));

    renderizarPagina();

    const aviso = await screen.findByRole("status");
    const texto = /^3 sem desconto Sem espaço para desconto: 1 com prejuízo e 2 sem margem\./;
    expect(aviso).toHaveTextContent(texto);

    await usuario.selectOptions(screen.getByLabelText(/classificação/i), "Prioridade Baixa");
    expect(screen.getByRole("status")).toHaveTextContent(texto);
  });

  it("não mostra o indicador quando todos os produtos permitem desconto", async () => {
    renderizarPagina();

    await waitFor(() => expect(screen.getByText("Filtro de óleo")).toBeInTheDocument());

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("exporta a coluna Observação preenchida só nos produtos sem desconto", async () => {
    const usuario = userEvent.setup();
    const dados = [DADOS_MOCK[0], criarLinhaSemDesconto("AP-4", 430.04, 469)];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => dados }));

    renderizarPagina();

    await usuario.click(await screen.findByRole("button", { name: /exportar excel/i }));

    const [, cabecalho, linhas] = vi.mocked(exportarCsv).mock.lastCall!;
    expect(cabecalho.at(-1)).toBe("Observação");
    expect(linhas[0].at(-1)).toBe("");
    expect(linhas[1].at(-1)).toMatch(/faltam R\$\s4,04 para atingir o preço mínimo de R\$\s473,04/);
  });

  it("mostra o total geral ao lado do título e o total filtrado no rodapé", async () => {
    const usuario = userEvent.setup();
    renderizarPagina();

    await waitFor(() => expect(screen.getByText("Filtro de óleo")).toBeInTheDocument());
    const cabecalho = screen.getByRole("banner");
    expect(await within(cabecalho).findByText("3 produtos")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1 a 3 de 3 produtos")).toBeInTheDocument();

    await usuario.selectOptions(screen.getByLabelText(/classificação/i), "Prioridade Alta");

    expect(await within(cabecalho).findByText("3 produtos")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1 a 1 de 1 (filtrado de 3 produtos)")).toBeInTheDocument();
  });

  it("navega pelas páginas usando os números da paginação", async () => {
    const usuario = userEvent.setup();
    const dados = Array.from({ length: 12 }, (_, i) =>
      criarLinha(`AP-${i + 1}`, `Produto ${i + 1}`, "Prioridade Baixa", 10 + i),
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => dados }));
    renderizarPagina();

    await waitFor(() => expect(screen.getByText("Produto 1")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Página 1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();

    await usuario.click(screen.getByRole("button", { name: "Página 2" }));

    expect(screen.getByText("Produto 11")).toBeInTheDocument();
    expect(screen.queryByText("Produto 1")).not.toBeInTheDocument();
    expect(screen.getByText("Mostrando 11 a 12 de 12 produtos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeDisabled();
  });

  it("aplica o filtro de classificação vindo do endereço", async () => {
    render(
      <MemoryRouter initialEntries={["/produtos?classificacao=media"]}>
        <AppLayout>
          <ProdutosPage />
        </AppLayout>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Pastilha de freio")).toBeInTheDocument());
    expect(screen.queryByText("Filtro de óleo")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/classificação/i)).toHaveValue("Prioridade Média");
  });
});
