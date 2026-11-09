import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { MemoryRouter } from "react-router";
import { AppLayout, type NavGroup } from "./AppLayout";

const groups: NavGroup[] = [
  { id: "a", label: "Alunos", items: [{ id: "lista", label: "Lista", href: "/alunos" }] },
  { id: "f", label: "Financeiro", items: [{ id: "cob", label: "Cobranças", href: "/cobrancas" }] },
];

function setup(activeId = "cob") {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AppLayout
          groups={groups}
          activeId={activeId}
          org="Alfa"
          roleLabel="Administrador"
          unit={(v) => <span data-testid={`unit-${v}`}>Tijuca</span>}
          bell={<button type="button">Sino</button>}
          userMenu={<button type="button">Conta</button>}
        >
          <h1>Conteúdo</h1>
        </AppLayout>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("AppLayout", () => {
  it("CA1: item ativo com aria-current e grupo dele aberto; menu só no desktop", () => {
    setup();
    const nav = screen.getByRole("navigation", { name: "Menu principal", hidden: true });
    expect(within(nav).getByRole("link", { name: "Cobranças", hidden: true })).toHaveAttribute("aria-current", "page");
    expect(within(nav).queryByRole("link", { name: "Lista", hidden: true })).not.toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Financeiro", hidden: true })).toHaveAttribute("aria-expanded", "true");
    expect(nav.closest("aside")).toHaveClass("hidden", "md:block");
  });

  it("CA2: gaveta abre com foco dentro, Esc fecha e devolve o foco ao botão", async () => {
    const user = userEvent.setup();
    setup();
    const botao = screen.getByRole("button", { name: "Menu" });
    await user.click(botao);
    const gaveta = screen.getByRole("dialog", { name: "Menu" });
    expect(gaveta).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(botao).toHaveFocus();
  });

  it("CA21: sem largura fixa em px; abas com alvo de 56 px", () => {
    setup();
    expect(screen.getByRole("button", { name: "Menu" })).toHaveClass("min-h-14");
    expect(document.body.innerHTML).not.toMatch(/\bw-\[\d+px\]/);
  });

  it("CA14: o link de pular leva o foco ao main", async () => {
    const user = userEvent.setup();
    setup();
    await user.tab();
    expect(screen.getByRole("link", { name: "Ir para o conteúdo" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("CA6: topbar com trilha, busca e ajuda desabilitadas com motivo, tema", () => {
    setup();
    const trilha = screen.getByRole("navigation", { name: "Você está em" });
    expect(within(trilha).getByText("Financeiro")).toBeInTheDocument();
    expect(within(trilha).getByText("Cobranças")).toHaveAttribute("aria-current", "page");
    const busca = screen.getByRole("button", { name: /^Buscar/ });
    expect(busca).toBeDisabled();
    expect(busca).toHaveAttribute("title", "Em breve");
    expect(busca).not.toHaveAttribute("aria-label");
    expect(screen.getAllByRole("button", { name: /^Ajuda, Em breve/ })[0]).toBeDisabled();
    expect(screen.getByRole("button", { name: /tema/i })).toBeInTheDocument();
  });

  it("CA6: ordem do desktop: trilha, unidade, busca, sino, tema, ajuda, divisória e conta", () => {
    setup();
    const header = screen.getByRole("banner");
    const ordem = [
      screen.getByRole("navigation", { name: "Você está em" }),
      screen.getByTestId("unit-desktop"),
      screen.getByRole("button", { name: /^Buscar/ }),
      screen.getByRole("button", { name: "Sino" }),
      screen.getByRole("button", { name: /tema/i }),
      screen.getByRole("button", { name: "Ajuda, Em breve" }),
      screen.getByRole("button", { name: "Conta" }),
    ];
    ordem.forEach((el, i) => {
      if (i > 0) expect(ordem[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(header).toContainElement(el);
    });
    expect(header).toHaveClass("flex-nowrap");
  });

  it("CA10: no celular a barra tem marca, título, unidade, lupa e sino; voltar só fora do Início", () => {
    const fora = setup("lista");
    const header = screen.getByRole("banner");
    expect(within(header).getByTestId("unit-compact")).toBeInTheDocument();
    expect(within(header).getByText("Lista", { selector: "span.truncate" })).toBeInTheDocument();
    expect(within(header).getByRole("link", { name: "Voltar ao Início" })).toBeInTheDocument();
    fora.unmount();
    setup("home");
    expect(screen.queryByRole("link", { name: "Voltar ao Início" })).toBeNull();
  });
});
