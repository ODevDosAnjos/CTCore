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

// RF-ORG-02: o Coordenador vê a lista e, pela unidade aberta, ajusta o nome curto uma vez (D3 da #484); o Administrador não tem o item nem a tela.
test("@critical configurações das unidades: Coordenador lista e ajusta, Administrador sem acesso", async ({ page }) => {
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
  await page.getByRole("button", { name: "Ajustar nome curto" }).click();
  await page.getByLabel("Novo nome curto").fill("centro-novo");
  await page.getByRole("dialog").getByRole("button", { name: "Ajustar" }).click();
  await expect(page.getByLabel("Nome curto")).toHaveValue("centro-novo");
  await expect(page.getByRole("button", { name: "Ajustar nome curto" })).toHaveCount(0);

  await page.evaluate('fetch("/api/v1/auth/logout", { method: "POST" })');
  await page.goto("/entrar");
  await loginAs(page, "varios@exemplo.com");
  await page.getByRole("button", { name: /Academia Alfa Gestão · Administrador/ }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Unidades" })).toHaveCount(0);
  await open(page, "/configuracoes/unidades");
  await expect(page.getByRole("heading", { name: "Esta área não está disponível para o seu perfil" })).toBeVisible();
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
