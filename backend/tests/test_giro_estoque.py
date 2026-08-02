from decimal import Decimal

from app.services.giro_estoque import calcular_giro


def test_giro_anualizado_nas_tres_janelas():
    resultado = calcular_giro(
        quantidade_estoque_atual=10,
        qtd_vendida_30d=10,
        qtd_vendida_90d=20,
        qtd_vendida_180d=30,
    )

    assert resultado.giro_30d == Decimal("12.1667")
    assert resultado.giro_90d == Decimal("8.1111")
    assert resultado.giro_180d == Decimal("6.0833")


def test_estoque_atual_zero_retorna_giro_indefinido():
    resultado = calcular_giro(
        quantidade_estoque_atual=0,
        qtd_vendida_30d=10,
        qtd_vendida_90d=20,
        qtd_vendida_180d=30,
    )

    assert resultado.giro_30d is None
    assert resultado.giro_90d is None
    assert resultado.giro_180d is None


def test_sem_vendas_no_periodo_giro_e_zero_nao_indefinido():
    resultado = calcular_giro(
        quantidade_estoque_atual=5,
        qtd_vendida_30d=0,
        qtd_vendida_90d=0,
        qtd_vendida_180d=0,
    )

    assert resultado.giro_30d == Decimal("0.0000")
    assert resultado.giro_90d == Decimal("0.0000")
    assert resultado.giro_180d == Decimal("0.0000")
