import { UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import KpiCard from "../components/KpiCard";
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

// Espelha COLUNAS_OBRIGATORIAS em backend/app/services/csv_import.py — não há
// endpoint que exponha isso, então precisa manter as duas listas em sincronia.
const COLUNAS_OBRIGATORIAS = [
  "codigo_produto",
  "nome_produto",
  "data_entrada_estoque",
  "quantidade_estoque_atual",
  "custo_aquisicao_unitario",
];

const COLUNAS_OPCIONAIS = [
  "categoria",
  "fornecedor",
  "data_ultima_venda",
  "estoque_minimo",
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

const COR_BORDA_STATUS: Record<Importacao["status"], string> = {
  processando: "border-l-slate-300",
  concluida: "border-l-green-400",
  concluida_com_erros: "border-l-amber-400",
  falhou: "border-l-red-400",
};

const COR_TEXTO_STATUS: Record<Importacao["status"], string> = {
  processando: "text-slate-600",
  concluida: "text-green-700",
  concluida_com_erros: "text-amber-700",
  falhou: "text-red-700",
};

export default function UploadPage() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<Estado>({ status: "ocioso" });
  const [arrastando, setArrastando] = useState(false);
  const [ultimaImportacao, setUltimaImportacao] = useState<EstadoUltimaImportacao>({
    status: "carregando",
  });
  const inputRef = useRef<HTMLInputElement>(null);

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
    <section>
      <p className="text-sm text-slate-500">
        Envie o CSV exportado do ERP para calcular custo gerencial, giro e desconto máximo por produto.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
          <h2 className="text-sm font-semibold text-slate-800">Formato esperado do CSV</h2>

          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-700">Delimitador:</span> ponto e vírgula, vírgula
              ou tab (detectado automaticamente)
            </p>
            <p>
              <span className="font-medium text-slate-700">Datas:</span> formato dd/mm/aaaa (ex:
              02/10/2025)
            </p>
            <p>
              <span className="font-medium text-slate-700">Valores monetários:</span> R$ 1.234,56,
              1234,56 ou 1234.56. Valores ambíguos, como 1.234 ou 1,234.50, são recusados.
            </p>
            <div>
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Obrigatórias</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {COLUNAS_OBRIGATORIAS.map((coluna) => (
                  <li
                    key={coluna}
                    className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-xs text-blue-700"
                  >
                    {coluna}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Opcionais</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {COLUNAS_OPCIONAIS.map((coluna) => (
                  <li key={coluna} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                    {coluna}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-md"
        >
          <label htmlFor="arquivo-csv" className="sr-only">
            Arquivo CSV do ERP
          </label>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(evento) => {
              evento.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(evento) => {
              evento.preventDefault();
              setArrastando(false);
              const arquivoSolto = evento.dataTransfer.files?.[0];
              if (arquivoSolto) setArquivo(arquivoSolto);
            }}
            className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
              arrastando ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <UploadCloud className="text-slate-400" size={32} />
            <span className="text-sm font-medium text-slate-700">
              Arraste o arquivo aqui ou clique para escolher
            </span>
            <span className="text-xs text-slate-500">
              {arquivo ? arquivo.name : "Nenhum arquivo selecionado"}
            </span>
            <input
              ref={inputRef}
              id="arquivo-csv"
              type="file"
              accept=".csv"
              onChange={(evento) => setArquivo(evento.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="submit"
              disabled={!arquivo || estado.status === "enviando"}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {estado.status === "enviando" ? "Importando..." : "Importar"}
            </button>
          </div>
        </form>
      </div>

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
        <div className="mt-6">
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
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Data/hora"
                valor={formatarDataHora(ultimaImportacao.importacao.iniciada_em)}
                tamanhoValor="pequeno"
              />
              <KpiCard
                label="Importadas"
                valor={String(ultimaImportacao.importacao.linhas_importadas)}
                tamanhoValor="pequeno"
              />
              <KpiCard
                label="Com erro"
                valor={String(ultimaImportacao.importacao.linhas_com_erro)}
                tamanhoValor="pequeno"
              />
              <KpiCard
                label="Status"
                valor={LABEL_STATUS[ultimaImportacao.importacao.status]}
                corBorda={COR_BORDA_STATUS[ultimaImportacao.importacao.status]}
                corValor={COR_TEXTO_STATUS[ultimaImportacao.importacao.status]}
                tamanhoValor="pequeno"
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
