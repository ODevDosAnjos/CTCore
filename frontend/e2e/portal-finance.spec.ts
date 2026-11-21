import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");

const violations = async (page: Page) => {
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async () => (await (globalThis as unknown as { axe: { run: () => Promise<{ violations: unknown[] }> } }).axe.run()).violations);
};
const noOverflow = (page: Page) => page.evaluate("document.documentElement.scrollWidth <= window.innerWidth");

async function login(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
}

// RF-POR-05 (#92): Financeiro do portal a 360 px e a 1024 px, nos dois temas.
test.describe("financeiro do portal a 360 px", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const scheme of ["light", "dark"] as const) {
    test(`@critical responsável envia o comprovante de duas cobranças juntas, vê a família, o histórico por ano e o recibo, e passa no axe (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await login(page, "familia@exemplo.com");
      await page.getByRole("link", { name: "Financeiro", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Financeiro", level: 1 })).toBeVisible();
      await expect(page.getByText("Nenhuma cobrança em aberto")).toBeVisible();
      await expect(page.getByRole("region", { name: "Débito automático" }).getByRole("button", { name: /Ativar/ })).toBeDisabled();
      await expect(page.getByRole("region", { name: "Recibos por e-mail" })).toContainText("familia@exemplo.com");
      expect(await noOverflow(page)).toBe(true);
      expect(await violations(page)).toEqual([]);

      await page.getByRole("group", { name: "Aluno" }).getByRole("button", { name: "Filho Fictício Dois" }).click();
      await expect(page).toHaveURL(/aluno=/);
      const open = page.getByRole("region", { name: "Em aberto" });
      await expect(open.getByText("Kimono", { exact: true })).toBeVisible();
      await expect(open.getByText("Composição")).toHaveCount(0);
      await open.getByRole("checkbox", { name: "Selecionar Mensalidade de Judô" }).check();
      await open.getByRole("checkbox", { name: "Selecionar Kimono" }).check();
      await expect(open.getByRole("status")).toContainText(/2 selecionadas · R\$\s80,00/);
      expect(await noOverflow(page)).toBe(true);
      expect(await violations(page)).toEqual([]);

      await expect(open.getByRole("button", { name: /^Pagar R\$/ })).toBeDisabled();
      await open.getByRole("button", { name: "Enviar comprovante de Pix" }).click();
      const dialog = page.getByRole("dialog", { name: "Pix na chave da unidade" });
      await expect(dialog.getByText("pix@alfa.example")).toBeVisible();
      await expect(dialog.getByText(/R\$\s80,00/).first()).toBeVisible();
      expect(await violations(page)).toEqual([]);
      await dialog.getByLabel(/Comprovante \(JPG/).setInputFiles({ name: "comprovante.png", mimeType: "image/png", buffer: Buffer.from("comprovante") });
      await dialog.getByRole("button", { name: "Enviar comprovante" }).click();
      await expect(dialog.getByText("Comprovante enviado. A cobrança ficou em conferência.")).toBeVisible();
      await dialog.getByRole("button", { name: "Fechar", exact: true }).last().click();
      await expect(open.getByText("Em conferência")).toHaveCount(2);
      await expect(open.getByRole("button", { name: /^Pagar R\$/ })).toHaveCount(0);

      const history = page.getByRole("region", { name: "Histórico" });
      await expect(history.getByRole("link", { name: /^Baixar recibo de/ }).first()).toHaveAttribute("href", /\/portal\/receipts\/RC-MOCK-\d{4}-\d\/pdf$/);
      const year = new Date().getFullYear();
      await history.getByRole("tab", { name: String(year - 1) }).click();
      await expect(page).toHaveURL(new RegExp(`aba=${year - 1}`));
      await expect(history.getByText("Cancelada")).toBeVisible();
      expect(await noOverflow(page)).toBe(true);
      expect(await violations(page)).toEqual([]);

      await page.getByRole("group", { name: "Aluno" }).getByRole("button", { name: "Toda a família" }).click();
      await expect(page).toHaveURL(/visao=familia/);
      await expect(page.getByText(/R\$\s80,00 em aberto/)).toBeVisible();
      await expect(page.getByRole("region", { name: "Histórico" })).toHaveCount(0);
      await expect(open.getByText("Filho Fictício Dois", { exact: true }).first()).toBeVisible();
      expect(await noOverflow(page)).toBe(true);
      expect(await violations(page)).toEqual([]);
    });
  }

  test("@critical portal reduzido abre o Financeiro com a cobrança em atraso e o histórico", async ({ page }) => {
    await login(page, "reduzido@exemplo.com");
    await expect(page).toHaveURL(/\/portal\/financeiro$/);
    await expect(page.getByRole("heading", { name: /^Olá/, level: 1 })).toBeVisible();
    await expect(page.getByText("Vencida", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Pagar / })).toBeVisible();
    await expect(page.getByRole("region", { name: "Fale com a academia" })).toBeVisible();
    await expect(page.getByRole("region", { name: /^(Histórico e recibos|Recibos)$/ })).toBeVisible();
    await expect(page.getByRole("region", { name: "Débito automático" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Agenda", exact: true })).toHaveCount(0);
    expect(await noOverflow(page)).toBe(true);
    expect(await violations(page)).toEqual([]);
  });
});

test.describe("financeiro do portal a 1024 px", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  for (const scheme of ["light", "dark"] as const) {
    test(`@critical aluno vê o Financeiro sem rolagem horizontal e passa no axe (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await login(page, "familia@exemplo.com");
      await page.getByRole("link", { name: "Financeiro", exact: true }).click();
      await page.getByRole("group", { name: "Aluno" }).getByRole("button", { name: "Filho Fictício Dois" }).click();
      await expect(page.getByRole("region", { name: "Em aberto" }).getByText("Kimono", { exact: true })).toBeVisible();
      await expect(page.getByRole("region", { name: "Histórico" })).toBeVisible();
      expect(await noOverflow(page)).toBe(true);
      expect(await violations(page)).toEqual([]);
    });
  }
});
