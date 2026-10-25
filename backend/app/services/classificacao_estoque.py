from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

LIMIAR_PRIORIDADE_ALTA = Decimal("0.67")
LIMIAR_PRIORIDADE_MEDIA = Decimal("0.34")
QUATRO_CASAS = Decimal("0.0001")

# Custo e giro são as dimensões principais. O nível de estoque entra como
# critério secundário: o giro já mede estoque em relação às vendas, e com peso
# igual a razão estoque/mínimo (que tende a ser menor justamente nas peças
# caras e paradas) anulava as outras duas, jogando quase todo o lote em
# "Prioridade Média" — ver backend/analysis/clustering_kmeans.ipynb.
PESO_CUSTO = Decimal("0.4")
PESO_GIRO = Decimal("0.4")
PESO_ESTOQUE = Decimal("0.2")


@dataclass
class ItemParaClassificar:
    custo_gerencial_composto: Decimal
    giro_90d: Decimal | None
    quantidade_estoque_atual: int
    estoque_minimo: int


@dataclass
class ResultadoClassificacao:
    score_prioridade: Decimal
    classificacao: str


def _razao_estoque(item: ItemParaClassificar) -> Decimal:
    if item.estoque_minimo > 0:
        return Decimal(item.quantidade_estoque_atual) / Decimal(item.estoque_minimo)
    return Decimal(item.quantidade_estoque_atual)


def _rank_normalizado(valores: list[Decimal]) -> list[Decimal]:
    """Rank relativo de cada valor dentro da lista, normalizado entre 0 (menor)
    e 1 (maior). Empates recebem o mesmo rank médio. Lote com 1 item recebe
    rank neutro (0.5) — não há base de comparação.
    """
    n = len(valores)
    if n <= 1:
        return [Decimal("0.5") for _ in valores]

    ordenados = sorted(valores)
    ranks = []
    for valor in valores:
        menores = sum(1 for v in ordenados if v < valor)
        iguais = sum(1 for v in ordenados if v == valor)
        rank_medio = Decimal(menores) + (Decimal(iguais) - 1) / 2
        ranks.append(rank_medio / Decimal(n - 1))
    return ranks


def classificar_lote(itens: list[ItemParaClassificar]) -> list[ResultadoClassificacao]:
    """Classifica os itens de uma mesma importação combinando 3 dimensões:
    custo gerencial, giro (90d) e nível de estoque relativo ao mínimo — cada
    uma convertida em rank relativo (0 a 1) dentro do próprio lote, já que
    "giro alto" ou "custo alto" só têm sentido em comparação com os demais
    produtos importados junto. O score é a média ponderada dos ranks
    (40% custo, 40% giro invertido, 20% estoque).
    """
    if not itens:
        return []

    custos = [item.custo_gerencial_composto for item in itens]
    giros = [item.giro_90d if item.giro_90d is not None else Decimal("0") for item in itens]
    razoes_estoque = [_razao_estoque(item) for item in itens]

    rank_custo = _rank_normalizado(custos)
    rank_giro = _rank_normalizado(giros)
    rank_estoque = _rank_normalizado(razoes_estoque)

    resultados = []
    for i in range(len(itens)):
        score = (
            PESO_CUSTO * rank_custo[i]
            + PESO_GIRO * (Decimal("1") - rank_giro[i])
            + PESO_ESTOQUE * rank_estoque[i]
        )
        score = score.quantize(QUATRO_CASAS, rounding=ROUND_HALF_UP)

        if score >= LIMIAR_PRIORIDADE_ALTA:
            classificacao = "Prioridade Alta"
        elif score >= LIMIAR_PRIORIDADE_MEDIA:
            classificacao = "Prioridade Média"
        else:
            classificacao = "Prioridade Baixa"

        resultados.append(ResultadoClassificacao(score_prioridade=score, classificacao=classificacao))

    return resultados
