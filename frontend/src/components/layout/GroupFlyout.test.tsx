import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Sidebar } from "./Sidebar";
import type { NavGroup } from "./AppLayout";

const groups: NavGroup[] = [
  { id: "home", label: "Início", items: [{ id: "home", label: "Início", href: "/", icon: "House" }] },
  {
    id: "ops",
    label: "Operação",
    icon: "Dumbbell",
    items: [
      { id: "agenda", label: "Agenda", href: "/agenda" },
      { id: "requests", label: "Pedidos", href: "/pedidos" },
      { id: "future", label: "Frequência", href: "/frequencia", disabled: true },
    ],
  },
  { id: "fin", label: "Financeiro", icon: "Wallet", items: [{ id: "plans", label: "Planos", href: "/planos" }] },
];

const ui = (activeId = "home", badges = {}) => (
  <MemoryRouter>
    <Sidebar groups={groups} activeId={activeId} badges={badges} collapsed onToggle={() => {}} />
  </MemoryRouter>
);

describe("GroupFlyout (painel do menu recolhido)", () => {
  it("CA4: abre ao lado com o título, o contador e o subitem futuro desabilitado com Em breve", async () => {
    const user = userEvent.setup();
    render(ui("home", { requests: 4 }));
    await user.click(screen.getByRole("button", { name: "Operação" }));
    const panel = screen.getByRole("dialog", { name: "Operação" });
    expect(panel).toHaveTextContent("Operação");
    expect(screen.getByRole("link", { name: /Pedidos/ })).toHaveTextContent("4");
    const future = screen.getByRole("button", { name: /Frequência/ });
    expect(future).toBeDisabled();
    expect(future).toHaveTextContent("Em breve");
    expect(panel.querySelector("svg")).toBeNull();
  });

  it("CA6: Enter abre com o foco no primeiro subitem; Esc fecha e devolve o foco ao ícone", async () => {
    const user = userEvent.setup();
    render(ui());
    const btn = screen.getByRole("button", { name: "Operação" });
    btn.focus();
    await user.keyboard("{Enter}");
    expect(btn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Agenda" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(btn).toHaveAttribute("aria-expanded", "false");
    expect(btn).toHaveFocus();
  });

  it("CA5: clique fora fecha; abrir outro grupo troca o painel; clicar no subitem navega e fecha", async () => {
    const user = userEvent.setup();
    render(ui());
    await user.click(screen.getByRole("button", { name: "Operação" }));
    await user.click(screen.getByRole("button", { name: "Financeiro" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("dialog", { name: "Financeiro" })).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Operação" }));
    await user.click(screen.getByRole("link", { name: "Agenda" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
