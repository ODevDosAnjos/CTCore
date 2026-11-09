import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");

const violations = async (page: Page) => {
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async () => (await (globalThis as unknown as { axe: { run: () => Promise<{ violations: unknown[] }> } }).axe.run()).violations);
};
const noOverflow = (page: Page) => page.evaluate("document.documentElement.scrollWidth <= window.innerWidth");

async function login(page: Page, email: string, next?: string) {
  await page.goto(next ? `/entrar?next=${encodeURIComponent(next)}` : "/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
}

// #434: sair da conta na gestão e no portal; depois, a rota protegida pede login e outro usuário entra na área dele.
for (const scheme of ["light", "dark"] as const) {
  test(`@critical gestão: sair, rota protegida pede login e outro usuário entra (desktop, ${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page, "ana@exemplo.com");
    // #454: a saída fica no menu da conta (avatar, nome, perfil e seta), não solta na barra.
    await expect(page.getByRole("banner").getByRole("button", { name: "Sair da conta" })).toHaveCount(0);
    await page.getByRole("banner").getByRole("button", { name: /Menu da conta/ }).click();
    const out = page.getByRole("menuitem", { name: "Sair da conta" });
    await expect(out).toBeVisible();
    expect((await out.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await violations(page)).toEqual([]);
    await out.click();
    await expect(page).toHaveURL(/\/entrar$/);
    await page.goto("/agenda");
    await expect(page).toHaveURL(/\/entrar\?next=%2Fagenda$/);
    await login(page, "aluno@exemplo.com");
    await expect(page.getByRole("link", { name: "Academia Alfa" })).toBeVisible();
  });

  test(`@critical portal: sair a 360 px, rota protegida pede login e outro usuário entra (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 360, height: 740 });
    await login(page, "familia@exemplo.com");
    const out = page.getByRole("button", { name: "Sair da conta" });
    await expect(out).toBeVisible();
    expect(await noOverflow(page)).toBe(true);
    expect(await violations(page)).toEqual([]);
    await out.click();
    await expect(page).toHaveURL(/\/entrar$/);
    await page.goto("/portal/agenda");
    await expect(page).toHaveURL(/\/entrar\?next=%2Fportal%2Fagenda$/);
    await login(page, "aluno@exemplo.com");
    await expect(page.getByRole("link", { name: "Academia Alfa" })).toBeVisible();
  });
}

test("@critical gestão no celular: sair pelo menu em tela cheia", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await login(page, "ana@exemplo.com");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/\/entrar$/);
});

// #454: moldura da gestão sem violação do axe (inclusive o botão "Buscar"), sem rolagem horizontal, a 360 e a 1440 px, nos dois temas.
for (const scheme of ["light", "dark"] as const) {
  for (const width of [360, 1440]) {
    for (const path of ["/alunos", "/agenda"]) {
      test(`@critical moldura da gestão em ${path}: axe e sem rolagem horizontal (${width} px, ${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize({ width, height: 800 });
        await login(page, "ana@exemplo.com", path);
        await expect(page.getByRole("main")).toBeVisible();
        await expect(page.getByRole("button", { name: /^Buscar/ })).toBeDisabled();
        expect(await noOverflow(page)).toBe(true);
        expect(await violations(page)).toEqual([]);
      });
    }
  }
}
