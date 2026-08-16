import type { Importacao, RespostaUpload, ResultadoImportacaoLinha } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function extrairMensagemErro(resposta: Response, mensagemPadrao: string): Promise<string> {
  try {
    const corpo = await resposta.json();
    return typeof corpo?.detail === "string" ? corpo.detail : mensagemPadrao;
  } catch {
    return mensagemPadrao;
  }
}

export async function uploadCsv(arquivo: File): Promise<RespostaUpload> {
  const formData = new FormData();
  formData.append("arquivo", arquivo);

  const resposta = await fetch(`${API_BASE_URL}/importacoes`, {
    method: "POST",
    body: formData,
  });

  if (!resposta.ok) {
    throw new Error(await extrairMensagemErro(resposta, "Falha ao importar o arquivo."));
  }

  return resposta.json();
}

export async function getResultadosImportacao(
  importacaoId: string,
): Promise<ResultadoImportacaoLinha[]> {
  const resposta = await fetch(`${API_BASE_URL}/importacoes/${importacaoId}/resultados`);

  if (!resposta.ok) {
    throw new Error(await extrairMensagemErro(resposta, "Falha ao buscar os resultados da importação."));
  }

  return resposta.json();
}

export async function getImportacao(importacaoId: string): Promise<Importacao> {
  const resposta = await fetch(`${API_BASE_URL}/importacoes/${importacaoId}`);

  if (!resposta.ok) {
    throw new Error(await extrairMensagemErro(resposta, "Falha ao buscar a importação."));
  }

  return resposta.json();
}
