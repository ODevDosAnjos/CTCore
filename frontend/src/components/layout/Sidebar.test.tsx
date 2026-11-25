import { render as rtlRender, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Sidebar } from "./Sidebar";
import type { NavGroup } from "./AppLayout";
import { useSidebarCollapsed } from "./useSidebarCollapsed";
import { MemoryRouter } from "react-router";

const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: MemoryRouter });

const groups: NavGroup[] = [
  { id: "home", label: "Início", items: [{ id: "home", label: "Início", href: "/", icon: "House" }] },
  {
    id: "people",
    label: "Pessoas",
    icon: "Users",
    items: [
      { id: "students", label: "Alunos", href: "/alunos", icon: "Users" },
      { id: "requests", label: "Pedidos", href: "/pedidos", icon: "Inbox" },
    ],
  },
  { id: "fin", label: "Financeiro", icon: "Wallet", items: [{ id: "plans", label: "Planos", href: "/planos" }] },
  { id: "reports", label: "Relatórios", items: [{ id: "reports", label: "Relatórios", href: "/relatorios", icon: "ChartColumn", disabled: true }] },
];

describe("Sidebar", () => {
  it("CA9 (D3): acordeão: ao mudar o item ativo o grupo dele abre e os outros fecham; dentro do mesmo grupo nada fecha", () => {
    const { rerender } = render(<Sidebar groups={groups} activeId="students" />);
    expect(screen.getByRole("button", { name: "Pessoas" })).toHaveAttribute("aria-expanded", "true");
    rerender(<Sidebar groups={groups} activeId="requests" />);
    expect(screen.getByRole("button", { name: "Pessoas" })).toHaveAttribute("aria-expanded", "true");
    rerender(<Sidebar groups={groups} activeId="plans" />);
    expect(screen.getByRole("button", { name: "Financeiro" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Pessoas" })).toHaveAttribute("aria-expanded", "false");
    rerender(<Sidebar groups={groups} activeId="" />);
    expect(screen.getByRole("button", { name: "Financeiro" })).toHaveAttribute("aria-expanded", "true");
  });

  it("CA9: abrir um grupo à mão fecha o que estava aberto", async () => {
    const user = userEvent.setup();
    render(<Sidebar groups={groups} activeId="students" />);
    await user.click(screen.getByRole("button", { name: "Financeiro" }));
    expect(screen.getByRole("button", { name: "Pessoas" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Alunos" })).toBeNull();
  });

  it("CA10: recolhido e depois expandido abre o grupo da página atual", () => {
    const { rerender } = render(<Sidebar groups={groups} activeId="students" />);
    rerender(<Sidebar groups={groups} activeId="students" collapsed />);
    rerender(<Sidebar groups={groups} activeId="plans" collapsed />);
    rerender(<Sidebar groups={groups} activeId="plans" />);
    expect(screen.getByRole("button", { name: "Financeiro" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Pessoas" })).toHaveAttribute("aria-expanded", "false");
  });

  it("CA1: só Início e os grupos têm ícone; subitens só com texto, recuados com a linha vertical", () => {
    render(<Sidebar groups={groups} activeId="students" />);
    expect(screen.getByRole("link", { name: "Início" }).querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Pessoas" }).querySelectorAll("svg")).toHaveLength(2);
    for (const n of ["Alunos", "Pedidos"]) expect(screen.getByRole("link", { name: n }).querySelector("svg")).toBeNull();
    expect(screen.getByRole("link", { name: "Alunos" }).parentElement).toHaveClass("border-l", "ml-5");
  });

  it("CA1: fundo do token, organização, área, grupos com aria-expanded e item ativo", async () => {
    const user = userEvent.setup();
    const { container } = render(<Sidebar groups={groups} activeId="students" org="Academia Leão" roleLabel="Coordenador" />);
    expect(container.firstChild).toHaveClass("bg-sidebar", "w-62");
    expect(screen.getByText("Academia Leão")).toBeInTheDocument();
    expect(screen.getByText("Gestão · Coordenador")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Alunos/ })).toHaveAttribute("aria-current", "page");
    const pessoas = screen.getByRole("button", { name: "Pessoas" });
    expect(pessoas).toHaveAttribute("aria-expanded", "true");
    expect(pessoas.querySelector("svg:last-child")).toHaveClass("rotate-90");
    const fin = screen.getByRole("button", { name: "Financeiro" });
    expect(fin).toHaveAttribute("aria-expanded", "false");
    expect(fin.querySelector("svg:last-child")).not.toHaveClass("rotate-90");
    expect(fin.querySelectorAll("svg")).toHaveLength(2);
    await user.click(fin);
    expect(fin).toHaveAttribute("aria-expanded", "true");
    expect(pessoas).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: "Planos" })).toBeInTheDocument();
  });

  it("CA2: Início e Relatórios são itens diretos, sem seta; item futuro desabilitado com Em breve", async () => {
    const user = userEvent.setup();
    render(<Sidebar groups={groups} activeId="home" />);
    expect(screen.getByRole("link", { name: "Início" }).querySelector("svg:last-child")).toBeNull();
    expect(screen.queryByRole("button", { name: "Relatórios", expanded: false })).toBeNull();
    const soon = screen.getByRole("button", { name: "Relatórios" });
    expect(soon).toBeDisabled();
    expect(soon).toHaveAttribute("title", "Em breve");
    await user.click(soon);
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");
  });

  it.each([
    [3, "3"],
    [150, "99+"],
  ])("CA2: contador %i vira %s e zero some", (n, text) => {
    const { rerender } = render(<Sidebar groups={groups} activeId="students" badges={{ requests: n }} />);
    expect(screen.getByRole("link", { name: /Pedidos/ })).toHaveTextContent(text);
    rerender(<Sidebar groups={groups} activeId="students" badges={{ requests: 0 }} />);
    expect(screen.getByRole("link", { name: "Pedidos" })).toHaveTextContent(/^Pedidos$/);
  });

  it("CA3: Ajuda e Novidades desabilitadas com motivo e assinatura do produto", () => {
    render(<Sidebar groups={groups} activeId="home" />);
    expect(screen.getByRole("button", { name: /Ajuda/ })).toBeDisabled();
    expect(within(screen.getByRole("button", { name: "Ajuda" })).getByText("Ajuda")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Novidades/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ajuda" })).toHaveAttribute("title", "Em breve");
    expect(screen.getByRole("button", { name: "Novidades" })).toHaveTextContent(/^Novidades$/);
    expect(screen.getByText("feito com ctcore")).toBeInTheDocument();
  });

  it("CA3: recolhido tem 72 px e só ícones: Início, um botão por grupo e rodapé, sem links de subitem", () => {
    const { container } = render(<Sidebar groups={groups} activeId="home" collapsed onToggle={() => {}} />);
    expect(container.firstChild).toHaveClass("w-18");
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("title", "Início");
    const pessoas = screen.getByRole("button", { name: "Pessoas" });
    expect(pessoas).toHaveAttribute("title", "Pessoas");
    expect(pessoas).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Alunos" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Planos" })).toBeNull();
    expect(screen.getByRole("button", { name: "Relatórios, Em breve" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Expandir menu" })).toBeInTheDocument();
  });

  it("CA8: no recolhido Início é link direto, sem painel", async () => {
    const user = userEvent.setup();
    render(<Sidebar groups={groups} activeId="students" collapsed />);
    await user.click(screen.getByRole("link", { name: "Início" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

function Probe() {
  const [c, toggle] = useSidebarCollapsed();
  return <button onClick={toggle}>{c ? "fechado" : "aberto"}</button>;
}

describe("useSidebarCollapsed", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("CA4: guarda a escolha e volta recolhido ao recarregar", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Probe />);
    await user.click(screen.getByRole("button", { name: "aberto" }));
    unmount();
    render(<Probe />);
    expect(screen.getByRole("button", { name: "fechado" })).toBeInTheDocument();
  });

  it("CA4: sem localStorage funciona aberto", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    render(<Probe />);
    expect(screen.getByRole("button", { name: "aberto" })).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button", { name: "fechado" })).toBeInTheDocument();
  });

  it("CA12: o rodapé do desktop não tem Sair; a variante menu tem seletor, grupos abertos, tema, Minha conta e Sair", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    const { rerender } = render(<Sidebar groups={groups} activeId="home" onLogout={onLogout} />);
    expect(screen.queryByRole("button", { name: "Sair da conta" })).toBeNull();
    rerender(
      <ThemeProvider>
        <Sidebar groups={groups} activeId="home" onLogout={onLogout} variant="menu" unitSlot={<span>Tijuca</span>} collapsed />
      </ThemeProvider>,
    );
    expect(screen.getByText("Tijuca")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Financeiro" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Planos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Minha conta" })).toHaveAttribute("href", "/conta");
    const tema = screen.getByRole("switch", { name: "Tema escuro" });
    const before = tema.getAttribute("aria-checked");
    await user.click(tema);
    expect(tema.getAttribute("aria-checked")).not.toBe(before);
    await user.click(screen.getByRole("button", { name: "Sair da conta" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
    rerender(
      <ThemeProvider>
        <Sidebar groups={groups} activeId="home" variant="menu" />
      </ThemeProvider>,
    );
    expect(screen.queryByRole("button", { name: "Sair da conta" })).toBeNull();
  });
});
