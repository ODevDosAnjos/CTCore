import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { UnitLinksTab } from "./UnitLinksTab";
import { renderTab } from "./unitTabKit";

const tab = (p: Parameters<typeof renderTab>[0] extends (x: infer P) => unknown ? P : never) => <UnitLinksTab d={p.d} set={p.set} />;

describe("UnitLinksTab (R7)", () => {
  it("CA16: o interruptor liga e desliga cada link, o selo Ligado acompanha e a nota do desligado aparece", async () => {
    const user = userEvent.setup();
    const { draft } = renderTab(tab);
    expect(screen.getAllByText("Ligado")).toHaveLength(2);
    expect(screen.getByText("Página com a marca da organização")).toBeInTheDocument();
    expect(screen.getByText(/Desligado, o link mostra "Esta unidade não está recebendo pedidos por aqui"/)).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Pedido de aula experimental" }));
    expect(draft().trialLinkEnabled).toBe(false);
    expect(draft().selfRegistrationLinkEnabled).toBe(true);
    expect(screen.getAllByText("Ligado")).toHaveLength(1);
    await user.click(screen.getByRole("switch", { name: "Autocadastro de matrícula" }));
    expect(draft().selfRegistrationLinkEnabled).toBe(false);
    expect(screen.queryByText("Ligado")).not.toBeInTheDocument();
  });

  it("CA16: Copiar link, QR code PNG e PDF para imprimir aparecem desabilitados com Em breve e não fazem nada", async () => {
    const user = userEvent.setup();
    const { draft } = renderTab(tab);
    const before = draft();
    expect(screen.getAllByText("Em breve")).toHaveLength(7); // seis dos links e o diretório
    for (const name of ["Copiar link", "QR code PNG", "PDF para imprimir"]) {
      const items = screen.getAllByText(name).map((el) => el.closest("[aria-disabled]"));
      expect(items).toHaveLength(2);
      for (const el of items) {
        expect(el).toHaveAttribute("aria-disabled", "true");
        await user.click(el!);
      }
    }
    expect(draft()).toEqual(before);
  });

  it("#748 CA3: o diretório fica no último cartão, desabilitado com Em breve; clicar não muda o rascunho", async () => {
    const user = userEvent.setup();
    const { draft } = renderTab(tab);
    expect(screen.getAllByRole("heading", { level: 2 }).at(-1)).toHaveTextContent("Diretório de academias");
    const before = draft();
    const directory = screen.getByRole("switch", { name: "Aparecer no diretório ctcore.com.br/academias" });
    expect(directory).toHaveAttribute("aria-disabled", "true");
    await user.click(directory);
    expect(directory).not.toBeChecked();
    expect(draft()).toEqual(before);
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("não tem violações no axe a 360 px no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = renderTab(tab);
    expect(await axeViolations(container)).toEqual([]);
  });
});
