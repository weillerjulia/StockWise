from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services import importacoes_repository as repo
from app.services.classificacao_estoque import ItemParaClassificar, classificar_lote
from app.services.csv_import import processar_csv
from app.services.custo_gerencial import calcular_custo_gerencial
from app.services.desconto_maximo import calcular_desconto_maximo
from app.services.giro_estoque import calcular_giro

router = APIRouter(prefix="/importacoes", tags=["importacoes"])


@router.post("")
async def importar_csv(arquivo: UploadFile = File(...)) -> dict[str, object]:
    conteudo = await arquivo.read()

    try:
        resultado = processar_csv(conteudo)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    data_referencia = datetime.now(timezone.utc).date()

    # 1ª etapa: cálculos puros (custo gerencial + giro) para todas as linhas,
    # sem tocar no banco ainda — a classificação (etapa 2) precisa do lote
    # inteiro pra ranquear os produtos entre si.
    processados = []
    for linha in resultado.linhas_validas:
        resultado_custo = calcular_custo_gerencial(
            custo_aquisicao_unitario=linha.custo_aquisicao_unitario,
            custo_armazenagem_percentual_mensal=linha.custo_armazenagem_percentual_mensal,
            taxa_custo_oportunidade_anual=linha.taxa_custo_oportunidade_anual,
            data_entrada_estoque=linha.data_entrada_estoque,
            data_referencia=data_referencia,
        )
        resultado_giro = calcular_giro(
            quantidade_estoque_atual=linha.quantidade_estoque_atual,
            qtd_vendida_30d=linha.qtd_vendida_30d,
            qtd_vendida_90d=linha.qtd_vendida_90d,
            qtd_vendida_180d=linha.qtd_vendida_180d,
        )
        processados.append((linha, resultado_custo, resultado_giro))

    # 2ª etapa: classificação relativa ao lote (rank de custo, giro e nível de estoque)
    itens_para_classificar = [
        ItemParaClassificar(
            custo_gerencial_composto=resultado_custo.custo_gerencial_composto,
            giro_90d=resultado_giro.giro_90d,
            quantidade_estoque_atual=linha.quantidade_estoque_atual,
            estoque_minimo=linha.estoque_minimo,
        )
        for linha, resultado_custo, resultado_giro in processados
    ]
    classificacoes = classificar_lote(itens_para_classificar)

    # 3ª etapa: grava tudo no banco
    importacao_id = repo.criar_importacao(arquivo.filename or "arquivo.csv")

    try:
        for (linha, resultado_custo, resultado_giro), resultado_classificacao in zip(
            processados, classificacoes
        ):
            resultado_desconto = calcular_desconto_maximo(
                custo_gerencial_composto=resultado_custo.custo_gerencial_composto,
                preco_venda_unitario=linha.preco_venda_unitario,
            )
            produto_id = repo.upsert_produto(linha)
            snapshot_id = repo.inserir_snapshot(importacao_id, produto_id, linha)
            repo.inserir_resultado_analise(
                snapshot_id, resultado_custo, resultado_giro, resultado_classificacao, resultado_desconto
            )
    except Exception as exc:
        repo.marcar_importacao_falhou(importacao_id, str(exc))
        raise HTTPException(status_code=500, detail="falha ao gravar importação no banco") from exc

    erros_serializados = [
        {"linha": erro.linha, "mensagem": erro.mensagem} for erro in resultado.erros
    ]
    repo.finalizar_importacao(
        importacao_id,
        total_linhas=resultado.total_linhas,
        linhas_importadas=len(resultado.linhas_validas),
        erros=erros_serializados,
    )

    return {
        "id": importacao_id,
        "nome_arquivo": arquivo.filename,
        "status": "concluida" if not erros_serializados else "concluida_com_erros",
        "total_linhas": resultado.total_linhas,
        "linhas_importadas": len(resultado.linhas_validas),
        "linhas_com_erro": len(erros_serializados),
        "erros": erros_serializados,
    }


@router.get("/{importacao_id}/resultados")
def listar_resultados(importacao_id: str) -> list[dict[str, object]]:
    return repo.listar_resultados_por_importacao(importacao_id)
