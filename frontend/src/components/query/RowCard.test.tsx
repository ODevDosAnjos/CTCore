import { render, screen } from "@testing-library/react";
import { RowCard } from "./RowCard";

describe("RowCard", () => {
  it("CA1: mostra lead, título, apoio, selo e ação, com a ação por último e com 44 px", () => {
    const { container } = render(<RowCard lead={<i>L</i>} title="Ana" meta={<span>Apoio</span>} badge={<b>Ativo</b>} action={<button>Ver</button>} />);
    const root = container.firstElementChild!;
    expect(root.firstElementChild).toHaveTextContent("L");
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Apoio")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    const action = root.lastElementChild!;
    expect(action).toContainElement(screen.getByRole("button", { name: "Ver" }));
    expect(action).toHaveClass("min-h-11");
  });

  it("CA1: sem lead, selo e ação não deixa lacunas", () => {
    const { container } = render(<RowCard title="Ana" />);
    const root = container.firstElementChild!;
    expect(root.children).toHaveLength(1);
    expect(root.querySelector("div > div > *:nth-child(2)")).toBeNull();
  });
});
