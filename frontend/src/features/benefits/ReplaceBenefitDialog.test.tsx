import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { ReplaceBenefitDialog } from "./ReplaceBenefitDialog";
import type { BenefitRow } from "./useBenefits";

const current: BenefitRow = {
  id: "b0",
  student: { id: "s1", name: "Marina Teixeira" },
  unit: { id: "u1", name: "Tijuca" },
  modality: { id: "mod1", name: "Jiu-Jitsu" },
  type: "AMOUNT",
  value: 3000,
  reason: "Indicação de amigo",
  decidedBy: "Mestre",
  grantedBy: "Gestora",
  validUntil: "2026-12-31",
  status: "ACTIVE",
  high: false,
  monthlyValueCents: 15000,
  planValueCents: 18000,
  nextChargeMonth: "2026-11",
};
const onKeep = vi.fn();
const onDone = vi.fn();

function setup(onConfirm: () => Promise<unknown>) {
  onKeep.mockClear();
  onDone.mockClear();
  return render(
    <ThemeProvider>
      <ReplaceBenefitDialog
        student="Marina Teixeira"
        modality="Jiu-Jitsu"
        current={current}
        next={{ type: "PERCENT", value: 50, reason: "Auxilia na turma Kids", validUntil: null }}
        newMonthlyCents={9000}
        onConfirm={onConfirm}
        onKeep={onKeep}
        onDone={onDone}
      />
    </ThemeProvider>,
  );
}

describe("janela Substituir benefício? (RN-BEN-08)", () => {
  it("CA10: mostra o texto, os cartões Atual e Novo e o resumo; Manter o atual só fecha esta janela", async () => {
    const user = userEvent.setup();
    const confirm = vi.fn().mockResolvedValue({});
    setup(confirm);
    expect(screen.getByText("Marina Teixeira · Jiu-Jitsu")).toBeInTheDocument();
    expect(screen.getByText("Marina já tem um benefício ativo no Jiu-Jitsu. Cada modalidade tem um benefício por vez.")).toBeInTheDocument();
    const atual = within(screen.getByRole("region", { name: "Atual" }));
    expect(atual.getByText("Desconto fixo")).toBeInTheDocument();
    expect(atual.getByText("R$ 30,00")).toBeInTheDocument();
    expect(atual.getByText("Indicação de amigo")).toBeInTheDocument();
    expect(atual.getByText("até 31/12/2026")).toBeInTheDocument();
    const novo = within(screen.getByRole("region", { name: "Novo" }));
    expect(novo.getByText("Bolsa")).toBeInTheDocument();
    expect(novo.getByText("50%")).toBeInTheDocument();
    expect(novo.getByText("sem prazo")).toBeInTheDocument();
    expect(screen.getByText("Confirmando, o novo substitui o atual a partir da próxima cobrança gerada: R$ 90,00 em vez de R$ 150,00.")).toBeInTheDocument();
    expect(screen.getByText("O benefício atual fica encerrado, com o motivo, no histórico.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Manter o atual" }));
    expect(onKeep).toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("CA10: Substituir confirma e avisa que terminou", async () => {
    const user = userEvent.setup();
    const confirm = vi.fn().mockResolvedValue({});
    setup(confirm);
    await user.click(screen.getByRole("button", { name: "Substituir" }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it("CA10: 403 mostra sem permissão e erro mostra Tentar de novo; nada fecha", async () => {
    const user = userEvent.setup();
    const view = setup(() => Promise.reject(new ApiError(403, "FORBIDDEN")));
    await user.click(screen.getByRole("button", { name: "Substituir" }));
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
    view.unmount();
    setup(() => Promise.reject(new ApiError(500, "INTERNAL_ERROR")));
    await user.click(screen.getByRole("button", { name: "Substituir" }));
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    expect(screen.getByRole("button", { name: "Substituir" })).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    setup(vi.fn());
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
