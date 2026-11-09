import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { QuickFilters } from "./quick-filters";

describe("QuickFilters (CA12)", () => {
  it("marca a opção ativa, mostra o contador e chama onChange com a chave", async () => {
    const onChange = vi.fn();
    render(
      <QuickFilters
        value="all"
        onChange={onChange}
        options={[
          { key: "all", label: "Todos", count: 12 },
          { key: "late", label: "Em atraso", count: 3 },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Todos, 12" })).toHaveAttribute("aria-pressed", "true");
    const late = screen.getByRole("button", { name: "Em atraso, 3" });
    expect(late).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(late);
    expect(onChange).toHaveBeenCalledWith("late");
  });
});

describe("QuickFilters com soon (CA1)", () => {
  it("mostra a opção soon desabilitada, com selo, sem chamar onChange", async () => {
    const onChange = vi.fn();
    render(<QuickFilters value="" onChange={onChange} options={[{ key: "a", label: "Ativos" }, { key: "b", label: "Bloqueados", soon: true }]} />);
    const soon = screen.getByRole("button", { name: "Bloqueados" });
    expect(soon).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Em breve")).toBeInTheDocument();
    await userEvent.click(soon);
    expect(onChange).not.toHaveBeenCalled();
  });
});

it("o texto visível com a contagem está contido no nome acessível (axe label-content-name-mismatch)", async () => {
  const { container } = render(<QuickFilters value="a" onChange={() => {}} options={[{ key: "a", label: "Ativos", count: 3 }]} />);
  expect(container.textContent).toBe("Ativos 3");
  const { axeViolations } = await import("@/test/axe");
  expect(await axeViolations(container)).toEqual([]);
});
