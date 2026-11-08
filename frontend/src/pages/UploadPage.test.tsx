import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { salvarUltimaImportacaoId } from "../api/storage";
import UploadPage from "./UploadPage";

function renderizar() {
  return render(
    <MemoryRouter>
      <UploadPage />
    </MemoryRouter>,
  );
}

describe("UploadPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("envia o CSV selecionado e mostra o resumo da importação, incluindo erros por linha", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "importacao-1",
        nome_arquivo: "estoque.csv",
        status: "concluida_com_erros",
        total_linhas: 2,
        linhas_importadas: 1,
        linhas_com_erro: 1,
        erros: [{ linha: 3, mensagem: "custo_aquisicao_unitario inválido" }],
      }),
    } as Response);

    const usuario = userEvent.setup();
    renderizar();

    const arquivo = new File(["codigo;nome\nAP-1;Filtro"], "estoque.csv", { type: "text/csv" });
    const input = screen.getByLabelText(/arquivo csv/i);
    await usuario.upload(input, arquivo);
    await usuario.click(screen.getByRole("button", { name: /importar/i }));

    await waitFor(() => expect(screen.getByText(/resumo da importação/i)).toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("Importação concluída: 1 linha importada.");
    expect(screen.getByRole("link", { name: /ver visão geral/i })).toHaveAttribute("href", "/dashboard");

    expect(screen.getByText(/total de linhas/i).nextElementSibling).toHaveTextContent("2");
    expect(screen.getByText(/^importadas$/i).nextElementSibling).toHaveTextContent("1");
    expect(screen.getByText(/com erro/i).nextElementSibling).toHaveTextContent("1");
    expect(screen.getByText("custo_aquisicao_unitario inválido")).toBeInTheDocument();
    expect(localStorage.getItem("stockwise:ultimaImportacaoId")).toBe("importacao-1");
  });

  it("mostra mensagem de que não há importação quando nunca houve upload", async () => {
    renderizar();

    await waitFor(() =>
      expect(screen.getByText(/nenhuma importação realizada ainda/i)).toBeInTheDocument(),
    );
  });

  it("mostra o resumo da última importação salva ao carregar a página", async () => {
    salvarUltimaImportacaoId("importacao-2");
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "importacao-2",
        nome_arquivo: "estoque.csv",
        status: "concluida",
        total_linhas: 3,
        linhas_importadas: 3,
        linhas_com_erro: 0,
        iniciada_em: "2026-08-16T10:00:00+00:00",
        concluida_em: "2026-08-16T10:00:05+00:00",
      }),
    } as Response);

    renderizar();

    await waitFor(() => expect(screen.getByText("Concluída")).toBeInTheDocument());
    expect(screen.getByText(/^última importação$/i)).toBeInTheDocument();
  });

  it("mostra o arquivo escolhido com opção de remover antes de importar", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404, json: async () => ({}) } as Response);
    const usuario = userEvent.setup();
    renderizar();

    expect(screen.queryByRole("button", { name: /importar/i })).not.toBeInTheDocument();

    const arquivo = new File(["codigo;nome\nAP-1;Filtro"], "estoque.csv", { type: "text/csv" });
    await usuario.upload(screen.getByLabelText(/arquivo csv/i), arquivo);

    expect(screen.getByText("estoque.csv")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /importar arquivo/i })).toBeEnabled();

    await usuario.click(screen.getByRole("button", { name: /remover arquivo/i }));
    expect(screen.queryByText("estoque.csv")).not.toBeInTheDocument();
    expect(screen.getByText("Arraste o arquivo aqui ou clique para escolher")).toBeInTheDocument();
  });
});
