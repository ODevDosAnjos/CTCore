import { expect, test } from "@playwright/test";

// RNF-36: fluxo crítico de hoje (abrir o app, textos em pt-BR, trocar de tema). O tema fica na barra do portal; as telas de acesso não o têm (#455).
test("@critical abre o app em pt-BR e alterna o tema", async ({ page }) => {
  await page.goto("/entrar");
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  await page.getByLabel("E-mail").fill("familia@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("link", { name: "Agenda", exact: true }).first()).toBeVisible();

  const html = page.locator("html");
  const isDark = async () => (await html.getAttribute("class"))?.includes("dark") ?? false;
  const antes = await isDark();
  await page.getByRole("button", { name: /Usar tema (escuro|claro)/ }).click();
  expect(await isDark()).toBe(!antes);
  await page.getByRole("button", { name: /Usar tema (escuro|claro)/ }).click();
  expect(await isDark()).toBe(antes);
});
