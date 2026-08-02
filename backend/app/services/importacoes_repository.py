from __future__ import annotations

from datetime import datetime, timezone

from app.db.supabase_client import get_supabase_client
from app.services.classificacao_estoque import ResultadoClassificacao
from app.services.csv_import import LinhaImportada
from app.services.custo_gerencial import ResultadoCustoGerencial
from app.services.giro_estoque import ResultadoGiro


def criar_importacao(nome_arquivo: str) -> str:
    cliente = get_supabase_client()
    resposta = (
        cliente.table("importacoes")
        .insert({"nome_arquivo": nome_arquivo, "status": "processando"})
        .execute()
    )
    return resposta.data[0]["id"]


def upsert_produto(linha: LinhaImportada) -> str:
    cliente = get_supabase_client()
    resposta = (
        cliente.table("produtos")
        .upsert(
            {
                "codigo_produto": linha.codigo_produto,
                "nome_produto": linha.nome_produto,
                "categoria": linha.categoria,
                "fornecedor": linha.fornecedor,
                "atualizado_em": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="codigo_produto",
        )
        .execute()
    )
    return resposta.data[0]["id"]


def inserir_snapshot(importacao_id: str, produto_id: str, linha: LinhaImportada) -> str:
    cliente = get_supabase_client()
    resposta = (
        cliente.table("estoque_snapshots")
        .insert(
            {
                "importacao_id": importacao_id,
                "produto_id": produto_id,
                "data_entrada_estoque": linha.data_entrada_estoque.isoformat(),
                "data_ultima_venda": (
                    linha.data_ultima_venda.isoformat() if linha.data_ultima_venda else None
                ),
                "quantidade_estoque_atual": linha.quantidade_estoque_atual,
                "estoque_minimo": linha.estoque_minimo,
                "custo_aquisicao_unitario": str(linha.custo_aquisicao_unitario),
                "preco_venda_unitario": (
                    str(linha.preco_venda_unitario) if linha.preco_venda_unitario is not None else None
                ),
                "qtd_vendida_30d": linha.qtd_vendida_30d,
                "qtd_vendida_90d": linha.qtd_vendida_90d,
                "qtd_vendida_180d": linha.qtd_vendida_180d,
                "custo_armazenagem_percentual_mensal": str(linha.custo_armazenagem_percentual_mensal),
                "taxa_custo_oportunidade_anual": str(linha.taxa_custo_oportunidade_anual),
            }
        )
        .execute()
    )
    return resposta.data[0]["id"]


def inserir_resultado_analise(
    estoque_snapshot_id: str,
    resultado_custo: ResultadoCustoGerencial,
    resultado_giro: ResultadoGiro,
    resultado_classificacao: ResultadoClassificacao,
) -> None:
    cliente = get_supabase_client()
    cliente.table("resultados_analise").insert(
        {
            "estoque_snapshot_id": estoque_snapshot_id,
            "dias_em_estoque": resultado_custo.dias_em_estoque,
            "custo_armazenagem_calculado": str(resultado_custo.custo_armazenagem_calculado),
            "custo_oportunidade_calculado": str(resultado_custo.custo_oportunidade_calculado),
            "custo_gerencial_composto": str(resultado_custo.custo_gerencial_composto),
            "giro_30d": str(resultado_giro.giro_30d) if resultado_giro.giro_30d is not None else None,
            "giro_90d": str(resultado_giro.giro_90d) if resultado_giro.giro_90d is not None else None,
            "giro_180d": (
                str(resultado_giro.giro_180d) if resultado_giro.giro_180d is not None else None
            ),
            "classificacao": resultado_classificacao.classificacao,
            "score_prioridade": str(resultado_classificacao.score_prioridade),
        }
    ).execute()


def listar_resultados_por_importacao(importacao_id: str) -> list[dict[str, object]]:
    cliente = get_supabase_client()
    resposta = (
        cliente.table("estoque_snapshots")
        .select("*, produtos(*), resultados_analise(*)")
        .eq("importacao_id", importacao_id)
        .execute()
    )
    return resposta.data


def finalizar_importacao(
    importacao_id: str,
    *,
    total_linhas: int,
    linhas_importadas: int,
    erros: list[dict[str, object]],
) -> None:
    cliente = get_supabase_client()
    status = "concluida" if not erros else "concluida_com_erros"
    cliente.table("importacoes").update(
        {
            "status": status,
            "total_linhas": total_linhas,
            "linhas_importadas": linhas_importadas,
            "linhas_com_erro": len(erros),
            "erros": erros,
            "concluida_em": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", importacao_id).execute()


def marcar_importacao_falhou(importacao_id: str, mensagem: str) -> None:
    cliente = get_supabase_client()
    cliente.table("importacoes").update(
        {
            "status": "falhou",
            "erros": [{"linha": 0, "mensagem": mensagem}],
            "concluida_em": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", importacao_id).execute()
