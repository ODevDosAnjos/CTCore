import { render, screen } from "@testing-library/react";
import { SummaryBox } from "./summary-box";

it("CA19: itens em lista com seta", () => {
  render(<SummaryBox items={["Cancela a matrícula", "Mantém o histórico"]} />);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByRole("list").querySelectorAll("svg")).toHaveLength(2);
});

it("CA1: com rótulo, aparece em caixa alta; sem rótulo, não há rótulo", () => {
  const { rerender } = render(<SummaryBox items={["x"]} label="Resumo" />);
  expect(screen.getByText("Resumo")).toHaveClass("uppercase");
  rerender(<SummaryBox items={["x"]} />);
  expect(screen.queryByText("Resumo")).toBeNull();
});
