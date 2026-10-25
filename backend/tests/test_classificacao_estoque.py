from decimal import Decimal

from app.services.classificacao_estoque import ItemParaClassificar, classificar_lote


def test_lote_com_tres_niveis_distintos_de_prioridade():
    itens = [
        ItemParaClassificar(  # menor custo, maior giro, menor razão de estoque
            custo_gerencial_composto=Decimal("10"),
            giro_90d=Decimal("20"),
            quantidade_estoque_atual=5,
            estoque_minimo=10,
        ),
        ItemParaClassificar(  # valores intermediários nos 3 eixos
            custo_gerencial_composto=Decimal("50"),
            giro_90d=Decimal("10"),
            quantidade_estoque_atual=10,
            estoque_minimo=10,
        ),
        ItemParaClassificar(  # maior custo, menor giro, maior razão de estoque
            custo_gerencial_composto=Decimal("100"),
            giro_90d=Decimal("1"),
            quantidade_estoque_atual=30,
            estoque_minimo=10,
        ),
    ]

    resultados = classificar_lote(itens)

    assert resultados[0].score_prioridade == Decimal("0.0000")
    assert resultados[0].classificacao == "Prioridade Baixa"

    assert resultados[1].score_prioridade == Decimal("0.5000")
    assert resultados[1].classificacao == "Prioridade Média"

    assert resultados[2].score_prioridade == Decimal("1.0000")
    assert resultados[2].classificacao == "Prioridade Alta"


def test_estoque_tem_peso_menor_que_custo_e_giro():
    # produto caro e parado, mas com a menor razão de estoque do lote: com pesos
    # iguais o estoque baixo puxaria o score para 0,6667 (Média); com 40/40/20
    # custo e giro prevalecem e ele fica em Prioridade Alta.
    itens = [
        ItemParaClassificar(  # caro, parado, pouco estoque relativo ao mínimo
            custo_gerencial_composto=Decimal("900"),
            giro_90d=Decimal("0"),
            quantidade_estoque_atual=3,
            estoque_minimo=2,
        ),
        ItemParaClassificar(
            custo_gerencial_composto=Decimal("150"),
            giro_90d=Decimal("2"),
            quantidade_estoque_atual=10,
            estoque_minimo=4,
        ),
        ItemParaClassificar(  # barato, gira bem, muito estoque relativo ao mínimo
            custo_gerencial_composto=Decimal("20"),
            giro_90d=Decimal("6"),
            quantidade_estoque_atual=120,
            estoque_minimo=30,
        ),
    ]

    resultados = classificar_lote(itens)

    assert resultados[0].score_prioridade == Decimal("0.8000")
    assert resultados[0].classificacao == "Prioridade Alta"

    assert resultados[1].score_prioridade == Decimal("0.5000")
    assert resultados[1].classificacao == "Prioridade Média"

    assert resultados[2].score_prioridade == Decimal("0.2000")
    assert resultados[2].classificacao == "Prioridade Baixa"


def test_lote_com_um_unico_item_recebe_score_neutro():
    itens = [
        ItemParaClassificar(
            custo_gerencial_composto=Decimal("42"),
            giro_90d=Decimal("5"),
            quantidade_estoque_atual=10,
            estoque_minimo=5,
        )
    ]

    resultados = classificar_lote(itens)

    assert resultados[0].score_prioridade == Decimal("0.5000")
    assert resultados[0].classificacao == "Prioridade Média"


def test_giro_none_nao_gera_erro_e_produz_score_valido():
    # quando quantidade_estoque_atual = 0, giro_90d vem None (indefinido) mas a
    # razão estoque_atual/estoque_minimo também cai para 0 — os dois efeitos se
    # cancelam no score, o que é o comportamento correto: um produto zerado não
    # deveria ser priorizado pra desconto, já que não há excesso pra promover.
    itens = [
        ItemParaClassificar(
            custo_gerencial_composto=Decimal("10"),
            giro_90d=Decimal("15"),
            quantidade_estoque_atual=5,
            estoque_minimo=10,
        ),
        ItemParaClassificar(
            custo_gerencial_composto=Decimal("10"),
            giro_90d=None,
            quantidade_estoque_atual=0,
            estoque_minimo=10,
        ),
    ]

    resultados = classificar_lote(itens)

    assert len(resultados) == 2
    for resultado in resultados:
        assert Decimal("0") <= resultado.score_prioridade <= Decimal("1")
        assert resultado.classificacao in ("Prioridade Alta", "Prioridade Média", "Prioridade Baixa")


def test_estoque_minimo_zero_usa_quantidade_absoluta_como_fallback():
    itens = [
        ItemParaClassificar(
            custo_gerencial_composto=Decimal("10"),
            giro_90d=Decimal("5"),
            quantidade_estoque_atual=1,
            estoque_minimo=0,
        ),
        ItemParaClassificar(
            custo_gerencial_composto=Decimal("10"),
            giro_90d=Decimal("5"),
            quantidade_estoque_atual=100,
            estoque_minimo=0,
        ),
    ]

    resultados = classificar_lote(itens)

    assert resultados[1].score_prioridade > resultados[0].score_prioridade


def test_lote_vazio_retorna_lista_vazia():
    assert classificar_lote([]) == []
