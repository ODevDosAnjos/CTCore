import { expect, test } from "@playwright/test";

// RF-ACE-03: pede o link (mesma mensagem), cria a senha pelo link, entra; link vencido explica.
test("@critical Recuperação de senha", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByRole("link", { name: "Esqueci minha senha" }).click();
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  // #683: sob carga o POST do MSW passa de 5 s; espera a resposta (limite do teste) antes de afirmar a mensagem.
  const resposta = page.waitForResponse((r) => r.url().includes("/auth/password-reset") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Enviar link" }).click();
  await resposta;
  await expect(page.getByText("Confira também a caixa de spam.", { exact: false })).toBeVisible();

  await page.goto("/redefinir-senha/valido");
  const botao = page.getByRole("button", { name: "Criar senha e entrar" });
  await page.getByLabel("Nova senha", { exact: true }).fill("fraca");
  await page.getByLabel("Repita a nova senha").fill("fraca");
  await expect(botao).toBeDisabled();
  await page.getByLabel("Nova senha", { exact: true }).fill("Senha123");
  await page.getByLabel("Repita a nova senha").fill("Senha123");
  await expect(botao).toBeEnabled();
  await botao.click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/redefinir-senha/vencido");
  await page.getByLabel("Nova senha", { exact: true }).fill("Senha123");
  await page.getByLabel("Repita a nova senha").fill("Senha123");
  await page.getByRole("button", { name: "Criar senha e entrar" }).click();
  await expect(page.getByRole("heading", { name: "Este link venceu" })).toBeVisible();
});
