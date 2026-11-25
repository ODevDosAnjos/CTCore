import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// #624: menu lateral (ícone só nos grupos, acordeão, painel flutuante no recolhido) e barra de rolagem fina. Dados fictícios do MSW.
async function login(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
}

test("@critical menu aberto: subitens sem ícone e um grupo aberto por vez", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, "ana@exemplo.com");
  const nav = page.getByRole("navigation", { name: "Menu principal" });
  const pessoas = nav.getByRole("button", { name: "Pessoas" });
  await pessoas.click();
  await expect(nav.getByRole("link", { name: "Alunos" })).toBeVisible();
  expect(await nav.getByRole("link", { name: "Alunos" }).locator("svg").count()).toBe(0);
  expect(await pessoas.locator("svg").count()).toBe(2);
  await nav.getByRole("button", { name: "Financeiro" }).click();
  await expect(pessoas).toHaveAttribute("aria-expanded", "false");
  await expect(nav.getByRole("link", { name: "Alunos" })).toHaveCount(0);
});

test("@critical menu recolhido: só ícones, painel pelo teclado, foco e Esc", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, "ana@exemplo.com");
  await page.getByRole("button", { name: "Recolher menu" }).click();
  const nav = page.getByRole("navigation", { name: "Menu principal" });
  await expect(nav.locator("a[href='/alunos']")).toHaveCount(0);
  expect(await nav.evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true);
  const grupo = nav.getByRole("button", { name: "Operação" });
  await grupo.focus();
  await page.keyboard.press("Enter");
  await expect(grupo).toHaveAttribute("aria-expanded", "true");
  const painel = nav.getByRole("dialog", { name: "Operação" });
  await expect(painel).toBeVisible();
  await expect(painel.getByRole("link").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(painel).toHaveCount(0);
  await expect(grupo).toBeFocused();
  await grupo.click();
  await page.getByRole("heading", { level: 1 }).click();
  await expect(painel).toHaveCount(0);
  await nav.getByRole("link", { name: "Início" }).click();
  await expect(nav.getByRole("dialog")).toHaveCount(0);
});

test("@critical rolagem: menu mais baixo que a lista rola com barra fina e o rodapé continua visível", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 500 });
  await login(page, "ana@exemplo.com");
  const nav = page.getByRole("navigation", { name: "Menu principal" });
  for (const g of ["Pessoas", "Operação"]) await nav.getByRole("button", { name: g }).click();
  expect(await nav.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await expect(nav).toHaveCSS("scrollbar-width", "thin");
  await expect(page.getByRole("button", { name: "Recolher menu" })).toBeInViewport();
  await expect(page.getByRole("button", { name: "Ajuda", exact: true })).toBeInViewport();
});

test("@critical rolagem: Minha conta não mostra barra vertical na linha de abas", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, "ana@exemplo.com");
  await page.goto("/conta");
  const abas = page.getByRole("tablist").first();
  await expect(abas).toBeVisible();
  await expect(abas).toHaveCSS("overflow-y", "hidden");
  await expect(abas).toHaveCSS("scrollbar-width", "thin");
  expect(await abas.evaluate((el) => el.scrollHeight - el.clientHeight)).toBe(0);
});
