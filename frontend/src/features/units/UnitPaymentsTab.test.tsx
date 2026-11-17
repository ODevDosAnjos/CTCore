import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { UnitPaymentsTab } from "./UnitPaymentsTab";
import type { TabProps } from "./unitDraft";
import { renderTab, unitFixture } from "./unitTabKit";

const tab = (connected: boolean) => (p: TabProps) => <UnitPaymentsTab {...p} connected={connected} />;

describe("UnitPaymentsTab (R4)", () => {
  it("CA9: desconectado mostra Desconectado, Reconectar desabilitado com Em breve e as quatro consequências", () => {
    renderTab(tab(false));
    expect(screen.getByText("Desconectado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reconectar" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByRole("button", { name: "Desconectar" })).not.toBeInTheDocument();
    expect(screen.getByText("Em breve")).toBeInTheDocument();
    const effects = screen.getByRole("heading", { name: "Enquanto estiver desconectado" }).closest("section")!;
    expect(effects.querySelectorAll("li")).toHaveLength(4);
    expect(effects).toHaveTextContent("Ninguém desta unidade é bloqueado por atraso.");
  });

  it("CA9: conectado mostra Conectado, Reconectar e Desconectar desabilitados e nenhum cartão de consequências", async () => {
    const user = userEvent.setup();
    renderTab(tab(true));
    expect(screen.getByText("Conectado")).toBeInTheDocument();
    for (const name of ["Reconectar", "Desconectar"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toHaveAttribute("aria-disabled", "true");
      await user.click(button);
    }
    expect(screen.queryByRole("heading", { name: "Enquanto estiver desconectado" })).not.toBeInTheDocument();
  });

  it("CA10: a coluna de exemplo e a faixa do portal seguem as taxas", () => {
    const { draft } = renderTab(tab(true), unitFixture({ feesCents: { ...unitFixture().settings.feesCents, pix: 90, creditCard: 630 } }));
    const row = (name: string) => screen.getByRole("row", { name: new RegExp(`^${name}`) });
    expect(row("Pix")).toHaveTextContent("R$ 180,90");
    expect(row("Cartão de crédito")).toHaveTextContent("R$ 186,30");
    expect(row("Débito automático")).toHaveTextContent("R$ 180,00");
    expect(screen.getByText(/No portal, o aluno vê:/).parentElement).toHaveTextContent("Pix: R$ 180,90 · Cartão: R$ 186,30 · Boleto: R$ 180,00");
    fireEvent.change(screen.getAllByLabelText("Boleto")[0]!, { target: { value: "349" } });
    expect(draft().fees.bankSlip).toBe(349);
    expect(row("Boleto")).toHaveTextContent("R$ 183,49");
    expect(screen.getByText(/No portal, o aluno vê:/).parentElement).toHaveTextContent("Boleto: R$ 183,49");
  });

  it("CA10: os quatro meios de balcão continuam editáveis em Outros meios e o erro do servidor aparece no campo", () => {
    const { draft } = renderTab(tab(true), unitFixture(), { "settings.feesCents.pix": "entre 0 e R$ 1.000,00", "settings.feesCents.cash": "entre 0 e R$ 1.000,00" });
    expect(screen.getAllByText("entre 0 e R$ 1.000,00")).toHaveLength(2);
    for (const name of ["Dinheiro", "Pix na chave", "Maquininha", "Transferência"]) expect(screen.getByLabelText(name)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Maquininha"), { target: { value: "250" } });
    expect(draft().fees.terminalCard).toBe(250);
  });

  it("CA11: o tipo inicial vem da chave salva, o tipo escolhido define o formato e o erro do servidor aparece no campo", async () => {
    const user = userEvent.setup();
    const first = renderTab(tab(true), unitFixture({ pixKey: "12345678000109" }), { "settings.pixKey": "chave Pix inválida" });
    expect(screen.getByLabelText("Tipo")).toHaveValue("CNPJ");
    expect(screen.getByLabelText("Chave")).toHaveValue("12.345.678/0001-09");
    expect(screen.getByLabelText("Chave")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("chave Pix inválida")).toBeInTheDocument();
    first.unmount();
    const second = renderTab(tab(true), unitFixture({ pixKey: "ana@exemplo.com" }));
    expect(screen.getByLabelText("Tipo")).toHaveValue("EMAIL");
    await user.selectOptions(screen.getByLabelText("Tipo"), "CPF");
    await user.clear(screen.getByLabelText("Chave"));
    await user.type(screen.getByLabelText("Chave"), "52998224725");
    expect(second.draft().pixKey).toBe("529.982.247-25");
    await user.selectOptions(screen.getByLabelText("Tipo"), "EMAIL");
    await user.clear(screen.getByLabelText("Chave"));
    await user.type(screen.getByLabelText("Chave"), "x@y.example");
    expect(second.draft().pixKey).toBe("x@y.example");
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("não tem violações no axe a 360 px no tema %s, conectado ou não", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const off = renderTab(tab(false));
    expect(await axeViolations(off.container)).toEqual([]);
    off.unmount();
    const on = renderTab(tab(true));
    expect(await axeViolations(on.container)).toEqual([]);
  });
});
