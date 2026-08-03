from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

MARGEM_MINIMA_PERCENTUAL_PADRAO = Decimal("10")
CEM = Decimal("100")
DUAS_CASAS = Decimal("0.01")


@dataclass
class ResultadoDesconto:
    desconto_maximo_percentual: Decimal | None
    desconto_maximo_valor: Decimal | None


def _arredondar(valor: Decimal) -> Decimal:
    return valor.quantize(DUAS_CASAS, rounding=ROUND_HALF_UP)


def calcular_desconto_maximo(
    *,
    custo_gerencial_composto: Decimal,
    preco_venda_unitario: Decimal | None,
    margem_minima_percentual: Decimal = MARGEM_MINIMA_PERCENTUAL_PADRAO,
) -> ResultadoDesconto:
    """Desconto máximo = o quanto dá pra abaixar o preço de venda sem que o
    preço final fique abaixo do custo gerencial composto mais uma margem
    mínima de segurança. Sem preço de venda cadastrado não há como calcular
    desconto (retorna None). Se o produto já vende no prejuízo (ou abaixo da
    margem mínima), o desconto máximo é zero — não existe headroom negativo.
    """
    if preco_venda_unitario is None:
        return ResultadoDesconto(desconto_maximo_percentual=None, desconto_maximo_valor=None)

    preco_minimo = _arredondar(custo_gerencial_composto * (Decimal("1") + margem_minima_percentual / CEM))
    desconto_maximo_valor = preco_venda_unitario - preco_minimo

    if desconto_maximo_valor <= 0:
        return ResultadoDesconto(
            desconto_maximo_percentual=Decimal("0.00"),
            desconto_maximo_valor=Decimal("0.00"),
        )

    desconto_maximo_valor = _arredondar(desconto_maximo_valor)
    desconto_maximo_percentual = _arredondar(desconto_maximo_valor / preco_venda_unitario * CEM)

    return ResultadoDesconto(
        desconto_maximo_percentual=desconto_maximo_percentual,
        desconto_maximo_valor=desconto_maximo_valor,
    )
