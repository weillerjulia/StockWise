import { UploadCloud } from "lucide-react";
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
    <section className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-800">Importar estoque</h1>
      <p className="mt-1 text-sm text-slate-500">
        Envie o CSV exportado do ERP para calcular custo gerencial, giro e desconto máximo por produto.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5"
      >
        <UploadCloud className="text-slate-400" size={22} />
        <div className="flex-1">
          <label htmlFor="arquivo-csv" className="block text-sm font-medium text-slate-700">
            Arquivo CSV do ERP
          </label>
          <input
            id="arquivo-csv"
            type="file"
            accept=".csv"
            onChange={(evento) => setArquivo(evento.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
        </div>
        <button
          type="submit"
          disabled={!arquivo || estado.status === "enviando"}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {estado.status === "enviando" ? "Importando..." : "Importar"}
        </button>
      </form>

      {estado.status === "erro" && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {estado.mensagem}
        </p>
      )}

      {estado.status === "concluido" && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">Resumo da importação</h2>
          <ul className="mt-3 grid grid-cols-3 gap-4">
            <li>
              <p className="text-xs uppercase tracking-wide text-slate-500">Total de linhas</p>
              <p className="text-xl font-semibold text-slate-800">{estado.resposta.total_linhas}</p>
            </li>
            <li>
              <p className="text-xs uppercase tracking-wide text-slate-500">Importadas</p>
              <p className="text-xl font-semibold text-green-600">{estado.resposta.linhas_importadas}</p>
            </li>
            <li>
              <p className="text-xs uppercase tracking-wide text-slate-500">Com erro</p>
              <p className="text-xl font-semibold text-red-600">{estado.resposta.linhas_com_erro}</p>
            </li>
          </ul>

          {estado.resposta.erros.length > 0 && (
            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="pb-2">Linha</th>
                  <th className="pb-2">Erro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {estado.resposta.erros.map((erro) => (
                  <tr key={erro.linha}>
                    <td className="py-2 pr-4 text-slate-600">{erro.linha}</td>
                    <td className="py-2 text-slate-600">{erro.mensagem}</td>
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
