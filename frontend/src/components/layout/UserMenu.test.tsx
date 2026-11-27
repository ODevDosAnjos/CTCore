import { fireEvent, render, screen } from "@testing-library/react";
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

  it("#763 CA6: com foto o avatar mostra a imagem; se ela falha, voltam as iniciais e avisa", () => {
    const onPhotoError = vi.fn();
    const menu = (url: string) => (
      <MemoryRouter>
        <UserMenu name="Ana Souza" photoUrl={url} onPhotoError={onPhotoError} />
      </MemoryRouter>
    );
    const { container, rerender } = render(menu("https://arquivos.test/a.png"));
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("src", "https://arquivos.test/a.png");
    expect(screen.queryByText("AS")).not.toBeInTheDocument();
    fireEvent.error(img);
    expect(onPhotoError).toHaveBeenCalledTimes(1);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("AS")).toBeInTheDocument();
    rerender(menu("https://arquivos.test/b.png"));
    expect(container.querySelector("img")).toHaveAttribute("src", "https://arquivos.test/b.png");
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
