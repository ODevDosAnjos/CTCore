import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";
import { SessionProvider } from "@/features/auth/SessionProvider";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { ChargeRowMenu } from "./ChargeRowMenu";
import type { ChargeRow } from "./types";

const onOpen = vi.fn();
const onDone = vi.fn();
const row = (over: Partial<ChargeRow> = {}): ChargeRow => ({
  id: "c1", student: { id: "s1", name: "Ana Souza", photoUrl: null }, unit: { id: "u1", name: "Centro" }, type: "MONTHLY", modality: { id: "m1", name: "Jiu-Jitsu" },
  referenceMonth: "2026-03-01", description: null, amountCents: 12000, dueOn: "2026-03-05", status: "OVERDUE", payment: null, daysLate: 3, ...over,
});
const setup = (over: Partial<ChargeRow> = {}) => {
  onOpen.mockClear();
  onDone.mockClear();
  server.use(http.get("/api/v1/auth/session", () => HttpResponse.json({ account: { id: "a", email: "x@x.com", name: "Carla Mendes" }, links: [], twoFactor: { enabled: false, required: false } })));
  return render(
    <ThemeProvider>
      <SessionProvider>
        <ChargeRowMenu row={row(over)} label="Ações da cobrança de Ana Souza" onOpen={onOpen} onDone={onDone} />
      </SessionProvider>
    </ThemeProvider>,
  );
};
const openMenu = async (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Ações da cobrança de Ana Souza" }));

describe("ChargeRowMenu (D6, CA17)", () => {
  it("tem rótulo, abre pelo teclado e, numa cobrança em aberto, lista Abrir e as três janelas ativas; Estornar fica Em breve", async () => {
    const user = userEvent.setup();
    setup();
    const button = screen.getByRole("button", { name: "Ações da cobrança de Ana Souza" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    for (const name of ["Abrir cobrança", "Registrar pagamento", "Renegociar", "Cancelar cobrança"]) expect(screen.getByRole("menuitem", { name })).not.toHaveAttribute("aria-disabled");
    expect(screen.getByRole("menuitem", { name: "Estornar" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Em breve")).toBeInTheDocument();
  });

  it("Registrar pagamento, Renegociar e Cancelar cobrança abrem a janela certa e fecham o menu", async () => {
    const user = userEvent.setup();
    setup();
    for (const [item, title] of [["Registrar pagamento", "Registrar pagamento"], ["Renegociar", "Renegociar"], ["Cancelar cobrança", "Cancelar cobrança"]] as const) {
      await openMenu(user);
      await user.click(screen.getByRole("menuitem", { name: item }));
      expect(screen.queryByRole("menu")).toBeNull();
      const dialog = await screen.findByRole("dialog", { name: title });
      await user.click(within(dialog).getByRole("button", { name: title === "Renegociar" ? "Cancelar" : title === "Cancelar cobrança" ? "Voltar" : "Cancelar" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    }
    expect(onDone).not.toHaveBeenCalled();
  });

  it("ao concluir o cancelamento a lista é recarregada", async () => {
    const user = userEvent.setup();
    server.use(http.post("/api/v1/charges/c1/cancel", () => HttpResponse.json({})));
    setup();
    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Cancelar cobrança" }));
    const dialog = await screen.findByRole("dialog", { name: "Cancelar cobrança" });
    await user.type(within(dialog).getByRole("textbox", { name: /Motivo/ }), "Duplicada");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar cobrança" }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });

  it("ao fechar o recibo depois de registrar o pagamento a lista é recarregada", async () => {
    const user = userEvent.setup();
    server.use(http.post("/api/v1/charges/c1/payments", () => HttpResponse.json({ id: "p", chargeId: "c1", receipt: { number: 3, code: "ABCDEF0123456789" }, receiptEmail: "NOT_REQUESTED" }, { status: 201 })));
    setup();
    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Registrar pagamento" }));
    const dialog = await screen.findByRole("dialog", { name: "Registrar pagamento" });
    await user.click(within(dialog).getByRole("button", { name: "Registrar pagamento" }));
    await within(dialog).findByText("Recibo número 3");
    expect(onDone).not.toHaveBeenCalled();
    await user.click(within(dialog).getAllByRole("button", { name: "Fechar" }).at(-1)!);
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });

  it("cobrança paga ou cancelada deixa as janelas desabilitadas com o motivo, e Abrir cobrança continua", async () => {
    const user = userEvent.setup();
    setup({ status: "PAID" });
    await openMenu(user);
    for (const name of ["Registrar pagamento", "Renegociar", "Cancelar cobrança"]) {
      const item = screen.getByRole("menuitem", { name });
      expect(item).toHaveAttribute("aria-disabled", "true");
      expect(item).toHaveAccessibleDescription("Só cobranças em aberto aceitam esta ação.");
    }
    await user.click(screen.getByRole("menuitem", { name: "Registrar pagamento" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("menuitem", { name: "Abrir cobrança" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
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
    await openMenu(user);
    expect(await axeViolations(container)).toEqual([]);
  });
});
