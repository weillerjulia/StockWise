import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AjudaPage from "./AjudaPage";

describe("AjudaPage", () => {
  it("explica os selos de desconto zero e quando aparecem", () => {
    render(<AjudaPage />);

    expect(screen.getByRole("heading", { name: "Quando o desconto é zero" })).toBeInTheDocument();
    expect(screen.getByText("Prejuízo")).toBeInTheDocument();
    expect(screen.getByText("Sem margem")).toBeInTheDocument();
    expect(screen.getByText("No limite")).toBeInTheDocument();
    expect(screen.getByText("Preço igual ao preço mínimo")).toBeInTheDocument();
  });
});
