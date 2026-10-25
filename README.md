# StockWise

**Sistema de Apoio à Decisão para Definição de Estratégias Promocionais Baseado no Custo Gerencial de Estoque em Autopeças**

> Status: MVP funcional — upload de CSV, cálculos de custo gerencial/giro/classificação/desconto máximo, dashboard com indicadores e gráficos, tabela de produtos com busca/filtro/ordenação/paginação/exportação, página de ajuda e análise exploratória com K-Means.

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
Upload manual de um CSV exportado do ERP, com arrastar-e-soltar. O backend detecta sozinho a codificação (UTF-8, CP1252 ou Mac Roman), o delimitador (`;`, `,` ou tab) e o formato numérico (BR ou US), e valida linha a linha. Linhas com erro são listadas sem impedir a importação das demais.

**Modelo de custo gerencial composto:**
Cálculo de um indicador único por produto, integrando custo de aquisição, custo de armazenagem, tempo de permanência em estoque e custo de oportunidade do capital investido.

**Indicadores de giro em janelas temporais:**
Giro de estoque anualizado em três janelas (30, 90 e 180 dias), permitindo comparar o desempenho recente com o de médio prazo.

**Classificação multidimensional de produtos:**
Score relativo ao lote importado que combina custo gerencial, giro e nível de estoque, classificando cada produto em Prioridade Alta, Média ou Baixa.

**Desconto máximo sugerido:**
A partir do custo gerencial, o sistema calcula o maior desconto (em % e em R$) aplicável a cada produto sem perder uma margem mínima de 10%.

**Dashboard (Visão geral):**
Resumo em texto dos produtos críticos, 8 indicadores com explicação em tooltip, gráfico de produtos por classificação, top 10 categorias por valor imobilizado e listas dos 5 produtos com maior custo gerencial e dos 5 parados há mais tempo.

**Tabela de produtos:**
Busca por nome ou código, filtro por classificação, ordenação por custo gerencial, giro e desconto máximo (% e R$), paginação (10, 25, 50 ou 100 itens por página), tooltips explicando cada métrica e exportação da lista filtrada para CSV compatível com Excel.

**Página de ajuda:**
Passo a passo de uso e explicação das fórmulas (custo gerencial, giro, classificação e desconto máximo), com exemplos numéricos.

**Modelagem analítica e aprendizado de máquina:**
Notebook de análise exploratória com K-Means (scikit-learn) sobre os resultados já calculados, usado para validar a classificação por regras.

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
- [`docs/DOCUMENTACAO-TECNICA.md`](docs/DOCUMENTACAO-TECNICA.md) — documentação
  técnica detalhada (modelo de dados, API e fórmulas).

---

## Autora

**Julia Weiller**
Universidade Católica de Santa Catarina — Jaraguá do Sul, SC
[julia.weiller@catolicasc.edu.br](mailto:julia.weiller@catolicasc.edu.br)

---

*Trabalho de Conclusão de Curso — Linha de Projeto Web Apps — PAC 7/8 · 2026*
