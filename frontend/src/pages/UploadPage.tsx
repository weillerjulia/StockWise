import { useState } from "react";

import { uploadCsv } from "../api/client";
import { salvarUltimaImportacaoId } from "../api/storage";
import type { RespostaUpload } from "../api/types";

type Estado =
  | { status: "ocioso" }
  | { status: "enviando" }
  | { status: "erro"; mensagem: string }
  | { status: "concluido"; resposta: RespostaUpload };

export default function UploadPage() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<Estado>({ status: "ocioso" });

  async function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!arquivo) return;

    setEstado({ status: "enviando" });
    try {
      const resposta = await uploadCsv(arquivo);
      salvarUltimaImportacaoId(resposta.id);
      setEstado({ status: "concluido", resposta });
    } catch (erro) {
      setEstado({ status: "erro", mensagem: (erro as Error).message });
    }
  }

  return (
    <section>
      <h1>Importar estoque</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="arquivo-csv">Arquivo CSV do ERP</label>
        <input
          id="arquivo-csv"
          type="file"
          accept=".csv"
          onChange={(evento) => setArquivo(evento.target.files?.[0] ?? null)}
        />
        <button type="submit" disabled={!arquivo || estado.status === "enviando"}>
          {estado.status === "enviando" ? "Importando..." : "Importar"}
        </button>
      </form>

      {estado.status === "erro" && <p role="alert">{estado.mensagem}</p>}

      {estado.status === "concluido" && (
        <div>
          <h2>Resumo da importação</h2>
          <ul>
            <li>Total de linhas: {estado.resposta.total_linhas}</li>
            <li>Linhas importadas: {estado.resposta.linhas_importadas}</li>
            <li>Linhas com erro: {estado.resposta.linhas_com_erro}</li>
          </ul>

          {estado.resposta.erros.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Linha</th>
                  <th>Erro</th>
                </tr>
              </thead>
              <tbody>
                {estado.resposta.erros.map((erro) => (
                  <tr key={erro.linha}>
                    <td>{erro.linha}</td>
                    <td>{erro.mensagem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
