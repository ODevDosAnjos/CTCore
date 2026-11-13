import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { CancelChargeDialog } from "./CancelChargeDialog";
import type { ChargeRow } from "./types";

const row: ChargeRow = {
  id: "c1", student: { id: "s1", name: "Felipe Santos", photoUrl: null }, unit: { id: "u1", name: "Tijuca" }, type: "ONE_OFF", modality: null,
  referenceMonth: null, description: "Kimono infantil A2", amountCents: 28990, dueOn: "2026-10-15", status: "PENDING", payment: null, daysLate: null,
};

function setup(status = 200) {
  const sent: unknown[] = [];
  const onDone = vi.fn();
  const onClose = vi.fn();
  server.use(
    http.post("/api/v1/charges/c1/cancel", async ({ request }) => {
      sent.push(await request.json());
      return HttpResponse.json(status === 200 ? {} : { code: "CONFLICT", fields: [] }, { status });
    }),
  );
  render(
    <ThemeProvider>
      <CancelChargeDialog charge={row} onClose={onClose} onDone={onDone} />
    </ThemeProvider>,
  );
  return { sent, onDone, onClose };
}

describe("CancelChargeDialog (RN-COB-10)", () => {
  it("CA6: resume a cobrança, só habilita com motivo, envia o motivo cortado e fecha recarregando", async () => {
    const { sent, onDone, onClose } = setup();
    const dialog = within(await screen.findByRole("dialog", { name: "Cancelar cobrança" }));
    expect(dialog.getByText("Felipe Santos · Kimono infantil A2 · avulsa · R$ 289,90 · vence 15/10/2026")).toBeInTheDocument();
    const confirm = dialog.getByRole("button", { name: "Cancelar cobrança" });
    expect(confirm).toBeDisabled();
    const user = userEvent.setup();
    await user.type(dialog.getByRole("textbox", { name: /Motivo/ }), "  Trocado por outro tamanho ");
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(sent).toEqual([{ reason: "Trocado por outro tamanho" }]);
    expect(onClose).toHaveBeenCalled();
  });

  it("CA6: o motivo para nos 200 caracteres", async () => {
    setup();
    const reason = within(await screen.findByRole("dialog", { name: "Cancelar cobrança" })).getByRole("textbox", { name: /Motivo/ });
    const user = userEvent.setup();
    await user.click(reason);
    await user.paste("x".repeat(250));
    expect((reason as HTMLTextAreaElement).value).toHaveLength(200);
  });

  it("CA6: 409 mostra a mensagem de conflito no alto e a janela não fecha", async () => {
    const { onClose } = setup(409);
    const dialog = within(await screen.findByRole("dialog", { name: "Cancelar cobrança" }));
    const user = userEvent.setup();
    await user.type(dialog.getByRole("textbox", { name: /Motivo/ }), "x");
    await user.click(dialog.getByRole("button", { name: "Cancelar cobrança" }));
    expect(await dialog.findByRole("alert")).toHaveTextContent("já foi alterada por outra pessoa");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("não tem violações no axe nos dois temas", async () => {
    for (const dark of [false, true]) {
      setDevicePrefersDark(dark);
      const { unmount } = render(
        <ThemeProvider>
          <CancelChargeDialog charge={row} onClose={() => {}} onDone={() => {}} />
        </ThemeProvider>,
      );
      await screen.findByRole("dialog", { name: "Cancelar cobrança" });
      expect(await axeViolations(document.body)).toEqual([]);
      unmount();
    }
  });
});
