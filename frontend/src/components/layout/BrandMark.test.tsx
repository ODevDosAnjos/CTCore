import { render, screen } from "@testing-library/react";
import { BrandMark } from "./BrandMark";

describe("BrandMark", () => {
  it("CA1: logo com a inicial da organização e o nome em fonte de título", () => {
    const { container } = render(<BrandMark org="Academia Leão" />);
    expect(container.querySelector("[aria-hidden=true]")).toHaveTextContent("A");
    expect(screen.getByText("Academia Leão")).toHaveClass("font-heading", "uppercase");
  });

  it("compacto mostra só o logo; sem organização usa o nome do produto", () => {
    const { container, rerender } = render(<BrandMark compact org="Beta" />);
    expect(screen.queryByText("Beta")).toBeNull();
    expect(container.querySelector("[aria-hidden=true]")).toHaveTextContent("B");
    rerender(<BrandMark />);
    expect(screen.getByText("ctcore")).toBeInTheDocument();
  });
});
