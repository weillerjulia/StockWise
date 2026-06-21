# StockWise

**Sistema de Apoio à Decisão para Definição de Estratégias Promocionais Baseado no Custo Gerencial de Estoque em Autopeças**

> Status: Projeto em fase de planejamento e preparação para desenvolvimento.

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

## Arquitetura Prevista

O sistema será organizado em três camadas principais:

```
┌─────────────────────────────────────────────┐
│              Camada de Dados                │
│  ERP de Estoque (CSV / API / banco direto)  │
└────────────────────┬────────────────────────┘
                     │ Pipeline ETL
┌────────────────────▼────────────────────────┐
│       Camada de Processamento e Análise     │
│  • ETL + Banco de Dados Analítico           │
│  • Módulo de Custo Gerencial Composto       │
│  • Modelos Analíticos / ML (scikit-learn)   │
│  • Módulo de Classificação de Produtos      │
│  • Módulo de Estratégias Promocionais       │
└────────────────────┬────────────────────────┘
                     │ API REST
┌────────────────────▼────────────────────────┐
│          Camada de Apresentação             │
│  • Backend: FastAPI (Python)                │
│  • Frontend: React + Dashboards Interativos │
└─────────────────────────────────────────────┘

```

---

## Stack Tecnológica Prevista

**Backend e Dados**
- Python 3.11+
- FastAPI ou Flask
- pandas, scikit-learn
- PostgreSQL via Supabase

**Frontend**
- React
- Bibliotecas de visualização de dados (Recharts / Chart.js)

**Infraestrutura e Qualidade**
- GitHub Actions (CI/CD)
- SonarCloud (análise estática)
- Grafana / Prometheus (monitoramento)
- Deploy em nuvem (AWS / GCP / Azure)
- Cobertura de testes: >= 75% backend, >= 25% frontend

---

## Autora

**Julia Weiller**
Universidade Católica de Santa Catarina — Jaraguá do Sul, SC
[julia.weiller@catolicasc.edu.br](mailto:julia.weiller@catolicasc.edu.br)

---

*Trabalho de Conclusão de Curso — Linha de Projeto Web Apps — PAC 7/8 · 2026*
