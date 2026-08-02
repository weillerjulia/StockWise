from app.services.csv_import import processar_csv

CABECALHO = (
    "codigo_produto;nome_produto;categoria;fornecedor;data_entrada_estoque;"
    "data_ultima_venda;quantidade_estoque_atual;estoque_minimo;custo_aquisicao_unitario;"
    "preco_venda_unitario;qtd_vendida_30d;qtd_vendida_90d;qtd_vendida_180d;"
    "custo_armazenagem_percentual_mensal;taxa_custo_oportunidade_anual"
)

LINHA_AP_1001 = (
    "AP-1001;Filtro de óleo motor 1.0/1.6;Motor;Filora Fortaleza Peças;02/10/2025;"
    "28/07/2026;42;15;R$ 18,50;R$ 34,90;22;61;118;1,2;12"
)


def _csv(*linhas: str) -> bytes:
    return "\n".join([CABECALHO, *linhas]).encode("utf-8")


def test_processa_linha_valida_com_todos_os_campos():
    resultado = processar_csv(_csv(LINHA_AP_1001))

    assert resultado.total_linhas == 1
    assert resultado.erros == []

    linha = resultado.linhas_validas[0]
    assert linha.codigo_produto == "AP-1001"
    assert linha.nome_produto == "Filtro de óleo motor 1.0/1.6"
    assert linha.categoria == "Motor"
    assert linha.quantidade_estoque_atual == 42
    assert linha.estoque_minimo == 15
    assert str(linha.custo_aquisicao_unitario) == "18.50"
    assert str(linha.preco_venda_unitario) == "34.90"
    assert linha.qtd_vendida_30d == 22
    assert str(linha.custo_armazenagem_percentual_mensal) == "1.2"
    assert str(linha.taxa_custo_oportunidade_anual) == "12"
    assert linha.data_entrada_estoque.isoformat() == "2025-10-02"
    assert linha.data_ultima_venda.isoformat() == "2026-07-28"


def test_linha_sem_campo_obrigatorio_gera_erro_e_nao_e_importada():
    linha_sem_custo = (
        "AP-1002;Pastilha de freio dianteira;Freios;Frenax Distribuição;09/09/2025;"
        "20/07/2026;18;10;;R$ 129,90;9;24;47;1,5;12"
    )

    resultado = processar_csv(_csv(linha_sem_custo))

    assert resultado.total_linhas == 1
    assert resultado.linhas_validas == []
    assert len(resultado.erros) == 1
    assert resultado.erros[0].linha == 2
    assert "custo_aquisicao_unitario" in resultado.erros[0].mensagem


def test_data_fora_do_formato_gera_erro():
    linha_data_invalida = (
        "AP-1003;Amortecedor traseiro;Suspensão;Suseira;31/13/2025;"
        "05/12/2025;26;6;R$ 210,00;R$ 389,00;0;1;3;1,8;12"
    )

    resultado = processar_csv(_csv(linha_data_invalida))

    assert resultado.linhas_validas == []
    assert len(resultado.erros) == 1
    assert "data" in resultado.erros[0].mensagem


def test_codigo_duplicado_no_arquivo_mantem_primeira_ocorrencia_e_gera_erro():
    resultado = processar_csv(_csv(LINHA_AP_1001, LINHA_AP_1001))

    assert resultado.total_linhas == 2
    assert len(resultado.linhas_validas) == 1
    assert len(resultado.erros) == 1
    assert "duplicado" in resultado.erros[0].mensagem
    assert resultado.erros[0].linha == 3


def test_campos_opcionais_ausentes_recebem_valores_padrao():
    linha_minima = "AP-1006;Bomba de combustível elétrica;;;18/02/2025;;9;;R$ 185,00;;;;;;"

    resultado = processar_csv(_csv(linha_minima))

    assert resultado.erros == []
    linha = resultado.linhas_validas[0]
    assert linha.categoria is None
    assert linha.fornecedor is None
    assert linha.data_ultima_venda is None
    assert linha.estoque_minimo == 0
    assert linha.preco_venda_unitario is None
    assert linha.qtd_vendida_30d == 0
    assert str(linha.custo_armazenagem_percentual_mensal) == "0"
