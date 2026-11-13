import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { SessionProvider } from "@/features/auth/SessionProvider";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { RegisterPaymentDialog } from "./RegisterPaymentDialog";

const charge = { student: "Marina Teixeira", label: "Jiu-Jitsu · 10/2026", dueOn: "2026-10-10", unitName: "Tijuca" };
const session = { account: { id: "a", email: "x@x.com", name: "Carla Mendes" }, links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role: "ADMINISTRATOR", unitIds: [] }], activeLinkId: "l1", twoFactor: { enabled: false, required: false } };

function setup(props: Partial<Parameters<typeof RegisterPaymentDialog>[0]> = {}) {
  server.use(http.get("/api/v1/auth/session", () => HttpResponse.json(session)));
  return render(
    <ThemeProvider>
      <SessionProvider>
        <RegisterPaymentDialog chargeId="c1" charge={charge} amountCents={5000} payerEmail="marina.teixeira@email.example" onClose={() => {}} onPaid={() => {}} {...props} />
      </SessionProvider>
    </ThemeProvider>,
  );
}

describe("RegisterPaymentDialog (RF-COB-04)", () => {
  it("CA9 (#422): a janela não tem violações no axe nos dois temas", async () => {
    for (const dark of [false, true]) {
      setDevicePrefersDark(dark);
      const { unmount } = setup();
      await screen.findByRole("dialog", { name: "Registrar pagamento" });
      expect(await axeViolations(document.body)).toEqual([]);
      unmount();
    }
  });

  it("CA7/CA8: bloco da cobrança, quatro meios em cartões, valor desabilitado, e-mail do pagador e quem está lançando", async () => {
    setup();
    const dialog = within(await screen.findByRole("dialog", { name: "Registrar pagamento" }));
    expect(dialog.getByText("Marina Teixeira · Jiu-Jitsu · 10/2026 · vence 10/10/2026")).toBeInTheDocument();
    expect(dialog.getByText("Valor da cobrança: R$ 50,00 · sem taxa no pagamento manual")).toBeInTheDocument();
    expect(dialog.getAllByRole("radio").map((r) => r.closest("label")?.textContent)).toEqual(["Dinheiro", "Pix na chave da unidade", "Cartão na maquininha", "Transferência"]);
    expect(dialog.getByRole("radio", { name: "Dinheiro" })).toBeChecked();
    expect(dialog.getByLabelText("Valor")).toBeDisabled();
    expect(dialog.getByText("Igual ao da cobrança: não existe pagamento parcial")).toBeInTheDocument();
    expect(dialog.getByText("Para marina.teixeira@email.example · recibo da Tijuca")).toBeInTheDocument();
    expect(await dialog.findByText("Lançado por Carla Mendes")).toBeInTheDocument();
  });

  it("CA8: sem e-mail cadastrado a caixa fica desmarcada e desabilitada e o recibo não é pedido", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post("/api/v1/charges/c1/payments", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: "p", chargeId: "c1", receipt: { number: 3, code: "ABCDEF0123456789" }, receiptEmail: "NOT_REQUESTED" }, { status: 201 });
      }),
    );
    setup({ payerEmail: null });
    const dialog = within(await screen.findByRole("dialog", { name: "Registrar pagamento" }));
    const box = dialog.getByLabelText("Enviar recibo por e-mail");
    expect(box).not.toBeChecked();
    expect(box).toBeDisabled();
    expect(dialog.getByText(/sem e-mail cadastrado/)).toBeInTheDocument();
    await userEvent.setup().click(dialog.getByRole("button", { name: "Registrar pagamento" }));
    await dialog.findByText("Recibo número 3");
    expect(body).toMatchObject({ method: "CASH", amountCents: 5000, sendReceipt: false });
  });

  it("data passada vai como paidAt, desmarcar o e-mail não pede envio, e o aviso do e-mail aparece no sucesso", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post("/api/v1/charges/c1/payments", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: "p", chargeId: "c1", receipt: { number: 3, code: "ABCDEF0123456789" }, receiptEmail: "FAILED" }, { status: 201 });
      }),
    );
    const onPaid = vi.fn();
    setup({ onPaid });
    const dialog = within(await screen.findByRole("dialog", { name: "Registrar pagamento" }));
    const user = userEvent.setup();
    fireEvent.change(dialog.getByLabelText("Data do pagamento"), { target: { value: "2026-01-02" } });
    await user.click(dialog.getByLabelText("Enviar recibo por e-mail"));
    await user.click(dialog.getByRole("button", { name: "Registrar pagamento" }));
    expect(await dialog.findByText("Recibo número 3")).toBeInTheDocument();
    expect(dialog.getByText(/e-mail do recibo não saiu/)).toBeInTheDocument();
    expect(body).toMatchObject({ method: "CASH", amountCents: 5000, sendReceipt: false });
    expect(new Date(body.paidAt as string).getFullYear()).toBe(2026);
    expect(onPaid).toHaveBeenCalledOnce();
  });
});
