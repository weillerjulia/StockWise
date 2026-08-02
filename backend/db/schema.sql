-- StockWise — schema inicial (Supabase / Postgres)
-- Rode este script no SQL Editor do Supabase (ou via CLI).

create extension if not exists pgcrypto;

-- Dimensão: dados descritivos do produto (upsert por codigo_produto a cada importação)
create table produtos (
    id uuid primary key default gen_random_uuid(),
    codigo_produto text not null unique,
    nome_produto text not null,
    categoria text,
    fornecedor text,
    criado_em timestamptz not null default now(),
    atualizado_em timestamptz not null default now()
);

-- Um registro por upload de CSV (auditoria/histórico de importações)
create table importacoes (
    id uuid primary key default gen_random_uuid(),
    nome_arquivo text not null,
    status text not null default 'processando'
        check (status in ('processando','concluida','concluida_com_erros','falhou')),
    total_linhas integer not null default 0,
    linhas_importadas integer not null default 0,
    linhas_com_erro integer not null default 0,
    erros jsonb not null default '[]'::jsonb,
    iniciada_em timestamptz not null default now(),
    concluida_em timestamptz
);

-- Fato: uma linha por produto em cada importação (permite histórico ao longo do tempo)
create table estoque_snapshots (
    id uuid primary key default gen_random_uuid(),
    importacao_id uuid not null references importacoes(id) on delete cascade,
    produto_id uuid not null references produtos(id) on delete cascade,
    data_entrada_estoque date,
    data_ultima_venda date,
    quantidade_estoque_atual integer not null default 0,
    estoque_minimo integer not null default 0,
    custo_aquisicao_unitario numeric(12,2) not null,
    preco_venda_unitario numeric(12,2),
    qtd_vendida_30d integer not null default 0,
    qtd_vendida_90d integer not null default 0,
    qtd_vendida_180d integer not null default 0,
    custo_armazenagem_percentual_mensal numeric(6,3) not null default 0,
    taxa_custo_oportunidade_anual numeric(6,3) not null default 0,
    criado_em timestamptz not null default now(),
    unique (importacao_id, produto_id)
);

-- Resultado do cálculo (módulos 2–5): 1 para 1 com estoque_snapshots
create table resultados_analise (
    id uuid primary key default gen_random_uuid(),
    estoque_snapshot_id uuid not null unique references estoque_snapshots(id) on delete cascade,
    dias_em_estoque integer,
    custo_armazenagem_calculado numeric(12,2),
    custo_oportunidade_calculado numeric(12,2),
    custo_gerencial_composto numeric(12,2),
    giro_30d numeric(8,4),
    giro_90d numeric(8,4),
    giro_180d numeric(8,4),
    classificacao text,
    score_prioridade numeric(8,4),
    desconto_maximo_percentual numeric(5,2),
    desconto_maximo_valor numeric(12,2),
    calculado_em timestamptz not null default now()
);

create index idx_estoque_snapshots_produto on estoque_snapshots(produto_id);
create index idx_estoque_snapshots_importacao on estoque_snapshots(importacao_id);
create index idx_resultados_snapshot on resultados_analise(estoque_snapshot_id);
