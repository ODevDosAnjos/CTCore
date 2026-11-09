import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { UserMenu } from "./UserMenu";

const setup = (onLogout?: () => void) =>
  render(
    <MemoryRouter>
      <UserMenu name="Ana Souza" roleLabel="Coordenador" onLogout={onLogout} />
    </MemoryRouter>,
  );

describe("UserMenu", () => {
  it("CA7: mostra nome e perfil; abre com Minha conta e Sair da conta e sair chama a ação", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    setup(onLogout);
    const botao = screen.getByRole("button", { name: /Ana Souza/ });
    expect(botao).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Coordenador")).toBeInTheDocument();
    await user.click(botao);
    expect(screen.getByRole("menuitem", { name: "Minha conta" })).toHaveAttribute("href", "/conta");
    await user.click(screen.getByRole("menuitem", { name: "Sair da conta" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("CA7: Esc fecha e devolve o foco ao botão; clique fora fecha; sem onLogout não há Sair", async () => {
    const user = userEvent.setup();
    setup();
    const botao = screen.getByRole("button", { name: /Ana Souza/ });
    await user.click(botao);
    expect(screen.queryByRole("menuitem", { name: "Sair da conta" })).toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(botao).toHaveFocus();
    await user.click(botao);
    await user.click(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
