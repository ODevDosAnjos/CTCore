import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { EndBenefitDialog } from "./EndBenefitDialog";
import type { BenefitRow } from "./useBenefits";

const benefit: BenefitRow = {
  id: "b1",
  student: { id: "s1", name: "Marina Teixeira" },
  unit: { id: "u1", name: "Tijuca" },
  modality: { id: "m1", name: "Jiu-Jitsu" },
  type: "AMOUNT",
  value: 3000,
  reason: "Indicou 2 alunos",
  decidedBy: "Carla Mendes",
  grantedBy: "Gestora",
  validUntil: "2026-11-30",
  status: "ACTIVE",
  high: false,
  monthlyValueCents: 15000,
  planValueCents: 18000,
  nextChargeMonth: "2026-11",
};
const onDone = vi.fn();
const onClose = vi.fn();

function setup(end: () => Response) {
  onDone.mockClear();
  onClose.mockClear();
  server.use(http.post("/api/v1/benefits/b1/end", end));
  return render(
    <ThemeProvider>
      <EndBenefitDialog benefit={benefit} onClose={onClose} onDone={onDone} />
    </ThemeProvider>,
  );
}
const send = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/^Motivo/), "Mudou de cidade");
  await user.click(screen.getByRole("button", { name: "Encerrar benefício" }));
};

describe("janela Encerrar benefício (RF-BEN-03, CA10, CA11)", () => {
  it("CA13: mostra o resumo e a nota do valor da próxima cobrança, só habilita com motivo e fecha ao confirmar", async () => {
    const user = userEvent.setup();
    setup(() => HttpResponse.json({ ...benefit, status: "ENDED" }));
    expect(screen.getByRole("dialog", { name: "Encerrar benefício" })).toBeInTheDocument();
    expect(screen.getByText("Marina Teixeira · Jiu-Jitsu · desconto de R$ 30,00 · até 11/2026")).toBeInTheDocument();
    expect(screen.getByText("A próxima cobrança gerada (nov/2026) volta a R$ 180,00. A de out/2026 não muda.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Encerrar benefício" })).toBeDisabled();
    await send(user);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onDone).toHaveBeenCalled();
  });

  it("mostra o erro do servidor no campo e não fecha", async () => {
    const user = userEvent.setup();
    setup(() => HttpResponse.json({ code: "VALIDATION_ERROR", fields: [{ field: "reason", message: "de 2 a 200 caracteres" }] }, { status: 400 }));
    await send(user);
    expect(await screen.findByText("de 2 a 200 caracteres")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("409 mostra que já foi encerrado; 403 mostra sem permissão", async () => {
    const user = userEvent.setup();
    const view = setup(() => HttpResponse.json({ code: "CONFLICT" }, { status: 409 }));
    await send(user);
    expect(await screen.findByText("Benefício já encerrado")).toBeInTheDocument();
    view.unmount();
    setup(() => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }));
    await send(user);
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it("falha mostra Tentar de novo e volta ao formulário", async () => {
    const user = userEvent.setup();
    setup(() => HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }));
    await send(user);
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    expect(screen.getByLabelText(/^Motivo/)).toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    setup(() => HttpResponse.json(benefit));
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
