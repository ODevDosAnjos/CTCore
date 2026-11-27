import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { UnitRemindersTab } from "./UnitRemindersTab";
import { renderTab, unitFixture } from "./unitTabKit";

const tab = UnitRemindersTab;
const days = ["3 dias antes do vencimento", "No dia do vencimento", "3 dias depois", "10 dias depois"];

describe("UnitRemindersTab (R5, RN-COB-17)", () => {
  it("CA12: os dias salvos -3, 0, 3 e 10 aparecem ligados; desligar um tira o dia da lista", async () => {
    const user = userEvent.setup();
    const { draft } = renderTab(tab);
    for (const name of days) expect(screen.getByRole("switch", { name })).toBeChecked();
    await user.click(screen.getByRole("switch", { name: "3 dias antes do vencimento" }));
    expect(draft().reminderDays).toEqual([0, 3, 10]);
    expect(screen.getByRole("switch", { name: "3 dias antes do vencimento" })).not.toBeChecked();
    await user.click(screen.getByRole("switch", { name: "3 dias antes do vencimento" }));
    expect(draft().reminderDays).toEqual([-3, 0, 3, 10]);
  });

  it("CA12: dia salvo fora dos quatro padrões aparece como linha própria e é mantido", async () => {
    const user = userEvent.setup();
    const { draft } = renderTab(tab, unitFixture({ reminderDays: [-3, 5] }));
    expect(screen.getByRole("switch", { name: "5 dias depois" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "No dia do vencimento" })).not.toBeChecked();
    await user.click(screen.getByRole("switch", { name: "3 dias depois" }));
    expect(draft().reminderDays).toEqual([-3, 3, 5]);
  });

  it("CA12: Push é desabilitado com Em breve, E-mail é o canal e o aviso de bloqueio é fixo", () => {
    renderTab(tab);
    expect(screen.getAllByRole("switch", { name: "Push" })).toHaveLength(4);
    for (const push of screen.getAllByRole("switch", { name: "Push" })) expect(push).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByText("Em breve")).toHaveLength(4);
    expect(screen.getAllByRole("checkbox", { name: "E-mail" })).toHaveLength(4);
    expect(screen.getByText("5 dias antes do bloqueio")).toBeInTheDocument();
    expect(screen.getByText("Sempre ligado")).toBeInTheDocument();
    expect(screen.getByText(/até 3 SMS por mês/)).toBeInTheDocument();
    expect(screen.getByLabelText("Menores de idade")).toHaveValue("Vão para o responsável financeiro");
    expect(screen.getByLabelText("Menores de idade")).toHaveAttribute("readonly");
  });

  it("CA13: o horário é a hora cheia escolhida, de 0h a 23h", async () => {
    const user = userEvent.setup();
    const { draft } = renderTab(tab);
    const hour = screen.getByLabelText("Horário de envio");
    expect(hour).toHaveValue("9");
    expect(screen.getAllByRole("option")).toHaveLength(24);
    await user.selectOptions(hour, "14");
    expect(draft().remindersHour).toBe(14);
  });

  it("CA13: com o interruptor geral desligado, os de dia e o horário ficam desabilitados e o texto aparece", async () => {
    const user = userEvent.setup();
    renderTab(tab);
    expect(screen.getByRole("switch", { name: "Enviar lembretes automáticos" })).toBeChecked();
    await user.click(screen.getByRole("switch", { name: "Enviar lembretes automáticos" }));
    for (const name of days) expect(screen.getByRole("switch", { name })).toBeDisabled();
    expect(screen.getByLabelText("Horário de envio")).toBeDisabled();
    expect(screen.getByText(/Lembretes automáticos desligados/)).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Enviar lembretes automáticos" }));
    expect(screen.getByLabelText("Horário de envio")).toBeEnabled();
    expect(screen.queryByText(/Lembretes automáticos desligados/)).not.toBeInTheDocument();
  });

  it("CA13: no limite de oito dias não dá para ligar outro", () => {
    renderTab(tab, unitFixture({ reminderDays: [-3, 1, 2, 4, 5, 6, 7, 8] }));
    expect(screen.getByRole("switch", { name: "No dia do vencimento" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "3 dias antes do vencimento" })).toBeEnabled();
  });

  it("CA14: Editar textos leva à aba Textos de Organização", () => {
    renderTab(tab);
    expect(screen.getByText(/Os lembretes param quando a cobrança é paga/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar textos" })).toHaveAttribute("href", "/configuracoes/organizacao?aba=textos");
  });

  it("o erro do servidor no horário aparece na aba", () => {
    renderTab(tab, unitFixture(), { "settings.reminderDays": "valores entre -30 e 60" });
    expect(screen.getByText("valores entre -30 e 60")).toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("não tem violações no axe a 360 px no tema %s, ligado ou desligado", async (_n, dark) => {
    const user = userEvent.setup();
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = renderTab(tab);
    expect(await axeViolations(container)).toEqual([]);
    await user.click(screen.getByRole("switch", { name: "Enviar lembretes automáticos" }));
    expect(await axeViolations(container)).toEqual([]);
  });
});
