import { expect, test, type Page } from "@playwright/test";

async function loginAs(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
}

// A sessão simulada vive na memória da página: a navegação é feita pelo roteador, sem recarregar (ver organizacao.spec.ts).
async function open(page: Page, path: string) {
  await page.evaluate(`history.pushState({}, "", ${JSON.stringify(path)}); dispatchEvent(new PopStateEvent("popstate"))`);
}

// RF-ORG-02: o Coordenador vê a lista e, pela unidade aberta, ajusta o nome curto uma vez (D3 da #484); o Administrador de uma unidade só cai direto nela (#746).
test("@critical configurações das unidades: Coordenador abre pela lista e ajusta, Administrador cai direto na dele", async ({ page }) => {
  await loginAs(page, "ana@exemplo.com");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Menu principal" });
  await nav.getByText("Configurações", { exact: true }).click();
  await expect(nav.getByRole("link", { name: "Unidades" })).toBeVisible();
  await open(page, "/configuracoes/unidades"); // o link recarrega a página e a sessão simulada se perderia
  await expect(page.getByRole("heading", { name: "Unidades", level: 1 })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Unidade Centro", exact: true })).toBeVisible();
  await expect(page.getByText("Desativada em 30/06/2026")).toBeVisible();

  await page.getByRole("link", { name: /Abrir\s*Unidade Centro/ }).click();
  // RNF-56: a unidade tem endereço próprio e abre dentro da moldura.
  await expect(page).toHaveURL(/\/configuracoes\/unidades\/[\w-]+$/);
  await expect(page.getByRole("heading", { name: "Unidade Centro", level: 1 })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Unidades" })).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Ajustar nome curto" }).click();
  await page.getByLabel("Novo nome curto").fill("centro-novo");
  await page.getByRole("dialog").getByRole("button", { name: "Ajustar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0); // com a janela ainda fechando, "Novo nome curto" e o título dela também casam
  await expect(page.getByLabel("Nome curto", { exact: true })).toHaveValue("centro-novo");
  await expect(page.getByRole("button", { name: "Ajustar nome curto" })).toHaveCount(0);

  await page.evaluate('fetch("/api/v1/auth/logout", { method: "POST" })');
  await page.goto("/entrar");
  await loginAs(page, "varios@exemplo.com");
  await page.getByRole("button", { name: /Academia Alfa Gestão · Administrador/ }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await nav.getByText("Configurações", { exact: true }).click();
  await nav.getByRole("link", { name: "Unidades" }).click();
  await expect(page).toHaveURL(/\/configuracoes\/unidades\/00000000-0000-0000-0000-000000000021$/);
  await expect(page.getByRole("heading", { name: "Unidade Centro", level: 1 })).toBeVisible();
  await page.goBack(); // a lista não ficou no histórico
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
});

// #746 CA9: a lista e a unidade aberta por ela não rolam a página para o lado a 360 px.
test("Unidades e a configuração da unidade a 360 px sem rolagem lateral", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await loginAs(page, "ana@exemplo.com");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  const fits = () => page.evaluate("document.documentElement.scrollWidth <= window.innerWidth");
  await open(page, "/configuracoes/unidades");
  await expect(page.getByRole("heading", { name: "Unidades", level: 1 })).toBeVisible();
  expect(await fits()).toBe(true);
  await page.getByRole("link", { name: /Abrir\s*Unidade Centro/ }).click();
  await expect(page.getByLabel("Nome", { exact: true })).toBeVisible();
  expect(await fits()).toBe(true);
});

// #462 CA6: a janela Desativar unidade, com o checklist, não rola para o lado a 360 px (com outra unidade ativa; sozinha, a janela é só o aviso).
test("Desativar unidade a 360 px sem rolagem lateral", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await loginAs(page, "ana@exemplo.com");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await page.evaluate(`fetch("/api/v1/units", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Unidade Barra" }) })`);
  await open(page, "/configuracoes/unidades");
  await page.getByRole("button", { name: "Desativar a Unidade Centro…" }).click();
  const dialog = page.getByRole("dialog", { name: "Desativar a Unidade Centro" });
  await expect(dialog.getByText("O que impede agora")).toBeVisible();
  expect(await page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")).toBe(true);
});
