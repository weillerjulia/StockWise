function escaparCampoCsv(valor: string): string {
  if (valor.includes(";") || valor.includes('"') || valor.includes("\n")) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function exportarCsv(nomeArquivo: string, cabecalho: string[], linhas: string[][]): void {
  const conteudo = [cabecalho, ...linhas]
    .map((linha) => linha.map(escaparCampoCsv).join(";"))
    .join("\r\n");

  // BOM garante que o Excel abra como UTF-8 em vez de interpretar acentos
  // como CP1252 e gerar caracteres corrompidos (mesmo problema de encoding
  // que já enfrentamos na importação, mas na direção contrária).
  const BOM = String.fromCharCode(0xfeff);
  const blob = new Blob([BOM + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();

  URL.revokeObjectURL(url);
}
