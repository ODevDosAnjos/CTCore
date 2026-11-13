import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { RenegotiateDialog, previewInstallments } from "./RenegotiateDialog";
import type { ChargeRow } from "./types";

const row = (over: Partial<ChargeRow> = {}): ChargeRow => ({
  id: "c1", student: { id: "s1", name: "Gabriel Rocha", photoUrl: null }, unit: { id: "u1", name: "Tijuca" }, type: "MONTHLY", modality: { id: "m1", name: "Muay Thai" },
  referenceMonth: "2026-08-01", description: null, amountCents: 16000, dueOn: "2026-08-10", status: "OVERDUE", payment: null, daysLate: 20, ...over,
});

function setup(over: Partial<ChargeRow> = {}, status = 201, body: Record<string, unknown> | unknown[] = []) {
  const sent: unknown[] = [];
  const onDone = vi.fn();
  const onClose = vi.fn();
  server.use(
    http.post("/api/v1/charges/renegotiate", async ({ request }) => {
      sent.push(await request.json());
      return HttpResponse.json(body, { status });
    }),
  );
  render(
    <ThemeProvider>
      <RenegotiateDialog charge={row(over)} onClose={onClose} onDone={onDone} />
    </ThemeProvider>,
  );
  return { sent, onDone, onClose };
}

const form = (dialog: ReturnType<typeof within>) => document.getElementById(dialog.getByRole("button", { name: "Renegociar" }).getAttribute("form")!)!;
const open = async () => within(await screen.findByRole("dialog", { name: "Renegociar" }));

describe("RenegotiateDialog (RN-COB-09)", () => {
  it("CA10: com 1 parcela o novo valor é editável e o primeiro vencimento é obrigatório; só o valor mudado vai como amountCents", async () => {
    const { sent, onDone } = setup();
    const dialog = await open();
    const user = userEvent.setup();
    expect(dialog.getByText("Gabriel Rocha · Muay Thai · 08/2026")).toBeInTheDocument();
    expect(dialog.getAllByText("R$ 160,00").length).toBeGreaterThan(0);
    const submit = dialog.getByRole("button", { name: "Renegociar" });
    expect(submit).toBeDisabled();
    const value = dialog.getByLabelText(/Novo valor/);
    expect(value).toHaveValue("R$ 160,00");
    await user.clear(value);
    await user.type(value, "8000");
    fireEvent.change(dialog.getByLabelText(/Primeiro vencimento/), { target: { value: "2099-01-10" } });
    await user.type(dialog.getByRole("textbox", { name: /Motivo/ }), "Acordo");
    await user.click(submit);
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(sent).toEqual([{ chargeIds: ["c1"], amountCents: 8000, firstDueOn: "2099-01-10", installments: 1, reason: "Acordo" }]);
  });

  it("CA10: com 3 parcelas e total de R$ 160,00 a prévia traz R$ 53,34, R$ 53,33 e R$ 53,33 mensais e o total é o da original", async () => {
    const { sent } = setup();
    const dialog = await open();
    const user = userEvent.setup();
    await user.selectOptions(dialog.getByLabelText("Parcelas"), "3");
    expect(dialog.queryByLabelText(/Novo valor/)).toBeNull();
    fireEvent.change(dialog.getByLabelText(/Primeiro vencimento/), { target: { value: "2099-01-31" } });
    await user.type(dialog.getByRole("textbox", { name: /Motivo/ }), "Acordo");
    const table = within(dialog.getByRole("table", { name: "Prévia das parcelas" }));
    const rows = table.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell").map((c) => c.textContent));
    expect(rows).toEqual([
      ["1 de 3", "31/01/2099", "R$ 53,34"],
      ["2 de 3", "28/02/2099", "R$ 53,33"],
      ["3 de 3", "31/03/2099", "R$ 53,33"],
    ]);
    await user.click(dialog.getByRole("button", { name: "Renegociar" }));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toEqual({ chargeIds: ["c1"], firstDueOn: "2099-01-31", installments: 3, reason: "Acordo" });
  });

  it("CA11: o resumo cita a modalidade e o primeiro nome do aluno", async () => {
    setup();
    const dialog = await open();
    expect(dialog.getByText("Resumo")).toBeInTheDocument();
    expect(dialog.getByText('A cobrança original fica "Renegociada".')).toBeInTheDocument();
    expect(dialog.getByText("As parcelas contam para o bloqueio por atraso de Muay Thai.")).toBeInTheDocument();
    expect(dialog.getByText("Gabriel recebe as parcelas no portal e por e-mail.")).toBeInTheDocument();
  });

  it("CA11: enviar sem motivo, sem vencimento ou com vencimento anterior a hoje mostra o erro no campo e não chama a API", async () => {
    const { sent } = setup();
    const dialog = await open();
    fireEvent.submit(form(dialog));
    expect(await dialog.findByText("Informe o primeiro vencimento.")).toBeInTheDocument();
    expect(dialog.getByText("Informe o motivo.")).toBeInTheDocument();
    fireEvent.change(dialog.getByLabelText(/Primeiro vencimento/), { target: { value: "2020-01-01" } });
    expect(await dialog.findByText("O vencimento não pode ser anterior a hoje.")).toBeInTheDocument();
    fireEvent.submit(form(dialog));
    expect(sent).toEqual([]);
  });

  it("CA11: o 400 de campo do servidor aparece no campo e a janela segue aberta", async () => {
    const { onClose } = setup({}, 400, { code: "VALIDATION_ERROR", fields: [{ field: "firstDueOn", message: "não pode ser anterior a hoje" }] });
    const dialog = await open();
    const user = userEvent.setup();
    fireEvent.change(dialog.getByLabelText(/Primeiro vencimento/), { target: { value: "2099-01-10" } });
    await user.type(dialog.getByRole("textbox", { name: /Motivo/ }), "Acordo");
    await user.click(dialog.getByRole("button", { name: "Renegociar" }));
    expect(await dialog.findByText("não pode ser anterior a hoje")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("CA12: a 390 px aparece Como com as duas escolhas; Dividir em parcelas mostra o seletor de 2x a 6x", async () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: true, media: q, addEventListener: () => {}, removeEventListener: () => {} })) as unknown as typeof window.matchMedia;
    try {
      const { sent } = setup();
      const dialog = await open();
      const user = userEvent.setup();
      expect(dialog.getByRole("radio", { name: "Alterar valor e vencimento" })).toBeChecked();
      expect(dialog.getByLabelText(/Novo valor/)).toBeInTheDocument();
      await user.click(dialog.getByRole("radio", { name: "Dividir em parcelas" }));
      expect(dialog.queryByLabelText(/Novo valor/)).toBeNull();
      expect(within(dialog.getByLabelText("Parcelas")).getAllByRole("option").map((o) => o.textContent)).toEqual(["2x de R$ 80,00", "3x de R$ 53,33", "4x de R$ 40,00", "5x de R$ 32,00", "6x de R$ 26,66"]);
      await user.selectOptions(dialog.getByLabelText("Parcelas"), "3");
      fireEvent.change(dialog.getByLabelText(/Primeiro vencimento/), { target: { value: "2099-01-10" } });
      await user.type(dialog.getByRole("textbox", { name: /Motivo/ }), "Acordo");
      await user.click(dialog.getByRole("button", { name: "Renegociar" }));
      await waitFor(() => expect(sent).toHaveLength(1));
      expect(sent[0]).toMatchObject({ installments: 3 });
    } finally {
      window.matchMedia = original;
    }
  });

  it("a prévia leva o resto dos centavos para a primeira parcela e limita o dia ao fim do mês", () => {
    expect(previewInstallments(10000, 3, "2099-01-31")).toEqual([
      { amountCents: 3334, dueOn: "2099-01-31" },
      { amountCents: 3333, dueOn: "2099-02-28" },
      { amountCents: 3333, dueOn: "2099-03-31" },
    ]);
  });

  it("não tem violações no axe nos dois temas", async () => {
    for (const dark of [false, true]) {
      setDevicePrefersDark(dark);
      const { unmount } = render(
        <ThemeProvider>
          <RenegotiateDialog charge={row()} onClose={() => {}} onDone={() => {}} />
        </ThemeProvider>,
      );
      await screen.findByRole("dialog", { name: "Renegociar" });
      expect(await axeViolations(document.body)).toEqual([]);
      unmount();
    }
  });
});
