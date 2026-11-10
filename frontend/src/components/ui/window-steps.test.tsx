import { render, screen } from "@testing-library/react";
import { WindowSteps } from "./window-steps";

it("CA1: passo concluído com marca, atual com aria-current, futuro com número e texto para leitor de tela", () => {
  render(<WindowSteps steps={["Dados", "Revisão", "Fim"]} current={2} />);
  const [first, second, third] = screen.getAllByRole("listitem");
  expect(first.querySelector("svg")).not.toBeNull();
  expect(first).not.toHaveAttribute("aria-current");
  expect(second).toHaveAttribute("aria-current", "step");
  expect(third).toHaveTextContent("3");
  expect(screen.getByText("Passo 2 de 3")).toHaveClass("sr-only");
});
