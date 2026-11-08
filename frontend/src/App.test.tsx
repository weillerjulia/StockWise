import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renderiza o título StockWise", () => {
    render(<App />);

    // O nome é dividido em "Stock" + <span>Wise</span> para colorir cada parte.
    expect(
      screen.getByText((_, elemento) => elemento?.tagName === "SPAN" && elemento.textContent === "StockWise"),
    ).toBeInTheDocument();
  });
});
