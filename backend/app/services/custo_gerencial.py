from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

DIAS_POR_MES = Decimal("30")
DIAS_POR_ANO = Decimal("365")
CEM = Decimal("100")
DUAS_CASAS = Decimal("0.01")


@dataclass
class ResultadoCustoGerencial:
    dias_em_estoque: int
    custo_armazenagem_calculado: Decimal
    custo_oportunidade_calculado: Decimal
    custo_gerencial_composto: Decimal


def _arredondar(valor: Decimal) -> Decimal:
    return valor.quantize(DUAS_CASAS, rounding=ROUND_HALF_UP)


def calcular_custo_gerencial(
    *,
    custo_aquisicao_unitario: Decimal,
    custo_armazenagem_percentual_mensal: Decimal,
    taxa_custo_oportunidade_anual: Decimal,
    data_entrada_estoque: date,
    data_referencia: date,
) -> ResultadoCustoGerencial:
    """Custo gerencial composto = custo de aquisição + custo de armazenagem
    acumulado + custo de oportunidade do capital imobilizado, proporcionais
    ao tempo (em dias) que o produto permaneceu em estoque até a data de
    referência (a data em que a importação foi processada).
    """
    dias_em_estoque = max((data_referencia - data_entrada_estoque).days, 0)
    dias = Decimal(dias_em_estoque)

    custo_armazenagem_calculado = _arredondar(
        custo_aquisicao_unitario * (custo_armazenagem_percentual_mensal / CEM) * (dias / DIAS_POR_MES)
    )

    custo_oportunidade_calculado = _arredondar(
        custo_aquisicao_unitario * (taxa_custo_oportunidade_anual / CEM) * (dias / DIAS_POR_ANO)
    )

    custo_gerencial_composto = _arredondar(
        custo_aquisicao_unitario + custo_armazenagem_calculado + custo_oportunidade_calculado
    )

    return ResultadoCustoGerencial(
        dias_em_estoque=dias_em_estoque,
        custo_armazenagem_calculado=custo_armazenagem_calculado,
        custo_oportunidade_calculado=custo_oportunidade_calculado,
        custo_gerencial_composto=custo_gerencial_composto,
    )
