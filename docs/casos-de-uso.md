# Casos de Uso — StockWise

Ator único em todos os casos: **Gestor** (usuário do sistema, ex.: dono ou
gestor de estoque da autopeças). Não há diferenciação de perfis/permissões
nesta fase (sem autenticação).

---

## UC01 — Importar CSV de estoque

**Pré-condições:**
- Backend rodando e Supabase configurado com o schema (`backend/db/schema.sql`)
  já criado.
- Gestor possui um CSV exportado do ERP com as colunas esperadas
  (`codigo_produto`, `nome_produto`, `data_entrada_estoque`,
  `quantidade_estoque_atual`, `custo_aquisicao_unitario` são obrigatórias;
  as demais são opcionais).

**Fluxo principal:**
1. Gestor acessa a tela de Upload (rota `/`).
2. Seleciona o arquivo CSV e clica em "Importar".
3. Frontend envia o arquivo para `POST /importacoes`.
4. Backend decodifica o arquivo (UTF-8 → CP1252 → Mac Roman) e detecta o
   delimitador (`;`, `,` ou tab) automaticamente.
5. Para cada linha do CSV: valida campos obrigatórios, converte datas
   (`dd/mm/aaaa`), valores monetários (BR ou US) e percentuais.
6. Para cada linha válida: calcula custo gerencial composto, giro (30/90/180
   dias), classificação de prioridade (relativa às demais linhas do mesmo
   arquivo) e desconto máximo sugerido.
7. Backend grava produto (upsert por `codigo_produto`), snapshot do estoque
   e resultado calculado no Supabase.
8. Frontend recebe o resumo (total de linhas, importadas, com erro) e salva
   o `id` da importação no `localStorage`.
9. Tela exibe o resumo; se houver linhas com erro, lista cada uma
   (número da linha + mensagem).

**Fluxos alternativos / erro:**
- **Encoding não reconhecido**: arquivo não decodifica em nenhuma das 3
  codificações suportadas → API retorna 400 com
  "não foi possível decodificar o arquivo (esperado UTF-8, CP1252 ou Mac
  Roman)"; nenhuma linha é processada.
- **Campo obrigatório vazio**: linha é marcada com erro
  ("campo obrigatório '`<coluna>`' vazio") e não é importada; as demais
  linhas do arquivo continuam sendo processadas normalmente.
- **Data fora do formato**: linha marcada com erro
  ("data '`<valor>`' fora do formato dd/mm/aaaa").
- **Código de produto duplicado no mesmo arquivo**: primeira ocorrência é
  importada, as seguintes são marcadas com erro
  ("produto '`<codigo>`' duplicado no arquivo").
- **Falha ao gravar no banco** (ex.: Supabase indisponível ou projeto
  pausado): importação inteira é marcada como `falhou`, API retorna 500
  ("falha ao gravar importação no banco").
- **Arquivo com todas as linhas inválidas**: importação é registrada com
  status `concluida_com_erros` e zero linhas importadas — não é tratado
  como falha total do sistema.

---

## UC02 — Consultar produtos classificados por prioridade

**Pré-condições:** existe ao menos uma importação concluída, com o `id`
salvo no `localStorage` do navegador (UC01 já executado nessa sessão do
navegador).

**Fluxo principal:**
1. Gestor acessa a tela Produtos (rota `/produtos`).
2. Frontend lê o `id` da última importação do `localStorage` e busca
   `GET /importacoes/{id}/resultados`.
3. Tela exibe uma tabela com nome, categoria, custo gerencial composto,
   giro (90d), classificação e desconto máximo sugerido — uma linha por
   produto.
4. Gestor filtra por classificação (Alta/Média/Baixa/todas) via um seletor.
5. Gestor ordena a tabela clicando no cabeçalho de "Custo gerencial" ou
   "Giro (90d)" (alterna crescente/decrescente a cada clique).

**Fluxos alternativos / erro:**
- **Nenhuma importação registrada ainda** (sem `id` no `localStorage`):
  tela exibe "Nenhuma importação encontrada" com link para a tela de
  Upload, em vez da tabela.
- **Falha ao buscar resultados** (rede indisponível, CORS mal configurado,
  backend fora do ar): tela exibe a mensagem de erro retornada pela API
  (ou uma mensagem genérica, se a API não respondeu).
- **Filtro sem resultados** (ex.: nenhum produto "Prioridade Alta" no
  lote): tabela é exibida vazia, sem erro.

---

## UC03 — Consultar desconto máximo sugerido de um produto

**Pré-condições:** produto já possui resultado de análise calculado (fez
parte de uma importação concluída).

**Fluxo principal:**
1. Gestor localiza o produto na tela Produtos (UC02).
2. Consulta a coluna "Desconto máximo sugerido", exibida em percentual.
3. Cálculo (módulo 5): `desconto = preço_venda − (custo_gerencial_composto
   × (1 + margem_mínima%))`, com margem mínima padrão de 10%.

**Fluxos alternativos / erro:**
- **Produto sem preço de venda cadastrado no CSV** (`preco_venda_unitario`
  vazio): coluna exibe "-" — desconto não é calculável sem preço de venda.
- **Produto já vendido no prejuízo ou sem margem** (preço de venda menor ou
  igual ao custo gerencial composto mais a margem mínima): desconto máximo
  exibido é 0% — não existe headroom de desconto sem violar a margem
  mínima configurada.

---

## UC04 — Visualizar indicadores agregados no dashboard

**Pré-condições:** existe ao menos uma importação concluída, com o `id`
salvo no `localStorage`.

**Fluxo principal:**
1. Gestor acessa a tela Visão Geral (rota `/dashboard`).
2. Frontend busca os mesmos resultados de `GET /importacoes/{id}/resultados`
   usados no UC02.
3. Tela exibe um gráfico de barras com a quantidade de produtos por
   classificação (Alta/Média/Baixa).
4. Tela exibe o valor total imobilizado em produtos críticos: soma do
   custo gerencial composto de todos os produtos classificados como
   "Prioridade Alta".

**Fluxos alternativos / erro:**
- **Nenhuma importação registrada**: mesmo estado vazio do UC02, com link
  para a tela de Upload.
- **Falha ao buscar resultados**: mesma mensagem de erro do UC02.
- **Nenhum produto "Prioridade Alta" no lote**: valor imobilizado em
  produtos críticos exibido como R$ 0,00; gráfico mostra a barra
  correspondente zerada.
