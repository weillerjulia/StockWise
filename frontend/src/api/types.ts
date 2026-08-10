export interface ErroImportacao {
  linha: number;
  mensagem: string;
}

export interface RespostaUpload {
  id: string;
  nome_arquivo: string;
  status: "concluida" | "concluida_com_erros" | "falhou";
  total_linhas: number;
  linhas_importadas: number;
  linhas_com_erro: number;
  erros: ErroImportacao[];
}

export interface Produto {
  codigo_produto: string;
  nome_produto: string;
  categoria: string | null;
  fornecedor: string | null;
}

export type Classificacao = "Prioridade Alta" | "Prioridade Média" | "Prioridade Baixa";

export interface ResultadoAnalise {
  custo_gerencial_composto: number;
  giro_30d: number | null;
  giro_90d: number | null;
  giro_180d: number | null;
  classificacao: Classificacao;
  score_prioridade: number;
  desconto_maximo_percentual: number | null;
  desconto_maximo_valor: number | null;
}

export interface ResultadoImportacaoLinha {
  id: string;
  preco_venda_unitario: number | null;
  produtos: Produto;
  // Relação 1:1 (estoque_snapshot_id é unique em resultados_analise) — o
  // PostgREST embute como objeto único, não como array.
  resultados_analise: ResultadoAnalise | null;
}
