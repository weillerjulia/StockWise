import type { ReactNode } from "react";

const PASSOS = [
  "Importe o CSV do estoque na tela de Upload.",
  "Veja os indicadores gerais na Visão geral (produtos críticos, valor imobilizado, potencial de recuperação).",
  "Consulte a tabela de Produtos para detalhes por item e desconto máximo sugerido.",
  "Use os descontos sugeridos para planejar suas promoções.",
];

type LinhaExemplo = { nome: string; calculo: string; valor: string; destaque?: boolean };

const EXEMPLO_CUSTO_GERENCIAL: LinhaExemplo[] = [
  { nome: "Custo de aquisição", calculo: "—", valor: "R$ 100,00" },
  { nome: "Armazenagem", calculo: "100 × 1,2% × (90 ÷ 30)", valor: "R$ 3,60" },
  { nome: "Oportunidade", calculo: "100 × 12% × (90 ÷ 365)", valor: "R$ 2,96" },
  { nome: "Custo gerencial composto", calculo: "100 + 3,60 + 2,96", valor: "R$ 106,56", destaque: true },
];

const EXEMPLO_GIRO: LinhaExemplo[] = [
  { nome: "Razão do período", calculo: "20 ÷ 10", valor: "2,0" },
  { nome: "Giro (90 dias)", calculo: "2,0 × (365 ÷ 90)", valor: "8,11", destaque: true },
];

const EXEMPLO_CLASSIFICACAO: LinhaExemplo[] = [
  { nome: "Custo (topo do rank)", calculo: "0,4 × 1", valor: "0,40" },
  { nome: "Giro (o mais baixo do lote)", calculo: "0,4 × (1 − 0)", valor: "0,40" },
  { nome: "Estoque (pouco em relação ao mínimo)", calculo: "0,2 × 0", valor: "0,00" },
  { nome: "Pontuação de prioridade", calculo: "0,40 + 0,40 + 0,00", valor: "0,80", destaque: true },
];

const EXEMPLO_DESCONTO: LinhaExemplo[] = [
  { nome: "Preço mínimo", calculo: "22,69 × 1,10", valor: "R$ 24,96" },
  { nome: "Desconto máximo (R$)", calculo: "34,90 − 24,96", valor: "R$ 9,94", destaque: true },
  { nome: "Desconto máximo (%)", calculo: "9,94 ÷ 34,90 × 100", valor: "28,48%", destaque: true },
];

function BlocoFormula({ children }: { children: ReactNode }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-100 px-3 py-2.5 font-mono text-xs whitespace-pre-wrap text-slate-700">
      {children}
    </pre>
  );
}

function BlocoExemplo({
  entrada,
  colunaNome,
  linhas,
}: {
  entrada: string;
  colunaNome: string;
  linhas: LinhaExemplo[];
}) {
  return (
    <>
      <h3 className="mt-5 text-sm font-semibold text-slate-800">Exemplo</h3>
      <p className="mt-1 text-sm text-slate-600">{entrada}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-left text-xs font-medium tracking-wide text-slate-600 uppercase">
              <th className="pr-4 pb-2">{colunaNome}</th>
              <th className="pr-4 pb-2">Cálculo</th>
              <th className="pb-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {linhas.map((linha) => (
              <tr key={linha.nome} className={linha.destaque ? "font-semibold text-slate-800" : "text-slate-600"}>
                <td className="py-2 pr-4">{linha.nome}</td>
                <td className="py-2 pr-4">{linha.calculo}</td>
                <td className="py-2 text-right">{linha.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
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
        <BlocoExemplo
          entrada="Custo de aquisição: R$ 100 · Armazenagem: 1,2% ao mês · Oportunidade: 12% ao ano · 90 dias em estoque"
          colunaNome="Componente"
          linhas={EXEMPLO_CUSTO_GERENCIAL}
        />
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
        <BlocoExemplo
          entrada="Vendidas em 90 dias: 20 unidades · Em estoque: 10 unidades"
          colunaNome="Etapa"
          linhas={EXEMPLO_GIRO}
        />
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
        <BlocoExemplo
          entrada="Produto caro e parado (giro baixo), com pouco estoque em relação ao mínimo"
          colunaNome="Fator"
          linhas={EXEMPLO_CLASSIFICACAO}
        />
        <p className="mt-3 text-sm text-slate-600">
          Com 0,80 o produto fica em Prioridade Alta, mesmo com pouco estoque. Se além disso o
          estoque estiver bem acima do mínimo, o score chega perto de 1.
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
        <BlocoExemplo
          entrada="Preço de venda: R$ 34,90 · Custo gerencial: R$ 22,69 · Margem mínima: 10%"
          colunaNome="Etapa"
          linhas={EXEMPLO_DESCONTO}
        />
      </div>
    </section>
  );
}
