import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { UnitRemindersTab } from "./UnitRemindersTab";
import { renderTab, unitFixture } from "./unitTabKit";

const tab = UnitRemindersTab;
const days = ["3 dias antes do vencimento", "No dia do vencimento", "3 dias depois", "10 dias depois"];

describe("UnitRemindersTab (R5, RN-COB-17)", () => {
  it("#638 CA7: desligar mantém o dia na tela e no rascunho; mudar o dia desligado e religar guarda o novo, e o título acompanha", async () => {
    const user = userEvent.setup();
    const { draft } = renderTab(tab);
    for (const name of days) expect(screen.getByRole("switch", { name })).toBeChecked();
    const before = screen.getByRole("switch", { name: "3 dias antes do vencimento" });
    await user.click(before);
    expect(before).not.toBeChecked();
    expect(screen.getByLabelText("Dias antes do vencimento")).toHaveValue(3);
    expect(screen.getByLabelText("Dias antes do vencimento")).toBeEnabled();
    expect(draft().reminders.before).toEqual({ enabled: false, days: "3" });
    await user.clear(screen.getByLabelText("Dias antes do vencimento"));
    expect(screen.getByRole("switch", { name: "Lembrete antes do vencimento" })).not.toBeChecked();
    await user.type(screen.getByLabelText("Dias antes do vencimento"), "1");
    await user.click(screen.getByRole("switch", { name: "1 dia antes do vencimento" }));
    expect(draft().reminders.before).toEqual({ enabled: true, days: "1" });
  });

  it("#638 R2: são quatro linhas, com o dia guardado do desligado; o do dia do vencimento não tem campo de dia", async () => {
    const user = userEvent.setup();
    const { draft } = renderTab(tab, unitFixture({ reminders: { ...unitFixture().settings.reminders, afterFirst: { enabled: false, days: 5 } } }));
    expect(screen.getByRole("switch", { name: "5 dias depois" })).not.toBeChecked();
    expect(screen.getByLabelText("Dias depois no 1º lembrete")).toHaveValue(5);
    expect(screen.getByLabelText("Dias depois no 2º lembrete")).toHaveValue(10);
    expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
    await user.click(screen.getByRole("switch", { name: "No dia do vencimento" }));
    expect(draft().reminders.due).toEqual({ enabled: false });
  });

  it("#638 CA8: o problema do campo aparece ligado a ele", () => {
    renderTab(tab, unitFixture(), {}, { "reminders.afterSecond": "Use um dia diferente do 1º lembrete depois." });
    const field = screen.getByLabelText("Dias depois no 2º lembrete");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("Use um dia diferente do 1º lembrete depois.");
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
    for (const field of screen.getAllByRole("spinbutton")) expect(field).toBeDisabled();
    expect(screen.getByLabelText("Horário de envio")).toBeDisabled();
    expect(screen.getByText(/Lembretes automáticos desligados/)).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Enviar lembretes automáticos" }));
    expect(screen.getByLabelText("Horário de envio")).toBeEnabled();
    expect(screen.queryByText(/Lembretes automáticos desligados/)).not.toBeInTheDocument();
  });

  it("CA14: Editar textos leva à aba Textos de Organização", () => {
    renderTab(tab);
    expect(screen.getByText(/Os lembretes param quando a cobrança é paga/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar textos" })).toHaveAttribute("href", "/configuracoes/organizacao?aba=textos");
  });

  it("o erro do servidor nos lembretes aparece na aba e no campo do dia", () => {
    renderTab(tab, unitFixture(), { "settings.reminders": "obrigatório", "settings.reminders.before.days": "valores entre 1 e 30" });
    expect(screen.getByText("obrigatório")).toBeInTheDocument();
    expect(screen.getByLabelText("Dias antes do vencimento")).toHaveAccessibleDescription("valores entre 1 e 30");
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
