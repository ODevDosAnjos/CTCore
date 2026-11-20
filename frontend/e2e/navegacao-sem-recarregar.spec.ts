import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// RNF-43 (#643): trocar de tela é navegação do roteador; o marcador em window sobrevive.
async function login(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
}
const marca = (page: Page) => page.evaluate("globalThis.__marca = \"viva\"");
const viva = (page: Page) => page.evaluate("globalThis.__marca");

// Visita todos os links do menu; com `grupos`, abre um grupo por vez (o menu é sanfona) e percorre os links dele.
async function percorre(page: Page, nav: ReturnType<Page["locator"]>, grupos = false) {
  await marca(page);
  const visitados: string[] = [];
  const visita = async () => {
    for (const href of await nav.locator("a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""))) {
      if (visitados.includes(href)) continue;
      await nav.locator(`a[href='${href}']`).first().click();
      await expect(page).toHaveURL((u) => u.pathname === href);
      expect(await viva(page)).toBe("viva");
      visitados.push(href);
    }
  };
  if (grupos) {
    const total = await nav.locator("button[aria-expanded]").count();
    for (let i = 0; i < total; i++) {
      const g = nav.locator("button[aria-expanded]").nth(i);
      if ((await g.getAttribute("aria-expanded")) === "false") await g.click();
      await visita();
    }
  } else await visita();
  expect(visitados.length).toBeGreaterThan(0);
  return visitados;
}

test("@critical gestão no desktop: menu, voltar e avançar sem recarregar", async ({ page }) => {
  await login(page, "ana@exemplo.com");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  const hrefs = await percorre(page, page.getByRole("navigation", { name: "Menu principal" }), true);
  expect(hrefs.length).toBeGreaterThan(1);
  await page.goBack();
  await expect(page).toHaveURL((u) => u.pathname === hrefs[hrefs.length - 2]);
  await page.goForward();
  await expect(page).toHaveURL((u) => u.pathname === hrefs[hrefs.length - 1]);
  expect(await viva(page)).toBe("viva");
});

test.describe("a 360 px", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("@critical gestão: abas do celular e Minha conta sem recarregar", async ({ page }) => {
    await login(page, "ana@exemplo.com");
    await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
    await percorre(page, page.getByRole("navigation", { name: "Abas principais" }));
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("link", { name: "Minha conta" }).click();
    await expect(page).toHaveURL(/\/conta$/);
    expect(await viva(page)).toBe("viva");
  });

  test("@critical portal: itens do menu sem recarregar", async ({ page }) => {
    await login(page, "termo@exemplo.com");
    await page.getByLabel("Li e aceito o termo de matrícula").check();
    await page.getByRole("button", { name: "Aceitar e continuar" }).click();
    await expect(page.getByText("Tudo em dia")).toBeVisible();
    await percorre(page, page.getByRole("navigation", { name: "Portal, abas" }));
  });
});
