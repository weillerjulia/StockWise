# RFC — StockWise

## 1. Contexto e problema

Empresas do setor de autopeças usam ERPs que registram entradas, saídas e
quantidades em estoque, mas não respondem perguntas gerenciais como "qual o
custo real de manter este produto parado há 8 meses?" ou "qual o desconto
máximo que posso aplicar numa promoção sem prejuízo?".

O StockWise é uma camada analítica complementar a esse ERP: consome um
snapshot do estoque (hoje via upload manual de CSV) e calcula um **custo
gerencial composto** por produto — custo de aquisição + custo de armazenagem
acumulado + custo de oportunidade do capital imobilizado, proporcionais ao
tempo em estoque — e, a partir dele, um desconto máximo seguro por produto.

Este documento descreve a arquitetura e as decisões técnicas do PoC
implementado até o momento (módulos 1–6 + análise exploratória).

## 2. Arquitetura

Três camadas, sem acesso direto do frontend ao banco:

```
CSV (upload manual)  →  Backend (FastAPI)  →  Supabase (Postgres)
                              ↑
                         Frontend (React)
```

- O frontend nunca fala com o Supabase diretamente — só com a API FastAPI.
- O backend é o único componente com a service key do Supabase.
- Isso mantém a separação entre camada de apresentação e camada de
  processamento, e evita expor credenciais de banco no navegador.

## 3. Stack tecnológica (implementada)

**Backend** (`backend/requirements.txt`): FastAPI, Uvicorn, pydantic-settings,
supabase-py, python-multipart (upload de arquivo), pytest, pytest-cov, httpx
(`TestClient`). Parsing de CSV com a biblioteca padrão `csv` — sem pandas na
API (pandas é usado só na análise exploratória, ver abaixo).

**Frontend** (`frontend/package.json`): React 19 + TypeScript, Vite,
React Router, Tailwind CSS v4, lucide-react (ícones), Recharts (gráficos do
dashboard), Vitest + Testing Library + `@vitest/coverage-v8`.

**Banco**: Supabase (Postgres gerenciado), schema em `backend/db/schema.sql`.

**Análise exploratória** (`backend/analysis/requirements.txt`, isolado do
runtime da API): pandas, scikit-learn, matplotlib, python-dotenv, Jupyter.

**CI e qualidade** (`.github/workflows/ci.yml`, `sonar-project.properties`):
GitHub Actions, com Python 3.14 e Node.js 24, e SonarQube Cloud.

## 4. Fluxo de dados ponta a ponta

1. Usuário faz upload do CSV na tela de Upload (`POST /importacoes`).
2. Backend decodifica o arquivo, detecta delimitador e formato numérico,
   valida linha a linha (`csv_import.py`).
3. Para cada linha válida, calcula em sequência: custo gerencial composto
   (`custo_gerencial.py`) → giro de estoque em 3 janelas (`giro_estoque.py`)
   → classificação relativa ao lote (`classificacao_estoque.py`) → desconto
   máximo sugerido (`desconto_maximo.py`).
4. Grava produto (upsert), snapshot do estoque e resultado calculado no
   Supabase (`importacoes_repository.py`), mantendo os 3 tipos de dado em
   tabelas separadas (ver seção 5).
5. Frontend guarda o `id` da importação no `localStorage` e consulta
   `GET /importacoes/{id}/resultados` para alimentar as telas de Dashboard e
   Produtos. A tela de Upload usa `GET /importacoes/{id}` para mostrar o
   resumo da última importação (data/hora, linhas importadas, com erro e
   status).
6. Os indicadores do Dashboard (totais, contagens, médias, rankings) e a
   busca/filtro/ordenação/paginação da tabela de Produtos são calculados no
   navegador a partir desses resultados — não há endpoints de agregação.

## 5. Decisões técnicas relevantes

### 5.1 CSV manual em vez de integração direta com o ERP

Não há integração via API/banco direto com o ERP nesta fase. Trade-off
aceito conscientemente: simplifica o PoC (não depende de credenciais ou
protocolo de um ERP específico) às custas de exigir uma ação manual do
usuário a cada atualização de dados.

### 5.2 Separação em 4 tabelas: dado bruto vs. dado calculado

`produtos` (dimensão descritiva), `estoque_snapshots` (o que veio
literalmente do CSV em cada upload) e `resultados_analise` (o que é
calculado pelo sistema) são tabelas distintas, não uma tabela larga única.
Isso permite manter histórico entre importações para comparar giro/custo ao
longo do tempo e deixa o modelo pronto para um futuro reprocessamento sem
reimportar o CSV. Comparação e reprocessamento ainda não existem no código.
`importacoes` dá rastreabilidade de cada upload (linhas com erro,
quando rodou).

### 5.3 Decodificação de CSV com fallback em cadeia

`csv_import._decodificar` tenta `utf-8-sig` → `cp1252` → `mac_roman`, nessa
ordem. Motivado por um caso real: um CSV de teste veio codificado em Mac OS
Roman (exportado por Excel de Mac), o que não é nem UTF-8 nem CP1252 —
sem esse terceiro fallback, o upload falhava com erro de decodificação.
`mac_roman` fica por último porque mapeia todos os 256 valores de byte
(nunca levanta erro), então precisa vir depois do CP1252 pra não "roubar"
arquivos que são CP1252 de verdade.

Consequência: o fallback não identifica a codificação real. Na prática, não
há erro de decodificação, e um arquivo em outra codificação (ou um Mac Roman
cujos bytes também sejam válidos em CP1252) pode ser importado com acentos
incorretos.

### 5.4 Detecção automática de delimitador e de formato decimal

`csv_import._detectar_delimitador` usa `csv.Sniffer` em vez de assumir `;`
fixo — outro caso real: um segundo CSV de teste usava `,` como delimitador e
`.` como separador decimal (sem `R$`), enquanto o primeiro usava `;` e
`R$ 1.234,56`. `_parse_moeda` só aplica a conversão de formato BR
(remover `.` de milhar, trocar `,` por `.`) quando encontra uma vírgula no
valor — caso contrário assume que o ponto já é o decimal.

Valores ambíguos ou malformados são recusados e viram erro na linha: `1.234`
pode ser mil duzentos e trinta e quatro ou pouco mais de um real, e `1,234.50`
não tem formato suportado. Antes, esses valores eram lidos como 1,234 e 1,2345,
o que distorcia custo, classificação e desconto sem nenhum aviso. Decisão:
recusar em vez de adivinhar. Continuam aceitos `0.125` e `1000.000`, que não
podem ser milhar. Importações já gravadas não são corrigidas.

### 5.5 CORS explícito via variável de ambiente

`FRONTEND_ORIGIN` (`.env`, padrão `http://localhost:5173`) configura o
`CORSMiddleware` do FastAPI. Necessário porque frontend e backend rodam em
origens (portas) diferentes — sem isso, o navegador bloqueia as respostas da
API e o upload falha com `Failed to fetch`.

### 5.6 Margem mínima configurável no desconto máximo

`calcular_desconto_maximo` (módulo 5) recebe `margem_minima_percentual`
como parâmetro (padrão 10%) em vez de descontar até o ponto de custo exato
(margem zero). Decisão de negócio: evitar que o desconto máximo sugerido
zere a margem do produto mesmo na promoção mais agressiva.

### 5.7 `localStorage` em vez de endpoint de listagem de importações

A API não tem endpoint para listar importações ou obter "a mais recente"
— o frontend guarda o `id` retornado pelo upload no `localStorage`
(`stockwise:ultimaImportacaoId`) e o reutiliza nas telas de Dashboard e
Produtos. Suficiente para o escopo do PoC (uso local, sistema aberto); a
consequência é que cada navegador enxerga só a última importação feita nele
mesmo.

### 5.8 Busca, filtro, ordenação e paginação client-side na tela de Produtos

A tabela de produtos busca todos os resultados da importação de uma vez e
aplica no navegador: busca por nome ou código, filtro por classificação,
ordenação (custo gerencial, giro 90d, desconto máximo em % e em R$) e
paginação (10, 25, 50 ou 100 itens por página). Não há parâmetros de query
no backend. Aceitável para o volume de dados de uma importação de PoC;
seria revisado para lotes muito maiores.

### 5.9 Clustering K-Means como notebook standalone

O módulo de análise exploratória (`backend/analysis/clustering_kmeans.ipynb`)
não está integrado à API nem ao pipeline de importação — é um notebook
independente que lê os dados direto do Supabase usando as mesmas
credenciais do backend. Decisão de escopo: nesta fase o objetivo é validar
(reforçar ou refinar) a classificação por regras do módulo 4 com um método
não supervisionado, não expor isso como funcionalidade do produto.

Para a comparação ser justa, o notebook vê os dados como o módulo 4: analisa
uma importação por vez (a classificação é relativa ao lote), usa as mesmas
3 dimensões (custo gerencial, giro 90d com nulo = 0, razão estoque/mínimo)
convertidas no mesmo rank relativo, e **não** usa o `score_prioridade` como
feature — ele é derivado dessas dimensões e define a classificação, o que
tornaria a comparação circular. Os clusters são nomeados pela média do
centróide (mesmo critério do score), permitindo medir a concordância
produto a produto. Lotes com menos de 10 produtos são recusados.

### 5.10 Exportação da tabela gerada no navegador

O botão "Exportar Excel" da tela de Produtos gera um CSV no próprio
navegador (`utils/exportCsv.ts`), sem endpoint no backend. Exporta as linhas
que passaram pela busca e pelo filtro (todas as páginas, na ordenação
atual), com `;` como delimitador e valores no formato BR. O arquivo começa
com BOM UTF-8 para o Excel abrir os acentos corretamente — o mesmo problema
de encoding da seção 5.3, na direção contrária.

### 5.11 Sistema aberto, sem conceito de usuário

Decisão de escopo: o StockWise não terá login nem cadastro de usuários. A
interface não exibe nenhum usuário (o indicador de usuário que existia na
barra superior foi removido), e todos os dados importados ficam acessíveis a
quem acessar o frontend.

### 5.12 Explicações das métricas na própria interface

Cada métrica da tabela de Produtos e cada indicador do Dashboard tem um
ícone de ajuda (`HelpTooltip`) com uma explicação curta; alguns trazem
também um exemplo. A
página Ajuda (`/ajuda`) traz o passo a passo de uso e as fórmulas completas
com exemplos numéricos.

### 5.13 Pesos da classificação: 40% custo, 40% giro, 20% estoque

O score de prioridade do módulo 4 era a média simples (1/3 cada) dos ranks
de custo gerencial, giro invertido e razão estoque/mínimo. O notebook de
K-Means (seção 5.9) mostrou que, nos dados, a razão de estoque anda na
direção oposta das outras duas (correlação de Spearman −0,72 com o custo e
+0,66 com o giro): peças caras e paradas costumam ter estoque mais próximo
do mínimo. Com peso igual, essa dimensão anulava as outras, o score se
concentrava em torno de 0,5 e 48 de 56 produtos caíam em "Prioridade
Média" — concordância de só 46% com os grupos do K-Means. Esses números vêm
da análise feita com os pesos antigos: o notebook atual usa os pesos 40/40/20,
não calcula a correlação e mantém os 46% apenas como nota histórica.

Decisão: custo e giro passam a ter 40% cada e o nível de estoque vira
critério secundário (20%). Justificativa conceitual: o giro já mede o
estoque em relação às vendas, então a razão estoque/mínimo dobrava esse
efeito. Os limiares (0,34 e 0,67) foram mantidos. No mesmo lote, a
distribuição passou a 13 Alta / 28 Média / 15 Baixa, com concordância de
cerca de 82% com o K-Means (que agrupa sem conhecer os pesos).
Descartado: cortar por percentil, que forçaria sempre haver produtos em
"Prioridade Alta" mesmo num estoque saudável.

Importações já gravadas mantêm o score antigo — a classificação é
calculada no upload, então é preciso reimportar o CSV.

## 6. Limitações conhecidas do PoC

- Sem autenticação/autorização (decisão de escopo, ver 5.11) — qualquer
  pessoa com acesso à URL do frontend pode importar dados e ver os
  resultados.
- Sem integração direta com ERP — depende de exportação manual de CSV.
- Um CSV com quebra de linha só em CR (formato antigo de Mac) não é lido: o
  parser levanta um erro não tratado e a API responde com um 500 genérico.
- A gravação da importação não é atômica: uma falha no meio mantém as linhas
  já gravadas, e uma falha ao criar ou finalizar o registro não marca a
  importação como `falhou` (ver `DOCUMENTACAO-TECNICA.md`, seção 6.1).
- Supabase no plano gratuito pausa o projeto após período de inatividade,
  o que derruba a conexão do backend até o projeto ser reativado
  manualmente no painel.
- Paginação só no navegador — assume que uma importação cabe inteira na
  memória do navegador.
- Os indicadores em R$ do Dashboard (valor total imobilizado, valor
  imobilizado crítico e potencial de recuperação) somam valores **por
  unidade** (custo gerencial e desconto máximo unitários), sem multiplicar
  pela quantidade em estoque. Os tooltips descrevem o cálculo como está; a
  correção fica para uma próxima etapa.

## 7. Testes

- Backend: `pytest` (`backend/tests/`), cobrindo parsing de CSV
  (encoding, delimitador, formato decimal, valores ambíguos, campos obrigatórios), cálculo de
  custo gerencial, giro, classificação e desconto máximo, e os endpoints de
  importação, com o acesso ao Supabase substituído por mocks.
- Frontend: Vitest + Testing Library (`frontend/src/App.test.tsx` e
  `frontend/src/pages/*.test.tsx`), cobrindo a renderização do layout, a
  tela de Upload (envio do CSV com resumo e erros por linha, estado sem
  importação e resumo da última importação salva), a tela de Produtos
  (listagem, filtro por classificação, selos e indicador de produtos sem
  desconto e dados enviados para a exportação) e a tela de Ajuda (explicação
  dos selos de desconto zero).
- Metas de cobertura: ≥75% backend, ≥25% frontend. Resultados em
  [`DOCUMENTACAO-TECNICA.md`](DOCUMENTACAO-TECNICA.md#7-testes-e-qualidade).
