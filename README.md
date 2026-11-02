# StockWise

**Sistema de Apoio à Decisão para Definição de Estratégias Promocionais Baseado no Custo Gerencial de Estoque em Autopeças**

> Status: PoC funcional — upload de CSV, cálculos de custo gerencial/giro/classificação/desconto máximo, dashboard com indicadores e gráficos, tabela de produtos com busca/filtro/ordenação/paginação/exportação, página de ajuda e análise exploratória com K-Means.

---

## Sobre o Projeto

O **StockWise** é um sistema web de apoio à decisão voltado para empresas do setor de autopeças. Ele consome dados de ERPs operacionais existentes e os transforma em inteligência gerencial, calculando o **custo gerencial composto** de cada produto e gerando recomendações de estratégias promocionais financeiramente viáveis.

A proposta não substitui o ERP da empresa, mas atua como uma **camada analítica complementar**, aproveitando os dados já disponíveis para gerar valor gerencial até então não explorado.

### Problema que resolve

Sistemas de estoque tradicionais registram entradas, saídas e quantidades, mas não respondem perguntas como:

- *Qual é o custo real de manter este produto parado há 8 meses?*
- *Qual o desconto máximo que posso aplicar sem prejuízo?*
- *Quais produtos devo priorizar numa campanha promocional?*

---

## Diferencial

A inovação central está na introdução do **custo gerencial composto** como métrica de análise. Diferentemente de sistemas tradicionais que se concentram no controle quantitativo do estoque, o StockWise considera fatores financeiros e temporais que impactam diretamente o desempenho de cada produto.

Enquanto ERPs convencionais registram o custo de aquisição, o StockWise agrega a esse valor o tempo de permanência em estoque, o custo de armazenagem e o custo de oportunidade do capital imobilizado. Com esse indicador, o sistema vai além de identificar produtos parados: ele calcula o impacto financeiro real da sua permanência e determina o limite máximo de desconto aplicável em uma ação promocional sem que haja prejuízo para a empresa.

---

## Funcionalidades

**Importação de dados do ERP (CSV):**
Upload manual de um CSV exportado do ERP, com arrastar-e-soltar. O backend tenta decodificar o arquivo em UTF-8, CP1252 e Mac Roman, nessa ordem, detecta o delimitador (`;`, `,` ou tab), aceita valores como `R$ 1.234,56` ou `1234.56`, recusa valores ambíguos e valida linha a linha. Linhas com erro são listadas sem impedir a importação das demais. Veja o [formato do CSV](#formato-do-csv).

**Modelo de custo gerencial composto:**
Cálculo de um indicador único por produto, integrando custo de aquisição, custo de armazenagem, tempo de permanência em estoque e custo de oportunidade do capital investido.

**Indicadores de giro em janelas temporais:**
Giro de estoque anualizado em três janelas (30, 90 e 180 dias), permitindo comparar o desempenho recente com o de médio prazo.

**Classificação multidimensional de produtos:**
Score relativo ao lote importado que combina custo gerencial (40%), giro (40%) e nível de estoque (20%), classificando cada produto em Prioridade Alta, Média ou Baixa.

**Desconto máximo sugerido:**
A partir do custo gerencial, o sistema calcula o maior desconto (em % e em R$) aplicável a cada produto sem perder uma margem mínima de 10%.

**Dashboard (Visão geral):**
Resumo em texto dos produtos críticos, 8 indicadores com explicação em tooltip, gráfico de produtos por classificação, mapa de prioridade (dispersão giro × custo gerencial, com o quadrante "parado e caro" em destaque), top 10 categorias por valor imobilizado e listas dos 5 produtos com maior custo gerencial e dos 5 parados há mais tempo. Os indicadores em R$ somam custos e descontos por unidade, sem multiplicar pela quantidade em estoque.

**Tabela de produtos:**
Busca por nome ou código, filtro por classificação, ordenação por custo gerencial, giro e desconto máximo (% e R$), paginação (10, 25, 50 ou 100 itens por página), tooltips explicando cada métrica e exportação da lista filtrada para CSV compatível com Excel.

**Página de ajuda:**
Passo a passo de uso e explicação das fórmulas (custo gerencial, giro, classificação e desconto máximo), com exemplos numéricos, e resumo de como a classificação foi validada com K-Means.

**Modelagem analítica e aprendizado de máquina:**
Notebook de análise exploratória com K-Means (scikit-learn) sobre os resultados já calculados, usado para validar a classificação por regras. Foi essa análise que levou ao ajuste dos pesos da classificação (40% custo, 40% giro, 20% estoque), elevando a concordância entre regra e K-Means de 46% para 82%; o resumo da validação aparece na página de Ajuda.

O sistema é aberto: não há login nem cadastro de usuários.

## Funcionalidades Futuras

- Integração direta com o ERP, sem exportação manual de CSV.
- Histórico e comparação entre importações.

---

## Arquitetura

O sistema é organizado em três camadas, sem acesso direto do frontend ao banco:

```
┌─────────────────────────────────────────────┐
│              Camada de Dados                │
│      CSV exportado manualmente do ERP       │
└────────────────────┬────────────────────────┘
                     │ Upload manual
┌────────────────────▼────────────────────────┐
│       Camada de Processamento e Análise     │
│  • Backend: FastAPI (Python)                │
│  • Parsing e validação do CSV               │
│  • Módulo de Custo Gerencial Composto       │
│  • Módulo de Giro de Estoque                │
│  • Módulo de Classificação de Produtos      │
│  • Módulo de Desconto Máximo Sugerido       │
│  • Banco de dados: PostgreSQL (Supabase)    │
└────────────────────┬────────────────────────┘
                     │ API REST
┌────────────────────▼────────────────────────┐
│          Camada de Apresentação             │
│  • Frontend: React + TypeScript (dashboard) │
└─────────────────────────────────────────────┘
```

O frontend nunca fala com o Supabase diretamente — só com a API FastAPI, que
é o único componente com a service key do banco.

> A análise exploratória com K-Means (`backend/analysis/`) roda à parte, num
> notebook Jupyter que lê diretamente do Supabase — não faz parte do fluxo
> da aplicação web, servindo apenas para validar a classificação por regras
> do módulo 4.

---

## Stack Tecnológica

**Backend**
- Python 3.14 (versão usada no CI), FastAPI, Uvicorn
- pydantic-settings (configuração via `.env`), python-multipart (upload de arquivo)
- Parsing de CSV com a biblioteca padrão `csv` (detecção automática de delimitador e
  codificação) — sem pandas na API
- Supabase (cliente Python) + PostgreSQL como banco
- pytest, pytest-cov + httpx (testes e cobertura)

**Frontend**
- Node.js 24 (versão usada no CI)
- React 19 + TypeScript, Vite (build/dev server)
- React Router (navegação entre telas)
- Tailwind CSS v4 (estilização)
- lucide-react (ícones)
- Recharts (gráficos do dashboard)
- Vitest, `@vitest/coverage-v8` + Testing Library (testes e cobertura)

**Qualidade e CI**
- GitHub Actions
- SonarQube Cloud

**Análise exploratória de dados**
- Jupyter Notebook
- pandas, scikit-learn (K-Means, silhouette score)
- matplotlib (visualização)
- python-dotenv (leitura das credenciais do `.env`)

---

## Como Rodar o Projeto

### Backend (FastAPI)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env     
uvicorn app.main:app --reload
```

Healthcheck em `http://localhost:8000/health`. Testes: `pytest` (dentro de `backend/`).

### Banco de dados (Supabase)

Rode o script `backend/db/schema.sql` no SQL Editor do seu projeto Supabase
para criar as tabelas (`produtos`, `importacoes`, `estoque_snapshots`,
`resultados_analise`).

### Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env     
npm run dev
```

Acesse `http://localhost:5173`. Testes: `npm run test` (Vitest).

### Análise exploratória (K-Means)

Notebook standalone em `backend/analysis/clustering_kmeans.ipynb` — agrupa via
K-Means os produtos de uma importação (por padrão, a mais recente), usando as
mesmas 3 dimensões e a mesma normalização por rank do módulo 4 (custo
gerencial, giro 90d e nível de estoque), e compara produto a produto com a
classificação por regras: percentual de concordância e lista dos produtos
em que os dois métodos divergem.

```bash
cd backend
pip install -r analysis/requirements.txt
jupyter notebook analysis/clustering_kmeans.ipynb
```

Lê as credenciais direto do `backend/.env` (mesmo arquivo usado pela API).

---

## Formato do CSV

A primeira linha do arquivo deve trazer o nome das colunas.

**Colunas obrigatórias:** `codigo_produto`, `nome_produto`,
`data_entrada_estoque`, `quantidade_estoque_atual` e
`custo_aquisicao_unitario`.

**Colunas opcionais:** `categoria`, `fornecedor`, `data_ultima_venda`,
`estoque_minimo`, `preco_venda_unitario`, `qtd_vendida_30d`, `qtd_vendida_90d`,
`qtd_vendida_180d`, `custo_armazenagem_percentual_mensal` e
`taxa_custo_oportunidade_anual`. Quantidades e percentuais vazios valem 0.
Sem `preco_venda_unitario`, o desconto máximo não é calculado.

**Delimitador:** `;`, `,` ou tab.

**Datas:** `dd/mm/aaaa`.

**Valores monetários:** use `R$ 1.234,56`, `1234,56` ou `1234.56`. Valores
ambíguos ou malformados, como `1.234`, `1,234` ou `1,234.50`, geram erro na
linha, que não é importada. Para mil reais, escreva `1.000,00` ou `1000.00`.

---

## Testes e Qualidade

Resultado da execução de 02/11/2026, já com a validação de valores monetários:

| Parte | Testes | Cobertura de linhas | Meta |
|---|---|---|---|
| Backend (pytest) | 35 aprovados, 0 falhas | 90% | ≥ 75% |
| Frontend (Vitest) | 6 aprovados, 0 falhas | 46,92% | ≥ 25% |

Na análise do commit `d66e26c`, o SonarQube Cloud mediu **63,2%** de cobertura
no projeto inteiro. Os testes
automatizados não acessam o Supabase e não incluem validação com dados reais.

O GitHub Actions roda testes, cobertura, build do frontend e análise do
SonarQube Cloud a cada push ou pull request para `main` e `development`, e falha
se a cobertura ficar abaixo da meta.

```bash
cd backend && pytest --cov=app        # backend
cd frontend && npm run test:coverage  # frontend
```

Detalhes por módulo em
[`docs/DOCUMENTACAO-TECNICA.md`](docs/DOCUMENTACAO-TECNICA.md#7-testes-e-qualidade).

---

## Documentação

- [`docs/RFC.md`](docs/RFC.md) — contexto, arquitetura e decisões técnicas.
- [`docs/casos-de-uso.md`](docs/casos-de-uso.md) — casos de uso dos
  principais fluxos do sistema.
- [`docs/DOCUMENTACAO-TECNICA.md`](docs/DOCUMENTACAO-TECNICA.md) — documentação
  técnica detalhada (modelo de dados, API, fórmulas, testes e qualidade).

---

## Autora

**Julia Weiller**
Universidade Católica de Santa Catarina — Jaraguá do Sul, SC
[julia.weiller@catolicasc.edu.br](mailto:julia.weiller@catolicasc.edu.br)

---

*Trabalho de Conclusão de Curso — Linha de Projeto Web Apps — PAC 7/8 · 2026*
