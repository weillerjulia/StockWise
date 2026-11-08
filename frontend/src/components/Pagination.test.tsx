import { describe, expect, it } from "vitest";

import { calcularPaginasVisiveis } from "./Pagination";

describe("calcularPaginasVisiveis", () => {
  it("lista todas as páginas quando são poucas", () => {
    expect(calcularPaginasVisiveis(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("usa reticências no fim quando está no começo", () => {
    expect(calcularPaginasVisiveis(1, 20)).toEqual([1, 2, 3, 4, "reticencias-fim", 20]);
  });

  it("usa reticências dos dois lados no meio", () => {
    expect(calcularPaginasVisiveis(10, 20)).toEqual([
      1,
      "reticencias-inicio",
      9,
      10,
      11,
      "reticencias-fim",
      20,
    ]);
  });

  it("usa reticências no início quando está no fim", () => {
    expect(calcularPaginasVisiveis(20, 20)).toEqual([1, "reticencias-inicio", 17, 18, 19, 20]);
  });

  it("mostra o número em vez de reticências quando falta só uma página", () => {
    expect(calcularPaginasVisiveis(4, 20)).toEqual([1, 2, 3, 4, 5, "reticencias-fim", 20]);
  });
});
