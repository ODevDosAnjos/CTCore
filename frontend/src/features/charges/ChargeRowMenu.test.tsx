import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { axeViolations } from "@/test/axe";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { ChargeRowMenu } from "./ChargeRowMenu";

const onOpen = vi.fn();
const setup = () => {
  onOpen.mockClear();
  return render(
    <ThemeProvider>
      <ChargeRowMenu label="Ações da cobrança de Ana Souza" onOpen={onOpen} />
    </ThemeProvider>,
  );
};

describe("ChargeRowMenu (D6, CA6)", () => {
  it("tem rótulo, abre pelo teclado, lista Abrir cobrança ativo e as demais ações Em breve", async () => {
    const user = userEvent.setup();
    setup();
    const button = screen.getByRole("button", { name: "Ações da cobrança de Ana Souza" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "Abrir cobrança" })).not.toHaveAttribute("aria-disabled");
    for (const name of ["Registrar pagamento", "Cancelar cobrança", "Renegociar"]) expect(screen.getByRole("menuitem", { name })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByText("Em breve")).toHaveLength(3);
    await user.click(screen.getByRole("menuitem", { name: "Registrar pagamento" }));
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("Abrir cobrança chama onOpen e fecha o menu; Esc fecha e devolve o foco ao botão", async () => {
    const user = userEvent.setup();
    setup();
    const button = screen.getByRole("button", { name: "Ações da cobrança de Ana Souza" });
    await user.click(button);
    await user.click(screen.getByRole("menuitem", { name: "Abrir cobrança" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).toBeNull();
    await user.click(button);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(button).toHaveFocus();
  });

  it("não tem violações no axe com o menu aberto", async () => {
    const user = userEvent.setup();
    const { container } = setup();
    await user.click(screen.getByRole("button", { name: "Ações da cobrança de Ana Souza" }));
    expect(await axeViolations(container)).toEqual([]);
  });
});
