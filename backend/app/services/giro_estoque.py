from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

DIAS_ANO = Decimal("365")
QUATRO_CASAS = Decimal("0.0001")


@dataclass
class ResultadoGiro:
    giro_30d: Decimal | None
    giro_90d: Decimal | None
    giro_180d: Decimal | None


def _giro_anualizado(qtd_vendida: int, quantidade_estoque_atual: int, dias_janela: int) -> Decimal | None:
    """Giro anualizado = (qtd_vendida / estoque_atual) x (365 / dias_janela).

    Usa quantidade_estoque_atual como proxy do estoque médio (não há série
    histórica de estoque disponível) e anualiza o resultado para que as
    janelas de 30/90/180 dias fiquem na mesma escala e sejam comparáveis
    entre si (detectar aceleração/desaceleração do giro).
    """
    if quantidade_estoque_atual <= 0:
        return None

    giro_no_periodo = Decimal(qtd_vendida) / Decimal(quantidade_estoque_atual)
    giro_anualizado = giro_no_periodo * (DIAS_ANO / Decimal(dias_janela))
    return giro_anualizado.quantize(QUATRO_CASAS, rounding=ROUND_HALF_UP)


def calcular_giro(
    *,
    quantidade_estoque_atual: int,
    qtd_vendida_30d: int,
    qtd_vendida_90d: int,
    qtd_vendida_180d: int,
) -> ResultadoGiro:
    return ResultadoGiro(
        giro_30d=_giro_anualizado(qtd_vendida_30d, quantidade_estoque_atual, 30),
        giro_90d=_giro_anualizado(qtd_vendida_90d, quantidade_estoque_atual, 90),
        giro_180d=_giro_anualizado(qtd_vendida_180d, quantidade_estoque_atual, 180),
    )
