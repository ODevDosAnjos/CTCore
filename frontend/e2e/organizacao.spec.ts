import { expect, test, type Page } from "@playwright/test";

async function loginAs(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
}

// A sessão simulada vive na memória da página: recarregar de verdade a perderia. A navegação é feita pelo roteador
// (history + popstate), como um clique em link interno, e voltar à tela refaz a consulta ao "servidor".
async function open(page: Page, path: string) {
  await page.evaluate(`history.pushState({}, "", ${JSON.stringify(path)}); dispatchEvent(new PopStateEvent("popstate"))`);
}

// RF-ORG-01: o Coordenador altera nome e cor e vê o valor novo ao voltar à tela; o Administrador só vê.
test("@critical configurações da organização: Coordenador edita e Administrador só lê", async ({ page }) => {
  await loginAs(page, "ana@exemplo.com");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/configuracoes/organizacao");
  await expect(page.getByRole("heading", { name: "Organização", level: 1 })).toBeVisible();

  await page.getByLabel(/^Nome da organização/).fill("Dojo Novo");
  await page.getByLabel("Cor principal").fill("#ffeb3b");
  await expect(page.getByRole("alert").filter({ hasText: /Esta cor tem contraste/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
  await page.getByLabel("Cor principal").fill("#1a56db");
  await expect(page.getByText(/· AA$/)).toBeVisible();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Dados salvos.")).toBeVisible();

  await open(page, "/");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/configuracoes/organizacao");
  await expect(page.getByLabel(/^Nome da organização/)).toHaveValue("Dojo Novo");
  await expect(page.getByLabel("Cor principal")).toHaveValue("#1a56db");

  await page.evaluate('fetch("/api/v1/auth/logout", { method: "POST" })');
  await page.goto("/entrar");
  await loginAs(page, "varios@exemplo.com");
  await page.getByRole("button", { name: /Academia Alfa Gestão · Administrador/ }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/configuracoes/organizacao");
  await expect(page.getByRole("heading", { name: "Organização", level: 1 })).toBeVisible();
  await expect(page.getByLabel(/^Nome da organização/)).toBeDisabled();
  await expect(page.getByRole("button", { name: "Salvar alterações" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Enviar logo" })).toHaveCount(0);
});

// RF-ORG-06 / RN-ORG-06: a janela abre dentro da moldura; o escolhido que administra uma unidade sozinho exige marcá-la (aviso e 409),
// cada unidade marcada soma a vaga e, com a unidade marcada, a transferência conclui e a tela segue na sessão.
test("@critical transferir coordenação: unidade marcada com custo, aviso do Administrador único e sucesso na moldura", async ({ page }) => {
  await loginAs(page, "ana@exemplo.com");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/configuracoes/organizacao");
  await page.getByRole("button", { name: "Transferir coordenação" }).click();
  const dialog = page.getByRole("dialog", { name: "Transferir coordenação" });
  await dialog.getByLabel("Novo Coordenador").selectOption({ label: "Bruno · Administrador · Unidade Centro" });
  await expect(dialog.getByText(/administra esta unidade sozinho/)).toBeVisible();
  await expect(dialog.getByText("Nenhuma unidade marcada: sem custo adicional.")).toBeVisible();
  await dialog.getByLabel("Digite TRANSFERIR").fill("TRANSFERIR");
  await dialog.getByLabel("Sua senha").fill("segredo123");
  await dialog.getByRole("button", { name: "Transferir coordenação" }).click();
  await expect(dialog.getByText(/Estas unidades ficariam sem Administrador: Unidade Centro/)).toBeVisible();

  await dialog.getByRole("checkbox", { name: "Unidade Centro" }).check();
  await expect(dialog.getByText(/Custo adicional: R\$\s50,00\/mês/)).toBeVisible();
  await dialog.getByRole("button", { name: "Transferir coordenação" }).click();
  await expect(page.getByText("Coordenação transferida.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Organização", level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation").first()).toBeVisible();
});
