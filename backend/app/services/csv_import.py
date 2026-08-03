from __future__ import annotations

import csv
import io
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

COLUNAS_OBRIGATORIAS = (
    "codigo_produto",
    "nome_produto",
    "data_entrada_estoque",
    "quantidade_estoque_atual",
    "custo_aquisicao_unitario",
)


@dataclass
class ErroLinha:
    linha: int
    mensagem: str


@dataclass
class LinhaImportada:
    codigo_produto: str
    nome_produto: str
    categoria: str | None
    fornecedor: str | None
    data_entrada_estoque: date
    data_ultima_venda: date | None
    quantidade_estoque_atual: int
    estoque_minimo: int
    custo_aquisicao_unitario: Decimal
    preco_venda_unitario: Decimal | None
    qtd_vendida_30d: int
    qtd_vendida_90d: int
    qtd_vendida_180d: int
    custo_armazenagem_percentual_mensal: Decimal
    taxa_custo_oportunidade_anual: Decimal


@dataclass
class ResultadoProcessamento:
    total_linhas: int = 0
    linhas_validas: list[LinhaImportada] = field(default_factory=list)
    erros: list[ErroLinha] = field(default_factory=list)


def _decodificar(conteudo: bytes) -> str:
    # mac_roman é fallback final porque mapeia todos os 256 valores de byte
    # (nunca levanta UnicodeDecodeError) — precisa vir depois do cp1252 pra
    # não "roubar" arquivos que são cp1252 de verdade.
    for codificacao in ("utf-8-sig", "cp1252", "mac_roman"):
        try:
            return conteudo.decode(codificacao)
        except UnicodeDecodeError:
            continue
    raise ValueError("não foi possível decodificar o arquivo (esperado UTF-8, CP1252 ou Mac Roman)")


def _detectar_delimitador(primeira_linha: str) -> str:
    try:
        return csv.Sniffer().sniff(primeira_linha, delimiters=";,\t").delimiter
    except csv.Error:
        return ";"


def _parse_moeda(valor: str) -> Decimal:
    limpo = valor.strip().replace("R$", "").strip()
    if not limpo:
        raise ValueError("valor monetário vazio")
    # Formato BR ("R$ 1.234,50"): vírgula é o decimal, ponto é separador de
    # milhar. Sem vírgula, assume-se que o ponto (se houver) já é o decimal
    # (formato exportado por planilhas em locale EUA/UK, ex.: "18.5").
    if "," in limpo:
        limpo = limpo.replace(".", "").replace(",", ".")
    return Decimal(limpo)


def _parse_percentual(valor: str) -> Decimal:
    limpo = valor.strip()
    if not limpo:
        return Decimal("0")
    return Decimal(limpo.replace(",", "."))


def _parse_data(valor: str) -> date:
    limpo = valor.strip()
    if not limpo:
        raise ValueError("data vazia")
    try:
        return datetime.strptime(limpo, "%d/%m/%Y").date()
    except ValueError as exc:
        raise ValueError(f"data '{limpo}' fora do formato dd/mm/aaaa") from exc


def _parse_inteiro(valor: str) -> int:
    limpo = valor.strip()
    if not limpo:
        return 0
    return int(limpo.replace(".", ""))


def _texto_opcional(valor: str) -> str | None:
    limpo = valor.strip()
    return limpo or None


def _validar_linha(
    linha_bruta: dict[str, str], numero_linha: int
) -> tuple[LinhaImportada | None, ErroLinha | None]:
    for coluna in COLUNAS_OBRIGATORIAS:
        if not linha_bruta.get(coluna, "").strip():
            return None, ErroLinha(numero_linha, f"campo obrigatório '{coluna}' vazio")

    try:
        linha = LinhaImportada(
            codigo_produto=linha_bruta["codigo_produto"].strip(),
            nome_produto=linha_bruta["nome_produto"].strip(),
            categoria=_texto_opcional(linha_bruta.get("categoria", "")),
            fornecedor=_texto_opcional(linha_bruta.get("fornecedor", "")),
            data_entrada_estoque=_parse_data(linha_bruta["data_entrada_estoque"]),
            data_ultima_venda=(
                _parse_data(linha_bruta["data_ultima_venda"])
                if linha_bruta.get("data_ultima_venda", "").strip()
                else None
            ),
            quantidade_estoque_atual=_parse_inteiro(linha_bruta["quantidade_estoque_atual"]),
            estoque_minimo=_parse_inteiro(linha_bruta.get("estoque_minimo", "")),
            custo_aquisicao_unitario=_parse_moeda(linha_bruta["custo_aquisicao_unitario"]),
            preco_venda_unitario=(
                _parse_moeda(linha_bruta["preco_venda_unitario"])
                if linha_bruta.get("preco_venda_unitario", "").strip()
                else None
            ),
            qtd_vendida_30d=_parse_inteiro(linha_bruta.get("qtd_vendida_30d", "")),
            qtd_vendida_90d=_parse_inteiro(linha_bruta.get("qtd_vendida_90d", "")),
            qtd_vendida_180d=_parse_inteiro(linha_bruta.get("qtd_vendida_180d", "")),
            custo_armazenagem_percentual_mensal=_parse_percentual(
                linha_bruta.get("custo_armazenagem_percentual_mensal", "")
            ),
            taxa_custo_oportunidade_anual=_parse_percentual(
                linha_bruta.get("taxa_custo_oportunidade_anual", "")
            ),
        )
    except (ValueError, InvalidOperation) as exc:
        return None, ErroLinha(numero_linha, str(exc))

    return linha, None


def processar_csv(conteudo: bytes) -> ResultadoProcessamento:
    texto = _decodificar(conteudo)
    primeira_linha = texto.splitlines()[0] if texto else ""
    delimitador = _detectar_delimitador(primeira_linha)
    leitor = csv.DictReader(io.StringIO(texto), delimiter=delimitador)

    resultado = ResultadoProcessamento()
    codigos_vistos: set[str] = set()

    for numero_linha, linha_bruta in enumerate(leitor, start=2):  # linha 1 = cabeçalho
        resultado.total_linhas += 1
        linha, erro = _validar_linha(linha_bruta, numero_linha)

        if erro is not None:
            resultado.erros.append(erro)
            continue

        assert linha is not None
        if linha.codigo_produto in codigos_vistos:
            resultado.erros.append(
                ErroLinha(numero_linha, f"produto '{linha.codigo_produto}' duplicado no arquivo")
            )
            continue

        codigos_vistos.add(linha.codigo_produto)
        resultado.linhas_validas.append(linha)

    return resultado
