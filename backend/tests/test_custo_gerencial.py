from datetime import date
from decimal import Decimal

from app.services.custo_gerencial import calcular_custo_gerencial


def test_trinta_dias_em_estoque():
    resultado = calcular_custo_gerencial(
        custo_aquisicao_unitario=Decimal("100.00"),
        custo_armazenagem_percentual_mensal=Decimal("1"),
        taxa_custo_oportunidade_anual=Decimal("12"),
        data_entrada_estoque=date(2026, 1, 1),
        data_referencia=date(2026, 1, 31),
    )

    assert resultado.dias_em_estoque == 30
    assert resultado.custo_armazenagem_calculado == Decimal("1.00")
    assert resultado.custo_oportunidade_calculado == Decimal("0.99")
    assert resultado.custo_gerencial_composto == Decimal("101.99")


def test_trezentos_e_sessenta_e_cinco_dias_em_estoque():
    resultado = calcular_custo_gerencial(
        custo_aquisicao_unitario=Decimal("100.00"),
        custo_armazenagem_percentual_mensal=Decimal("1"),
        taxa_custo_oportunidade_anual=Decimal("12"),
        data_entrada_estoque=date(2025, 1, 1),
        data_referencia=date(2026, 1, 1),
    )

    assert resultado.dias_em_estoque == 365
    assert resultado.custo_oportunidade_calculado == Decimal("12.00")
    assert resultado.custo_armazenagem_calculado == Decimal("12.17")
    assert resultado.custo_gerencial_composto == Decimal("124.17")


def test_zero_dias_em_estoque_nao_acumula_custo_extra():
    resultado = calcular_custo_gerencial(
        custo_aquisicao_unitario=Decimal("50.00"),
        custo_armazenagem_percentual_mensal=Decimal("2"),
        taxa_custo_oportunidade_anual=Decimal("12"),
        data_entrada_estoque=date(2026, 5, 1),
        data_referencia=date(2026, 5, 1),
    )

    assert resultado.dias_em_estoque == 0
    assert resultado.custo_armazenagem_calculado == Decimal("0.00")
    assert resultado.custo_oportunidade_calculado == Decimal("0.00")
    assert resultado.custo_gerencial_composto == Decimal("50.00")


def test_data_entrada_no_futuro_nao_gera_dias_negativos():
    resultado = calcular_custo_gerencial(
        custo_aquisicao_unitario=Decimal("50.00"),
        custo_armazenagem_percentual_mensal=Decimal("2"),
        taxa_custo_oportunidade_anual=Decimal("12"),
        data_entrada_estoque=date(2026, 6, 1),
        data_referencia=date(2026, 5, 1),
    )

    assert resultado.dias_em_estoque == 0
    assert resultado.custo_gerencial_composto == Decimal("50.00")
