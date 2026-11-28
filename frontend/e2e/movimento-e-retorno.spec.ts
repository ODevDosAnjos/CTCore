import { expect, test } from "@playwright/test";

// #774 (RNF-44, RNF-56): a moldura da gestão traz a região de avisos e mostra a barra fina ao trocar de tela. Dados fictícios do MSW.
test("@critical gestão: a barra de troca de tela aparece ao navegar e some depois, dentro da moldura", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("navigation", { name: "Menu principal" })).toBeVisible();
  await expect(page.locator("[aria-live=polite]")).toBeAttached();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  // Navega pelo roteador, sem recarregar (o goto perderia a sessão do MSW).
  await page.evaluate(`history.pushState({}, "", "/alunos"); dispatchEvent(new PopStateEvent("popstate"))`);
  await expect(page.getByRole("progressbar", { name: "Carregando a tela" })).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Menu principal" })).toBeVisible();
});
