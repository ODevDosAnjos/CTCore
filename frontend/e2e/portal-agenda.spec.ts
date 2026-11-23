import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");

const violations = async (page: Page) => {
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async () => (await (globalThis as unknown as { axe: { run: () => Promise<{ violations: unknown[] }> } }).axe.run()).violations);
};
const noOverflow = (page: Page) => page.evaluate("document.documentElement.scrollWidth <= window.innerWidth");
const CHILD_TWO = "00000000-0000-0000-0000-000000000703";

async function login(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
}

// Vai à segunda-feira da semana aberta e avança `n` dias com a seta (sem cruzar a semana).
async function day(page: Page, n: number) {
  const heading = page.getByRole("heading", { level: 2 }).filter({ hasText: /\d\d\/\d\d$/ });
  for (let i = 0; i < 7 && !/^segunda/i.test((await heading.textContent()) ?? ""); i++) await page.getByRole("button", { name: "Dia anterior" }).click();
  for (let i = 0; i < n; i++) await page.getByRole("button", { name: "Próximo dia" }).click();
}

// RF-POR-04 (#91, #495): agenda do portal em lista do dia a 360 px e em grade a 1024 px, nos dois temas.
test.describe("agenda do portal a 360 px", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const scheme of ["light", "dark"] as const) {
    test(`@critical responsável vê a aula alterada, a cancelada, o dia sem aula, troca de semana, de escopo e de aluno, e passa no axe (${scheme})`, async ({ page }) => {
      await page.clock.install({ time: new Date("2026-11-24T12:00:00") });
      await page.emulateMedia({ colorScheme: scheme });
      await login(page, "familia@exemplo.com");
      await page.getByRole("link", { name: "Agenda", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Agenda", level: 1 })).toBeVisible();

      await day(page, 1);
      const panel = page.locator("main");
      await expect(panel.getByText("Alterada")).toBeVisible();
      await expect(panel.getByText(/^Era em /)).toBeVisible();
      await expect(panel.getByRole("link", { name: /Ver aviso/ })).toHaveAttribute("href", /\/portal\/avisos\?aviso=/);
      await day(page, 2);
      await expect(panel.getByText("Sem aula")).toBeVisible();
      await expect(panel.getByText("Reforma do tatame")).toBeVisible();
      await day(page, 3);
      await expect(panel.getByText("Cancelada")).toBeVisible();
      await expect(panel.getByText("Motivo: Feriado")).toBeVisible();
      expect(await noOverflow(page)).toBe(true);
      expect(await violations(page)).toEqual([]);

      await day(page, 6);
      await page.getByRole("button", { name: "Próximo dia" }).click();
      await expect(page).toHaveURL(/semana=\d{4}-\d{2}-\d{2}/);
      await page.getByText("Só minha turma").click();
      await expect(page).toHaveURL(/escopo=MAIN/);
      await expect(page).toHaveURL(/semana=/);

      await page.getByRole("combobox", { name: "Aluno" }).selectOption(CHILD_TWO);
      await expect(page).toHaveURL(/aluno=/);
      await day(page, 0);
      await expect(page.getByText("Judô Infantil")).toBeVisible();
      expect(await noOverflow(page)).toBe(true);
      expect(await violations(page)).toEqual([]);
    });
  }

  test("@critical portal reduzido não tem a aba Agenda e /portal/agenda leva ao Financeiro", async ({ page }) => {
    await login(page, "reduzido@exemplo.com");
    await expect(page.getByRole("link", { name: "Agenda", exact: true })).toHaveCount(0);
    await page.evaluate("window.history.pushState({}, '', '/portal/agenda'); window.dispatchEvent(new PopStateEvent('popstate'))");
    await expect(page).toHaveURL(/\/portal\/financeiro$/);
  });
});

test.describe("agenda do portal a 1024 px", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  for (const scheme of ["light", "dark"] as const) {
    test(`@critical grade da semana com 7 colunas e dia sem aula, sem rolagem horizontal, no axe (${scheme})`, async ({ page }) => {
      await page.clock.install({ time: new Date("2026-11-24T12:00:00") });
      await page.emulateMedia({ colorScheme: scheme });
      await login(page, "familia@exemplo.com");
      await page.getByRole("link", { name: "Agenda", exact: true }).click();
      await expect(page.getByRole("region")).toHaveCount(7);
      await expect(page.getByText("Sem aula")).toBeVisible();
      await expect(page.getByText("Jiu-Jitsu Adulto")).toBeVisible();
      await expect(page.getByRole("button", { name: "Hoje" })).toHaveCount(0);
      expect(await noOverflow(page)).toBe(true);
      expect(await violations(page)).toEqual([]);
    });
  }
});
