# StockWise

**Sistema de Apoio à Decisão para Definição de Estratégias Promocionais Baseado no Custo Gerencial de Estoque em Autopeças**

> Status: MVP funcional — upload de CSV, cálculos de custo gerencial/giro/classificação/desconto máximo, dashboard web e análise exploratória com K-Means.

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

## Funcionalidades Previstas

**Integração com dados do ERP:**
Importação de dados operacionais do ERP já utilizado pela empresa.

**Modelo de custo gerencial composto:**
Cálculo de um indicador único por produto, integrando custo de aquisição, custo de armazenagem, tempo de permanência em estoque e custo de oportunidade do capital investido.

**Indicadores de giro em janelas temporais:**
Análise do giro de estoque considerando diferentes períodos (30, 60, 90 e 180 dias), permitindo uma visão dinâmica do desempenho dos produtos ao longo do tempo.

**Classificação multidimensional de produtos:**
Ranqueamento que combina simultaneamente as dimensões de giro, custo gerencial e nível de estoque, organizando os produtos por grau de prioridade para intervenção gerencial.

**Estratégias promocionais com limite de desconto:**
A partir do custo gerencial calculado, o sistema determina o valor máximo de desconto aplicável a cada produto, transformando a identificação de itens parados em uma recomendação promocional economicamente segura.

**Dashboards analíticos interativos:**
Interface web com painéis para visualização dos indicadores de resultado, permitindo que os gestores acompanhem o desempenho do estoque de forma clara e orientada à decisão.

**Modelagem analítica e aprendizado de máquina:**
Aplicação de técnicas de análise exploratória e modelos de machine learning (scikit-learn) sobre os dados históricos do ERP, com o objetivo de identificar padrões de desempenho que possam reforçar ou refinar as recomendações geradas pelo sistema.

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
│  • Backend: FastAPI (Python)                │
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
- Python 3.11+, FastAPI, Uvicorn
- pydantic-settings (configuração via `.env`), python-multipart (upload de arquivo)
- Parsing de CSV com a biblioteca padrão `csv` (detecção automática de delimitador e
  codificação) — sem pandas na API
- Supabase (cliente Python) + PostgreSQL como banco
- pytest + httpx (testes)

**Frontend**
- React 19 + TypeScript, Vite (build/dev server)
- React Router (navegação entre telas)
- Tailwind CSS v4 (estilização)
- lucide-react (ícones)
- Recharts (gráficos do dashboard)
- Vitest + Testing Library (testes)

**Análise exploratória de dados**
- Jupyter Notebook
- pandas, scikit-learn (K-Means, StandardScaler, silhouette score)
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

Notebook standalone em `backend/analysis/clustering_kmeans.ipynb` — agrupa os
produtos já calculados (custo gerencial, giro, score de prioridade) via
K-Means, pra comparar com a classificação por regras do módulo 4.

```bash
cd backend
pip install -r analysis/requirements.txt
jupyter notebook analysis/clustering_kmeans.ipynb
```

Lê as credenciais direto do `backend/.env` (mesmo arquivo usado pela API).

---

## Documentação

- [`docs/RFC.md`](docs/RFC.md) — contexto, arquitetura e decisões técnicas.
- [`docs/casos-de-uso.md`](docs/casos-de-uso.md) — casos de uso dos
  principais fluxos do sistema.

---

## Autora

**Julia Weiller**
Universidade Católica de Santa Catarina — Jaraguá do Sul, SC
[julia.weiller@catolicasc.edu.br](mailto:julia.weiller@catolicasc.edu.br)

---

*Trabalho de Conclusão de Curso — Linha de Projeto Web Apps — PAC 7/8 · 2026*
