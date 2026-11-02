import type { ReactNode } from "react";

const PASSOS = [
  "Importe o CSV do estoque na tela de Upload.",
  "Veja os indicadores gerais na Visão geral (produtos críticos, valor imobilizado, potencial de recuperação).",
  "Consulte a tabela de Produtos para detalhes por item e desconto máximo sugerido.",
  "Use os descontos sugeridos para planejar suas promoções.",
];

function BlocoFormula({ children }: { children: ReactNode }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-100 px-3 py-2.5 font-mono text-xs whitespace-pre-wrap text-slate-700">
      {children}
    </pre>
  );
}

export default function AjudaPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <h2 className="text-sm font-semibold text-slate-800">Como usar o StockWise</h2>
        <ol className="mt-4 space-y-3">
          {PASSOS.map((passo, indice) => (
            <li key={passo} className="flex gap-3 text-sm text-slate-700">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {indice + 1}
              </span>
              <span className="pt-0.5">{passo}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <h2 className="text-sm font-semibold text-slate-800">O que é o custo gerencial composto?</h2>
        <p className="mt-3 text-sm text-slate-600">
          É o custo de aquisição do produto somado aos custos de armazenagem e de oportunidade
          acumulados proporcionalmente ao tempo em estoque. Ele mostra o quanto um produto parado
          realmente custa para a empresa ao longo do tempo, não só o preço pago na compra. É a base
          usada para calcular o desconto máximo seguro de cada item e um dos fatores da classificação.
        </p>
        <BlocoFormula>
          {"Custo de armazenagem = Custo de aquisição × (% de armazenagem ao mês / 100) × (dias em estoque / 30)\n" +
            "Custo de oportunidade = Custo de aquisição × (% de oportunidade ao ano / 100) × (dias em estoque / 365)\n\n" +
            "Custo gerencial composto = Custo de aquisição + Custo de armazenagem + Custo de oportunidade"}
        </BlocoFormula>
        <p className="mt-3 text-sm text-slate-600">
          Exemplo: custo de aquisição R$ 100, armazenagem de 1,2% ao mês, custo de oportunidade de
          12% ao ano, 30 dias em estoque. Armazenagem = R$ 100 × 1,2% × (30/30) = R$ 1,20.
          Oportunidade = R$ 100 × 12% × (30/365) ≈ R$ 0,99. Custo gerencial composto = R$ 100 + R$
          1,20 + R$ 0,99 = R$ 102,19.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <h2 className="text-sm font-semibold text-slate-800">Giro de estoque (90 dias)</h2>
        <p className="mt-3 text-sm text-slate-600">
          Mede o ritmo de venda do estoque nos últimos 90 dias, projetado para um ano, para ficar na
          mesma escala dos giros de 30 e 180 dias e permitir comparação entre eles.
        </p>
        <BlocoFormula>
          {"Razão do período = Quantidade vendida em 90 dias / Quantidade em estoque atual\n" +
            "Giro (90 dias) = Razão do período × (365 / 90)"}
        </BlocoFormula>
        <p className="mt-3 text-sm text-slate-600">
          Exemplo: produto com 20 unidades vendidas e 10 em estoque. Razão do período = 20 / 10 =
          2,0. Anualizando: giro_90d = 2,0 × (365 / 90) ≈ 8,11.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <h2 className="text-sm font-semibold text-slate-800">Classificação (Prioridade Alta/Média/Baixa)</h2>
        <p className="mt-3 text-sm text-slate-600">
          É um score relativo de 0 a 1 que combina três fatores (custo gerencial, giro e nível de
          estoque), cada um comparado com os demais produtos do mesmo lote importado (posição
          relativa, não um valor absoluto). Custo e giro são os fatores principais (40% cada); o
          nível de estoque é um critério secundário (20%), já que o giro também mede o estoque em
          relação às vendas. O giro entra invertido na fórmula, porque giro baixo (produto parado)
          é o que deve aumentar a prioridade de ação.
        </p>
        <BlocoFormula>
          {"Posição no custo, Posição no giro, Posição no estoque = ranking do produto (de 0 a 1)\n" +
            "  comparado aos demais produtos do mesmo lote, considerando custo gerencial,\n" +
            "  giro (90 dias) e nível de estoque (estoque atual / estoque mínimo)\n\n" +
            "Pontuação de prioridade = 0,4 × Posição no custo + 0,4 × (1 − Posição no giro)\n" +
            "                          + 0,2 × Posição no estoque"}
        </BlocoFormula>
        <p className="mt-3 text-sm text-slate-600">
          Limiares: score ≥ 0,67 → Prioridade Alta · entre 0,34 e 0,67 → Prioridade Média · abaixo
          de 0,34 → Prioridade Baixa.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Exemplo: um produto caro e parado (giro baixo) fica no topo do rank de custo e de giro e
          soma 0,8 só com esses dois fatores → Prioridade Alta, mesmo que tenha pouco estoque em
          relação ao mínimo. Se além disso o estoque estiver bem acima do mínimo, o score chega
          perto de 1.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <h2 className="text-sm font-semibold text-slate-800">Como a classificação foi validada</h2>
        <p className="mt-3 text-sm text-slate-600">
          A classificação é uma regra definida por nós (pesos e limiares). Para conferir se ela
          reflete os padrões reais do estoque, usamos o K-Means, um algoritmo de aprendizado de
          máquina que separa os produtos em 3 grupos sozinho, olhando só para custo, giro e nível de
          estoque, sem conhecer a regra. Depois comparamos produto a produto: se o grupo do K-Means e
          a classificação coincidem, a regra está capturando um padrão que existe nos dados.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>
            <span className="font-semibold text-slate-800">Primeira versão (pesos iguais, 1/3 cada):</span>{" "}
            concordância de só 46%. O K-Means mostrou que peças caras e paradas costumam ter estoque
            próximo do mínimo, e esse fator anulava os outros dois: 48 de 56 produtos caíam em
            Prioridade Média.
          </li>
          <li>
            <span className="font-semibold text-slate-800">Versão atual (40% custo, 40% giro, 20% estoque):</span>{" "}
            concordância de 82%, com os produtos distribuídos entre Alta (13), Média (28) e Baixa (15).
          </li>
        </ul>
        <p className="mt-3 text-sm text-slate-600">
          As divergências restantes são produtos com pontuação perto dos limiares (0,34 e 0,67) ou
          casos em que a regra é mais adequada — por exemplo, um produto caro, parado e com muito
          estoque, que a regra corretamente coloca em Prioridade Alta. Números da base de exemplo
          usada no desenvolvimento; a análise completa está no notebook{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">backend/analysis/clustering_kmeans.ipynb</code>.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <h2 className="text-sm font-semibold text-slate-800">Desconto máximo sugerido</h2>
        <p className="mt-3 text-sm text-slate-600">
          Maior desconto que pode ser aplicado ao preço de venda sem que o preço final fique abaixo
          do custo gerencial composto mais uma margem mínima de segurança (10% por padrão).
        </p>
        <BlocoFormula>
          {"Preço mínimo = Custo gerencial composto × (1 + margem mínima)\n" +
            "Desconto máximo (R$) = Preço de venda − Preço mínimo\n" +
            "Desconto máximo (%) = Desconto máximo (R$) / Preço de venda × 100"}
        </BlocoFormula>
        <p className="mt-3 text-sm text-slate-600">
          Exemplo: preço R$ 34,90, custo gerencial R$ 22,69, margem 10% → preço mínimo = R$ 22,69 ×
          1,10 = R$ 24,96 → desconto máximo = R$ 34,90 − R$ 24,96 = R$ 9,94 (28,48%).
        </p>
      </div>
    </section>
  );
}
