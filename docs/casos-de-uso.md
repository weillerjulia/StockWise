# Casos de Uso — StockWise

Ator único em todos os casos: **Gestor** (ex.: dono ou gestor de estoque da
autopeças). O sistema é aberto: não há login, cadastro de usuários nem
diferenciação de perfis/permissões.

---

## UC01 — Importar CSV de estoque

**Pré-condições:**
- Backend rodando e Supabase configurado com o schema (`backend/db/schema.sql`)
  já criado.
- Gestor possui um CSV exportado do ERP com as colunas esperadas
  (`codigo_produto`, `nome_produto`, `data_entrada_estoque`,
  `quantidade_estoque_atual`, `custo_aquisicao_unitario` são obrigatórias;
  `categoria`, `fornecedor`, `data_ultima_venda`, `estoque_minimo`,
  `preco_venda_unitario`, `qtd_vendida_30d`, `qtd_vendida_90d`,
  `qtd_vendida_180d`, `custo_armazenagem_percentual_mensal` e
  `taxa_custo_oportunidade_anual` são opcionais).

**Fluxo principal:**
1. Gestor acessa a tela de Upload (rota `/`). A tela mostra o formato
   esperado do CSV (delimitador, formato de datas e valores) e as colunas
   obrigatórias e opcionais.
2. Arrasta o arquivo CSV para a área de upload (ou clica nela para
   escolher o arquivo) e clica em "Importar".
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

## UC02 — Consultar a última importação

**Pré-condições:** nenhuma.

**Fluxo principal:**
1. Gestor acessa a tela de Upload (rota `/`).
2. Frontend lê o `id` da última importação do `localStorage` e busca
   `GET /importacoes/{id}`.
3. Abaixo da área de upload, a seção "Última importação" exibe data/hora,
   linhas importadas, linhas com erro e status (Processando, Concluída,
   Concluída com erros ou Falhou, cada um com sua cor).

**Fluxos alternativos / erro:**
- **Nenhuma importação registrada** (sem `id` no `localStorage`): exibe
  "Nenhuma importação realizada ainda."
- **Importação não encontrada ou falha ao buscar**: exibe a mensagem de
  erro retornada pela API.
- **Logo após um upload (UC01)**: a seção dá lugar ao resumo da importação
  recém-feita.

---

## UC03 — Consultar produtos classificados por prioridade

**Pré-condições:** existe ao menos uma importação concluída, com o `id`
salvo no `localStorage` do navegador (UC01 já executado nesse navegador).

**Fluxo principal:**
1. Gestor acessa a tela Produtos (rota `/produtos`).
2. Frontend lê o `id` da última importação do `localStorage` e busca
   `GET /importacoes/{id}/resultados`.
3. Tela exibe uma tabela com nome, categoria, custo gerencial composto,
   preço de venda, giro (90d), classificação e desconto máximo sugerido em
   % e em R$ — uma linha por produto. Acima da tabela, um contador mostra
   quantos produtos foram encontrados.
4. Gestor busca produtos pelo nome ou código no campo de busca.
5. Gestor filtra por classificação (Alta/Média/Baixa/todas) via um seletor.
6. Gestor ordena a tabela clicando no cabeçalho de "Custo gerencial",
   "Giro (90d)", "Desconto máximo sugerido (%)" ou "Desconto máximo
   sugerido (R$)" (alterna crescente/decrescente a cada clique).
7. Gestor navega entre as páginas (Anterior/Próxima) e escolhe quantos
   itens ver por página (10, 25, 50 ou 100). Mudar a busca, o filtro ou a
   quantidade por página volta para a página 1.
8. Gestor passa o mouse (ou o foco do teclado) no ícone de interrogação de
   uma coluna para ver o que a métrica significa, com um exemplo.

**Fluxos alternativos / erro:**
- **Nenhuma importação registrada ainda** (sem `id` no `localStorage`):
  tela exibe "Nenhuma importação encontrada" com link para a tela de
  Upload, em vez da tabela.
- **Falha ao buscar resultados** (rede indisponível, CORS mal configurado,
  backend fora do ar): tela exibe a mensagem de erro retornada pela API
  (ou uma mensagem genérica, se a API não respondeu).
- **Busca ou filtro sem resultados** (ex.: nenhum produto "Prioridade
  Alta" no lote): tabela é exibida vazia, sem erro, e o botão de
  exportação fica desabilitado.
- **Produto sem giro ou sem preço de venda**: a célula exibe "-"; na
  ordenação, esses produtos ficam no início (crescente) ou no fim
  (decrescente).

---

## UC04 — Consultar desconto máximo sugerido de um produto

**Pré-condições:** produto já possui resultado de análise calculado (fez
parte de uma importação concluída).

**Fluxo principal:**
1. Gestor localiza o produto na tela Produtos (UC03).
2. Consulta as colunas "Desconto máximo sugerido (%)" e "Desconto máximo
   sugerido (R$)".
3. Cálculo (módulo 5): `preço_mínimo = custo_gerencial_composto ×
   (1 + margem_mínima%)`, `desconto (R$) = preço_venda − preço_mínimo` e
   `desconto (%) = desconto (R$) / preço_venda × 100`, com margem mínima
   padrão de 10%. Ex.: preço R$ 34,90 e custo gerencial R$ 22,69 →
   R$ 9,94 (28,48%).

**Fluxos alternativos / erro:**
- **Produto sem preço de venda cadastrado no CSV** (`preco_venda_unitario`
  vazio): as duas colunas exibem "-" — desconto não é calculável sem preço
  de venda.
- **Produto já vendido no prejuízo ou sem margem** (preço de venda menor ou
  igual ao custo gerencial composto mais a margem mínima): desconto máximo
  exibido é 0% / R$ 0,00 — não existe espaço para desconto sem violar a
  margem mínima configurada.

---

## UC05 — Exportar a lista de produtos

**Pré-condições:** tela Produtos carregada (UC03) com ao menos um produto
na lista filtrada.

**Fluxo principal:**
1. Gestor aplica, se quiser, busca, filtro e ordenação (UC03).
2. Clica em "Exportar Excel".
3. Navegador baixa o arquivo `produtos-stockwise-AAAA-MM-DD.csv` com as
   colunas Nome, Categoria, Custo gerencial, Preço de venda, Giro (90d),
   Classificação, Desconto máximo (%) e Desconto máximo (R$).
4. O arquivo contém todas as linhas que passaram pela busca e pelo filtro
   (não só a página atual), na ordenação atual, com `;` como delimitador,
   valores no formato BR e codificação UTF-8 com BOM, para abrir direto no
   Excel com acentos corretos.

**Fluxos alternativos / erro:**
- **Lista filtrada vazia**: botão "Exportar Excel" fica desabilitado.

---

## UC06 — Visualizar indicadores agregados no dashboard

**Pré-condições:** existe ao menos uma importação concluída, com o `id`
salvo no `localStorage`.

**Fluxo principal:**
1. Gestor acessa a tela Visão geral (rota `/dashboard`).
2. Frontend busca os mesmos resultados de `GET /importacoes/{id}/resultados`
   usados no UC03; todos os indicadores são calculados no navegador.
3. Tela exibe um resumo em texto: quantos produtos estão em Prioridade
   Alta, o valor imobilizado neles e o potencial de recuperação com os
   descontos sugeridos.
4. Tela exibe 8 indicadores, cada um com um ícone de interrogação que
   explica o cálculo:
   - **Total de produtos** analisados na importação;
   - **Valor total imobilizado**: soma do custo gerencial unitário de todos
     os produtos;
   - **Valor imobilizado (crítico)**: a mesma soma, só para Prioridade Alta;
   - **Potencial de recuperação**: soma do desconto máximo sugerido em R$
     (por unidade) de todos os produtos;
   - **Prioridade Alta** e **Prioridade Média**: quantidade de produtos em
     cada classificação (o card de Prioridade Alta tem um marcador de
     alerta);
   - **Risco de ruptura**: quantidade de produtos com estoque atual abaixo
     do estoque mínimo;
   - **Giro médio geral (90d)**: média simples do giro de 90 dias dos
     produtos que têm giro calculado.
5. Tela exibe um gráfico de barras com a quantidade de produtos por
   classificação (Alta/Média/Baixa).
6. Tela exibe o mapa de prioridade: um gráfico de dispersão em que cada
   produto é um ponto (giro 90d no eixo horizontal, custo gerencial no
   vertical), com cor e formato do marcador pela classificação. Linhas
   tracejadas marcam a mediana do lote e o quadrante "Parado e caro"
   (giro abaixo e custo acima da mediana) fica destacado. Ao passar o
   mouse, um tooltip mostra nome, classificação, custo e giro do produto.
7. Tela exibe um gráfico de barras horizontais com as 10 categorias de
   maior valor imobilizado (soma do custo gerencial), com cor mais forte
   para os maiores valores.
8. Tela exibe duas listas: os 5 produtos com maior custo gerencial e os 5
   produtos parados há mais tempo (em dias de estoque).

**Fluxos alternativos / erro:**
- **Nenhuma importação registrada**: mesmo estado vazio do UC03, com link
  para a tela de Upload.
- **Falha ao buscar resultados**: mesma mensagem de erro do UC03.
- **Nenhum produto "Prioridade Alta" no lote**: o resumo em texto exibe
  "Nenhum produto em prioridade alta neste momento — estoque saudável.";
  o valor imobilizado crítico é R$ 0,00 e a barra correspondente do
  gráfico fica zerada.
- **Nenhum produto com giro calculado**: o card de giro médio exibe "-" e
  o mapa de prioridade não é exibido.
- **Produto com estoque zerado** (giro indefinido): fica fora do mapa de
  prioridade, e o texto do card informa quantos produtos foram omitidos.
- **Produto sem categoria**: entra no gráfico de categorias como
  "Sem categoria".

---

## UC07 — Consultar a ajuda

**Pré-condições:** nenhuma.

**Fluxo principal:**
1. Gestor acessa a tela Ajuda (rota `/ajuda`).
2. Tela exibe o passo a passo de uso do sistema (importar, ver a visão
   geral, consultar produtos, planejar promoções).
3. Tela explica, com fórmula e exemplo numérico, o custo gerencial
   composto, o giro de estoque (90 dias), a classificação de prioridade e
   o desconto máximo sugerido.
4. Tela explica como a classificação foi validada com K-Means
   (concordância entre a regra e os agrupamentos do algoritmo, antes e
   depois do ajuste de pesos).
