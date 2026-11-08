import { ArrowRight, CheckCircle2, ChevronRight, FileText, UploadCloud, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import HelpTooltip from "../components/HelpTooltip";
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

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export default function UploadPage() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<Estado>({ status: "ocioso" });
  const [arrastando, setArrastando] = useState(false);
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
    void carregarUltimaImportacao();
  }, []);

  function escolherArquivo(novoArquivo: File | null) {
    setArquivo(novoArquivo);
    // Um arquivo novo apaga a mensagem da importação anterior.
    if (estado.status !== "enviando") setEstado({ status: "ocioso" });
  }

  async function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!arquivo) return;

    setEstado({ status: "enviando" });
    try {
      const resposta = await uploadCsv(arquivo);
      salvarUltimaImportacaoId(resposta.id);
      setEstado({ status: "concluido", resposta });
      setArquivo(null);
      await carregarUltimaImportacao();
    } catch (erro) {
      setEstado({ status: "erro", mensagem: (erro as Error).message });
    }
  }

  return (
    <section>
      <form
        onSubmit={handleSubmit}
        onDragOver={(evento) => {
          evento.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(evento) => {
          evento.preventDefault();
          setArrastando(false);
          const arquivoSolto = evento.dataTransfer.files?.[0];
          if (arquivoSolto) escolherArquivo(arquivoSolto);
        }}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md"
      >
        <p className="mb-4 text-sm text-slate-600">
          Envie o CSV exportado do ERP para calcular custo gerencial, giro e desconto máximo por produto.
        </p>

        <input
          id="arquivo-csv"
          type="file"
          accept=".csv"
          aria-label="Arquivo CSV do ERP"
          onChange={(evento) => {
            escolherArquivo(evento.target.files?.[0] ?? null);
            // Permite escolher o mesmo arquivo de novo depois de removê-lo.
            evento.target.value = "";
          }}
          className="sr-only"
        />

        {arquivo ? (
          <div
            className={`flex flex-wrap items-center gap-3 rounded-xl border-2 px-4 py-4 transition-colors ${
              arrastando ? "border-dashed border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50"
            }`}
          >
            <FileText className="shrink-0 text-blue-600" size={28} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800" title={arquivo.name}>
                {arquivo.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatarTamanho(arquivo.size)} ·{" "}
                <label
                  htmlFor="arquivo-csv"
                  className="cursor-pointer font-medium hover:text-slate-800 hover:underline"
                >
                  Escolher outro arquivo
                </label>
              </p>
            </div>
            <button
              type="button"
              onClick={() => escolherArquivo(null)}
              disabled={estado.status === "enviando"}
              aria-label="Remover arquivo"
              className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <button
              type="submit"
              disabled={estado.status === "enviando"}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70 max-sm:w-full"
            >
              <UploadCloud size={18} aria-hidden="true" />
              {estado.status === "enviando" ? "Importando..." : "Importar arquivo"}
            </button>
          </div>
        ) : (
          // Label nativo: o clique abre o seletor de arquivo sem precisar de onClick.
          <label
            htmlFor="arquivo-csv"
            className={`flex cursor-pointer items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-6 transition-colors ${
              arrastando ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
            }`}
          >
            <UploadCloud className="shrink-0 text-slate-400" size={32} aria-hidden="true" />
            <span>
              <span className="block text-sm font-medium text-slate-700">
                Arraste o arquivo aqui ou clique para escolher
              </span>
              <span className="block text-xs text-slate-500">Apenas arquivos .csv</span>
            </span>
          </label>
        )}

        {estado.status === "concluido" && (
          <p
            role="status"
            className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" />
            <span>
              Importação concluída: {estado.resposta.linhas_importadas} linha
              {estado.resposta.linhas_importadas === 1 ? "" : "s"} importada
              {estado.resposta.linhas_importadas === 1 ? "" : "s"}.
            </span>
            <Link
              to="/dashboard"
              className="ml-auto inline-flex items-center gap-1 font-semibold text-green-800 hover:underline"
            >
              Ver Visão geral
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </p>
        )}

        {/* Formato do CSV: regras numa linha; colunas recolhidas para consulta. */}
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span>
            <span className="font-semibold text-slate-700">Separador:</span> ponto e vírgula, vírgula ou tab
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <span className="font-semibold text-slate-700">Datas:</span> dd/mm/aaaa
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <span>
              <span className="font-semibold text-slate-700">Valores:</span> R$ 1.234,56, 1234,56 ou 1234.56
            </span>
            <HelpTooltip texto="Valores ambíguos, como 1.234 ou 1,234.50, são recusados: não dá para saber se o ponto ou a vírgula separa os milhares ou os centavos." />
          </span>
        </p>

        <details className="group mt-3">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-xs font-medium text-blue-700 hover:underline [&::-webkit-details-marker]:hidden">
            <ChevronRight size={14} className="transition-transform group-open:rotate-90" aria-hidden="true" />
            Ver colunas aceitas ({COLUNAS_OBRIGATORIAS.length} obrigatórias, {COLUNAS_OPCIONAIS.length} opcionais)
          </summary>
          <div className="mt-3 space-y-4">
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
        </details>
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
