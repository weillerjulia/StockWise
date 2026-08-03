from io import BytesIO

from fastapi.testclient import TestClient

from app.api import importacoes as importacoes_module
from app.main import app

client = TestClient(app)

CSV_VALIDO = (
    "codigo_produto;nome_produto;categoria;fornecedor;data_entrada_estoque;"
    "data_ultima_venda;quantidade_estoque_atual;estoque_minimo;custo_aquisicao_unitario;"
    "preco_venda_unitario;qtd_vendida_30d;qtd_vendida_90d;qtd_vendida_180d;"
    "custo_armazenagem_percentual_mensal;taxa_custo_oportunidade_anual\n"
    "AP-1001;Filtro de óleo motor 1.0/1.6;Motor;Filora Fortaleza Peças;02/10/2025;"
    "28/07/2026;42;15;R$ 18,50;R$ 34,90;22;61;118;1,2;12\n"
    "AP-1002;;Freios;Frenax Distribuição;09/09/2025;20/07/2026;18;10;;R$ 129,90;9;24;47;1,5;12\n"
)


def _upload(monkeypatch, conteudo: str, *, resultados_gravados: list | None = None):
    monkeypatch.setattr(importacoes_module.repo, "criar_importacao", lambda nome: "importacao-1")
    monkeypatch.setattr(importacoes_module.repo, "upsert_produto", lambda linha: "produto-1")
    monkeypatch.setattr(importacoes_module.repo, "inserir_snapshot", lambda *a, **k: "snapshot-1")
    monkeypatch.setattr(importacoes_module.repo, "finalizar_importacao", lambda *a, **k: None)

    def _capturar_resultado(
        snapshot_id, resultado_custo, resultado_giro, resultado_classificacao, resultado_desconto
    ):
        if resultados_gravados is not None:
            resultados_gravados.append(
                (snapshot_id, resultado_custo, resultado_giro, resultado_classificacao, resultado_desconto)
            )

    monkeypatch.setattr(importacoes_module.repo, "inserir_resultado_analise", _capturar_resultado)

    return client.post(
        "/importacoes",
        files={"arquivo": ("estoque.csv", BytesIO(conteudo.encode("utf-8")), "text/csv")},
    )


def test_importar_csv_com_uma_linha_valida_e_uma_invalida(monkeypatch):
    resposta = _upload(monkeypatch, CSV_VALIDO)

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["id"] == "importacao-1"
    assert corpo["status"] == "concluida_com_erros"
    assert corpo["total_linhas"] == 2
    assert corpo["linhas_importadas"] == 1
    assert corpo["linhas_com_erro"] == 1
    assert corpo["erros"][0]["linha"] == 3


def test_importar_csv_totalmente_valido_retorna_status_concluida(monkeypatch):
    linha_unica = (
        "codigo_produto;nome_produto;categoria;fornecedor;data_entrada_estoque;"
        "data_ultima_venda;quantidade_estoque_atual;estoque_minimo;custo_aquisicao_unitario;"
        "preco_venda_unitario;qtd_vendida_30d;qtd_vendida_90d;qtd_vendida_180d;"
        "custo_armazenagem_percentual_mensal;taxa_custo_oportunidade_anual\n"
        "AP-1001;Filtro de óleo motor 1.0/1.6;Motor;Filora Fortaleza Peças;02/10/2025;"
        "28/07/2026;42;15;R$ 18,50;R$ 34,90;22;61;118;1,2;12\n"
    )

    resultados_gravados: list = []
    resposta = _upload(monkeypatch, linha_unica, resultados_gravados=resultados_gravados)

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["status"] == "concluida"
    assert corpo["linhas_com_erro"] == 0

    assert len(resultados_gravados) == 1
    snapshot_id, resultado_custo, resultado_giro, resultado_classificacao, resultado_desconto = (
        resultados_gravados[0]
    )
    assert snapshot_id == "snapshot-1"
    assert resultado_custo.custo_gerencial_composto > 0
    assert resultado_giro.giro_30d is not None
    assert resultado_classificacao.classificacao in (
        "Prioridade Alta",
        "Prioridade Média",
        "Prioridade Baixa",
    )
    assert resultado_desconto.desconto_maximo_valor is not None


def test_classificacao_e_relativa_ao_lote_da_importacao(monkeypatch):
    csv_duas_linhas = (
        "codigo_produto;nome_produto;categoria;fornecedor;data_entrada_estoque;"
        "data_ultima_venda;quantidade_estoque_atual;estoque_minimo;custo_aquisicao_unitario;"
        "preco_venda_unitario;qtd_vendida_30d;qtd_vendida_90d;qtd_vendida_180d;"
        "custo_armazenagem_percentual_mensal;taxa_custo_oportunidade_anual\n"
        "AP-2001;Produto Caro Parado;Motor;Fornecedor X;01/01/2025;;100;10;"
        "R$ 500,00;R$ 800,00;0;0;1;1;12\n"
        "AP-2002;Produto Barato Rapido;Motor;Fornecedor X;01/01/2025;;5;10;"
        "R$ 5,00;R$ 10,00;50;150;300;1;12\n"
    )

    resultados_gravados: list = []
    resposta = _upload(monkeypatch, csv_duas_linhas, resultados_gravados=resultados_gravados)

    assert resposta.status_code == 200
    assert len(resultados_gravados) == 2

    _, _, _, classificacao_caro_parado, _ = resultados_gravados[0]
    _, _, _, classificacao_barato_rapido, _ = resultados_gravados[1]

    assert classificacao_caro_parado.classificacao == "Prioridade Alta"
    assert classificacao_barato_rapido.classificacao == "Prioridade Baixa"
    assert classificacao_caro_parado.score_prioridade > classificacao_barato_rapido.score_prioridade


def test_get_resultados_retorna_dados_do_repositorio(monkeypatch):
    dados_fake = [
        {
            "id": "snapshot-1",
            "produtos": {"codigo_produto": "AP-1001"},
            "resultados_analise": {"custo_gerencial_composto": "22.58"},
        }
    ]
    monkeypatch.setattr(
        importacoes_module.repo,
        "listar_resultados_por_importacao",
        lambda importacao_id: dados_fake,
    )

    resposta = client.get("/importacoes/importacao-1/resultados")

    assert resposta.status_code == 200
    assert resposta.json() == dados_fake
