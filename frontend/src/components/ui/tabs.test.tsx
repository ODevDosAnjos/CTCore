import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "./tabs";

describe("Tabs (CA13)", () => {
  it("setas, Home e End movem foco e aba ativa; só o painel ativo aparece", async () => {
    const u = userEvent.setup();
    render(
      <Tabs
        label="Seções"
        tabs={[
          { id: "a", label: "A", content: <p>painel a</p> },
          { id: "b", label: "B", content: <p>painel b</p> },
          { id: "c", label: "C", content: <p>painel c</p> },
        ]}
      />,
    );
    const [a, b, c] = screen.getAllByRole("tab");
    expect(a).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("painel a");
    a.focus();
    await u.keyboard("{ArrowRight}");
    expect(b).toHaveFocus();
    expect(b).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText("painel a")).not.toBeInTheDocument();
    await u.keyboard("{End}");
    expect(c).toHaveFocus();
    await u.keyboard("{ArrowRight}");
    expect(a).toHaveFocus();
    await u.keyboard("{ArrowLeft}");
    expect(c).toHaveFocus();
    await u.keyboard("{Home}");
    expect(a).toHaveFocus();
    expect(a).toHaveAttribute("tabindex", "0");
    expect(b).toHaveAttribute("tabindex", "-1");
  });

  it("controlada: a aba ativa é a de `value`, `onValueChange` recebe o clique e a marca (`badge`) fica depois do rótulo", async () => {
    const u = userEvent.setup();
    const seen: string[] = [];
    const tabs = [
      { id: "a", label: "A", content: <p>painel a</p>, badge: <span data-testid="marca" /> },
      { id: "b", label: "B", content: <p>painel b</p> },
    ];
    const { rerender } = render(<Tabs label="Seções" tabs={tabs} value="b" onValueChange={(id) => seen.push(id)} />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("painel b");
    expect(screen.getByRole("tab", { name: "A" })).toContainElement(screen.getByTestId("marca"));
    await u.click(screen.getByRole("tab", { name: "A" }));
    expect(seen).toEqual(["a"]);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("painel b"); // quem controla decide
    rerender(<Tabs label="Seções" tabs={tabs} value="a" onValueChange={(id) => seen.push(id)} />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("painel a");
  });
});
