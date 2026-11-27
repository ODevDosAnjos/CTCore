import { expect, test, type Page } from "@playwright/test";

async function loginAs(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
}

// A sessão simulada vive na memória da página: a navegação é feita pelo roteador, sem recarregar de verdade.
async function open(page: Page, path: string) {
  await page.evaluate(`history.pushState({}, "", ${JSON.stringify(path)}); dispatchEvent(new PopStateEvent("popstate"))`);
}

// RF-ORG-04: o Coordenador altera telefone e taxa de matrícula e vê os valores ao voltar à tela; o Professor não acessa.
test("@critical configurações da unidade: Coordenador edita e Professor vê a área indisponível", async ({ page }) => {
  await loginAs(page, "ana@exemplo.com");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/configuracoes/unidade");
  await expect(page.getByRole("heading", { name: /^Unidade /, level: 1 })).toBeVisible();

  await page.getByLabel("Telefone").fill("21999998888");
  await page.getByRole("switch", { name: "Cobrar taxa de matrícula" }).click();
  await page.getByLabel("Valor da taxa").fill("");
  await page.getByLabel("Valor da taxa").pressSequentially("15000");
  // RNF-56: a tela abre dentro da moldura; RN-AEX-02: o limite é salvo na unidade.
  await expect(page.getByRole("navigation").first()).toBeVisible();
  await page.getByRole("tab", { name: "Links" }).click();
  await page.getByLabel("Limite de aulas experimentais por pessoa").selectOption("3");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Salvo", { exact: true })).toBeVisible();

  await open(page, "/");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/configuracoes/unidade");
  await expect(page.getByLabel("Telefone")).toHaveValue("(21) 99999-8888");
  await expect(page.getByLabel("Valor da taxa")).toHaveValue("R$ 150,00");
  await page.getByRole("tab", { name: "Links" }).click();
  await expect(page.getByLabel("Limite de aulas experimentais por pessoa")).toHaveValue("3");

  await page.evaluate('fetch("/api/v1/auth/logout", { method: "POST" })');
  await page.goto("/entrar");
  await loginAs(page, "varios@exemplo.com");
  await page.getByRole("button", { name: /Academia Beta Gestão · Professor/ }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/configuracoes/unidade");
  await expect(page.getByRole("heading", { name: "Esta área não está disponível para o seu perfil" })).toBeVisible();
});
