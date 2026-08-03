from decimal import Decimal

from app.services.desconto_maximo import calcular_desconto_maximo


def test_produto_com_margem_ampla_permite_desconto_proporcional():
    resultado = calcular_desconto_maximo(
        custo_gerencial_composto=Decimal("100.00"),
        preco_venda_unitario=Decimal("200.00"),
        margem_minima_percentual=Decimal("10"),
    )

    # preco_minimo = 100 * 1.10 = 110; desconto = 200 - 110 = 90
    assert resultado.desconto_maximo_valor == Decimal("90.00")
    assert resultado.desconto_maximo_percentual == Decimal("45.00")


def test_produto_sem_preco_de_venda_retorna_none():
    resultado = calcular_desconto_maximo(
        custo_gerencial_composto=Decimal("50.00"),
        preco_venda_unitario=None,
    )

    assert resultado.desconto_maximo_valor is None
    assert resultado.desconto_maximo_percentual is None


def test_produto_ja_vendido_no_prejuizo_tem_desconto_maximo_zero():
    resultado = calcular_desconto_maximo(
        custo_gerencial_composto=Decimal("100.00"),
        preco_venda_unitario=Decimal("80.00"),
    )

    assert resultado.desconto_maximo_valor == Decimal("0.00")
    assert resultado.desconto_maximo_percentual == Decimal("0.00")


def test_produto_no_limite_exato_da_margem_minima_tem_desconto_zero():
    # preco_minimo = 100 * 1.10 = 110; preco de venda igual ao mínimo -> sem headroom
    resultado = calcular_desconto_maximo(
        custo_gerencial_composto=Decimal("100.00"),
        preco_venda_unitario=Decimal("110.00"),
    )

    assert resultado.desconto_maximo_valor == Decimal("0.00")
    assert resultado.desconto_maximo_percentual == Decimal("0.00")


def test_margem_minima_customizada_reduz_o_desconto_maximo():
    sem_margem = calcular_desconto_maximo(
        custo_gerencial_composto=Decimal("100.00"),
        preco_venda_unitario=Decimal("200.00"),
        margem_minima_percentual=Decimal("0"),
    )
    com_margem_alta = calcular_desconto_maximo(
        custo_gerencial_composto=Decimal("100.00"),
        preco_venda_unitario=Decimal("200.00"),
        margem_minima_percentual=Decimal("30"),
    )

    assert com_margem_alta.desconto_maximo_valor < sem_margem.desconto_maximo_valor
