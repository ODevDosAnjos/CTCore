import { expect, test } from "@playwright/test";

// RF-ACE-08: Professor (conta do mock, vínculo Beta) abre /sem-acesso, vê a tela e volta ao Início.
test("@critical área indisponível para o perfil", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("varios@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Academia Beta Gestão \(Professor\)/ }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();

  // Navegação sem recarregar: a sessão do mock vive na página.
  await page.evaluate('history.pushState({}, "", "/sem-acesso"); dispatchEvent(new PopStateEvent("popstate"))');
  const title = page.getByRole("heading", { name: "Esta área não está disponível para o seu perfil" });
  await expect(title).toBeFocused();
  // Dentro da casca do app (menu da gestão) e sem rolagem lateral a 360 px.
  await page.setViewportSize({ width: 360, height: 740 });
  expect(await page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")).toBe(true);
  await expect(page.getByRole("link", { name: "Ir para o Início" })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.getByRole("navigation", { name: "Menu principal" })).toBeVisible();
  await page.getByRole("link", { name: "Ir para o Início" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
});
