const CHAVE_ULTIMA_IMPORTACAO = "stockwise:ultimaImportacaoId";

export function salvarUltimaImportacaoId(id: string): void {
  localStorage.setItem(CHAVE_ULTIMA_IMPORTACAO, id);
}

export function obterUltimaImportacaoId(): string | null {
  return localStorage.getItem(CHAVE_ULTIMA_IMPORTACAO);
}
