import { UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";

import { getImportacao, uploadCsv } from "../api/client";
import { obterUltimaImportacaoId, salvarUltimaImportacaoId } from "../api/storage";
import type { Importacao, RespostaUpload } from "../api/types";
import { formatarDataHora } from "../utils/format";

type Estado =
  | { status: "ocioso" }
  | { status: "enviando" }
  | { status: "erro"; mensagem: string }
  | { status: "concluido"; resposta: RespostaUpload };

type EstadoUltimaImportacao =
  | { status: "carregando" }
  | { status: "nenhuma" }
  | { status: "erro"; mensagem: string }
  | { status: "sucesso"; importacao: Importacao };

const COLUNAS_ESPERADAS = [
  "codigo_produto",
  "nome_produto",
  "categoria",
  "fornecedor",
  "data_entrada_estoque",
  "data_ultima_venda",
  "quantidade_estoque_atual",
  "estoque_minimo",
  "custo_aquisicao_unitario",
  "preco_venda_unitario",
  "qtd_vendida_30d",
  "qtd_vendida_90d",
  "qtd_vendida_180d",
  "custo_armazenagem_percentual_mensal",
  "taxa_custo_oportunidade_anual",
];

const LABEL_STATUS: Record<Importacao["status"], string> = {
  processando: "Processando",
  concluida: "Concluída",
  concluida_com_erros: "Concluída com erros",
  falhou: "Falhou",
};

const COR_STATUS: Record<Importacao["status"], string> = {
  processando: "bg-slate-100 text-slate-700",
  concluida: "bg-green-100 text-green-700",
  concluida_com_erros: "bg-amber-100 text-amber-700",
  falhou: "bg-red-100 text-red-700",
};

export default function UploadPage() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<Estado>({ status: "ocioso" });
  const [ultimaImportacao, setUltimaImportacao] = useState<EstadoUltimaImportacao>({
    status: "carregando",
  });

  async function carregarUltimaImportacao() {
    const id = obterUltimaImportacaoId();
    if (!id) {
      setUltimaImportacao({ status: "nenhuma" });
      return;
    }

    setUltimaImportacao({ status: "carregando" });
    try {
      const importacao = await getImportacao(id);
      setUltimaImportacao({ status: "sucesso", importacao });
    } catch (erro) {
      setUltimaImportacao({ status: "erro", mensagem: (erro as Error).message });
    }
  }

  useEffect(() => {
    carregarUltimaImportacao();
  }, []);

  async function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!arquivo) return;

    setEstado({ status: "enviando" });
    try {
      const resposta = await uploadCsv(arquivo);
      salvarUltimaImportacaoId(resposta.id);
      setEstado({ status: "concluido", resposta });
      await carregarUltimaImportacao();
    } catch (erro) {
      setEstado({ status: "erro", mensagem: (erro as Error).message });
    }
  }

  return (
    <section className="mx-auto max-w-2xl">
      <p className="text-sm text-slate-500">
        Envie o CSV exportado do ERP para calcular custo gerencial, giro e desconto máximo por produto.
      </p>

      <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">
          Ver formato esperado do CSV
        </summary>

        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-700">Delimitador:</span> ponto e vírgula (
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">;</code>)
          </p>
          <p>
            <span className="font-medium text-slate-700">Datas:</span> formato dd/mm/aaaa (ex:
            02/10/2025)
          </p>
          <p>
            <span className="font-medium text-slate-700">Valores monetários:</span> em R$ com vírgula
            decimal (ex: R$ 18,50)
          </p>
          <div>
            <p className="font-medium text-slate-700">Colunas esperadas:</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {COLUNAS_ESPERADAS.map((coluna) => (
                <li key={coluna} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                  {coluna}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </details>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-md"
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
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
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
                  <tr key={erro.linha} className="hover:bg-slate-50">
                    <td className="py-2 pr-4 text-slate-600">{erro.linha}</td>
                    <td className="py-2 text-slate-600">{erro.mensagem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {estado.status !== "concluido" && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
          <h2 className="text-sm font-semibold text-slate-800">Última importação</h2>

          {ultimaImportacao.status === "carregando" && (
            <p className="mt-3 text-sm text-slate-500">Carregando...</p>
          )}

          {ultimaImportacao.status === "nenhuma" && (
            <p className="mt-3 text-sm text-slate-500">Nenhuma importação realizada ainda.</p>
          )}

          {ultimaImportacao.status === "erro" && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {ultimaImportacao.mensagem}
            </p>
          )}

          {ultimaImportacao.status === "sucesso" && (
            <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Data/hora</p>
                <p className="text-sm font-medium text-slate-800">
                  {formatarDataHora(ultimaImportacao.importacao.iniciada_em)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Importadas</p>
                <p className="text-sm font-medium text-slate-800">
                  {ultimaImportacao.importacao.linhas_importadas}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Com erro</p>
                <p className="text-sm font-medium text-slate-800">
                  {ultimaImportacao.importacao.linhas_com_erro}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COR_STATUS[ultimaImportacao.importacao.status]}`}
                >
                  {LABEL_STATUS[ultimaImportacao.importacao.status]}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
