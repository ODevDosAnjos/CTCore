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

// RF-POR-03 (#90): carteirinha do portal a 360 px, nos dois temas.
test.describe("carteirinha do portal a 360 px", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const scheme of ["light", "dark"] as const) {
    test(`@critical aluno abre a carteirinha pelo Início, vê as duas modalidades e passa no axe (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await login(page, "termo@exemplo.com");
      await page.getByLabel("Li e aceito o termo de matrícula").check();
      await page.getByRole("button", { name: "Aceitar e continuar" }).click();
      await page.getByRole("link", { name: "Ver carteirinha" }).click();

      const card = page.getByRole("article");
      await expect(card.getByText("Ativo", { exact: true })).toBeVisible();
      await expect(card.getByText("Azul, grau 2")).toBeVisible();
      await expect(card.getByText("Sem faixa registrada")).toBeVisible();
      await expect(card.getByText(/^Válida em /)).toBeVisible();
      await expect(page.getByText("Sem conexão")).toHaveCount(0);
      expect(await noOverflow(page)).toBe(true);
      expect(await violations(page)).toEqual([]);
    });

    test(`@critical responsável troca de aluno e, sem conexão, vê a última carteirinha (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await login(page, "familia@exemplo.com");
      await page.getByRole("link", { name: "Ver carteirinha" }).click();
      await expect(page.getByRole("heading", { name: "Carteirinhas" })).toBeVisible();

      await page.getByRole("button", { name: "Filho Fictício Dois" }).click();
      await expect(page.getByRole("article")).toHaveCount(1);
      await expect(page.getByRole("article", { name: "Carteirinha de Filho Fictício Dois" })).toBeVisible();
      await expect(page.getByText("Branca, grau 0")).toBeVisible();

      // O MSW atende pelo service worker, que o page.route não alcança: a falha de rede é simulada no fetch da página.
      await page.evaluate(
        `(() => { const real = window.fetch; window.fetch = (input, init) => (String(input instanceof Request ? input.url : input).includes("/portal/card") ? Promise.reject(new TypeError("Failed to fetch")) : real(input, init)); })()`,
      );
      await page.locator("button[aria-pressed=false]").first().click();
      await expect(page.getByText(/^Sem conexão · Atualizada em /)).toBeVisible();
      await expect(page.getByRole("article")).toBeVisible();
      expect(await noOverflow(page)).toBe(true);
      expect(await violations(page)).toEqual([]);
    });
  }

  test("@critical portal reduzido continua com a carteirinha e o selo Inativo", async ({ page }) => {
    await login(page, "reduzido@exemplo.com");
    await page.getByRole("link", { name: "Ver carteirinha" }).click();
    await expect(page.getByRole("article").getByText("Inativo", { exact: true })).toBeVisible();
    await expect(page.getByText("Nenhuma modalidade ativa")).toBeVisible();
    expect(await noOverflow(page)).toBe(true);
    expect(await violations(page)).toEqual([]);
  });
});
