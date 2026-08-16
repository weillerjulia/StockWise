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
          realmente custa para a empresa ao longo do tempo, não só o preço pago na compra — é a base
          usada para calcular giro, classificação e o desconto máximo seguro de cada item.
        </p>
        <BlocoFormula>
          {"custo_armazenagem = custo_aquisicao × (armazenagem_%_mensal / 100) × (dias_em_estoque / 30)\n" +
            "custo_oportunidade = custo_aquisicao × (taxa_oportunidade_%_anual / 100) × (dias_em_estoque / 365)\n\n" +
            "custo_gerencial_composto = custo_aquisicao + custo_armazenagem + custo_oportunidade"}
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
          Mede quantas vezes o estoque girou (foi vendido em relação ao que havia disponível) nos
          últimos 90 dias. O resultado é anualizado para ficar na mesma escala dos giros de 30 e 180
          dias e permitir comparação entre eles.
        </p>
        <BlocoFormula>
          {"razão do período = qtd_vendida_90d / quantidade_estoque_atual\n" +
            "giro_90d = razão do período × (365 / 90)"}
        </BlocoFormula>
        <p className="mt-3 text-sm text-slate-600">
          Exemplo: produto com 20 unidades vendidas e 10 em estoque. Razão do período = 20 / 10 =
          2,0. Anualizando: giro_90d = 2,0 × (365 / 90) ≈ 8,11.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <h2 className="text-sm font-semibold text-slate-800">Classificação (Prioridade Alta/Média/Baixa)</h2>
        <p className="mt-3 text-sm text-slate-600">
          É um score relativo de 0 a 1 que combina três fatores com peso igual — custo gerencial,
          giro e nível de estoque — cada um comparado com os demais produtos do mesmo lote
          importado (posição relativa, não um valor absoluto). O giro entra invertido na fórmula,
          porque giro baixo (produto parado) é o que deve aumentar a prioridade de ação.
        </p>
        <BlocoFormula>
          {"rank_custo, rank_giro, rank_estoque = posição relativa (0 a 1) do produto\n" +
            "  dentro do lote, para custo gerencial, giro (90d) e razão de estoque\n" +
            "  (quantidade_estoque_atual / estoque_minimo)\n\n" +
            "score = (rank_custo + (1 − rank_giro) + rank_estoque) / 3"}
        </BlocoFormula>
        <p className="mt-3 text-sm text-slate-600">
          Limiares: score ≥ 0,67 → Prioridade Alta · entre 0,34 e 0,67 → Prioridade Média · abaixo
          de 0,34 → Prioridade Baixa.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Exemplo: um produto caro, parado (giro baixo) e com estoque bem acima do mínimo tende a
          ficar perto do topo do rank nas três dimensões, resultando em score próximo de 1 →
          Prioridade Alta.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
        <h2 className="text-sm font-semibold text-slate-800">Desconto máximo sugerido</h2>
        <p className="mt-3 text-sm text-slate-600">
          Maior desconto que pode ser aplicado ao preço de venda sem que o preço final fique abaixo
          do custo gerencial composto mais uma margem mínima de segurança (10% por padrão).
        </p>
        <BlocoFormula>
          {"preço_mínimo = custo_gerencial_composto × (1 + margem_mínima)\n" +
            "desconto_máximo (R$) = preço_venda_unitário − preço_mínimo\n" +
            "desconto_máximo (%) = desconto_máximo (R$) / preço_venda_unitário × 100"}
        </BlocoFormula>
        <p className="mt-3 text-sm text-slate-600">
          Exemplo: preço R$ 34,90, custo gerencial R$ 22,69, margem 10% → preço mínimo = R$ 22,69 ×
          1,10 = R$ 24,96 → desconto máximo = R$ 34,90 − R$ 24,96 = R$ 9,94 (28,48%).
        </p>
      </div>
    </section>
  );
}
