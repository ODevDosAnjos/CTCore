import { expect, test } from "@playwright/test";

// RF-ACE-04 / RN-ACE-20: trocar a senha em Minha conta encerra as outras sessões e mantém a atual.
// O MSW vive em cada aba, então a "outra sessão" é a do aparelho listado pelo mock; o 401 dela é provado no back-end (SessionListIT).
test("@critical troca de senha encerrando as outras sessões", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();

  await page.getByRole("button", { name: /Menu da conta/ }).click();
  await page.getByRole("menuitem", { name: "Minha conta" }).click();
  await expect(page.getByRole("heading", { name: "Minha conta", level: 1 })).toBeVisible();
  await page.getByRole("tab", { name: "Sessões" }).click();
  await expect(page.getByText("Safari em iOS")).toBeVisible();
  await page.getByRole("tab", { name: "Acesso" }).click();
  await page.getByRole("button", { name: "Trocar senha" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Senha atual").fill("Atual12345");
  await dialog.locator("#acc-senha").fill("NovaSenha123");
  await dialog.getByLabel("Confirmar senha").fill("NovaSenha123");
  await dialog.getByRole("button", { name: "Trocar senha" }).click();

  await expect(dialog).toBeHidden();
  await page.getByRole("tab", { name: "Sessões" }).click();
  await expect(page.getByText("Safari em iOS")).toHaveCount(0);
  await expect(page.getByText("Chrome em Windows")).toBeVisible();
  await expect(page.getByText("Este aparelho")).toBeVisible();
});
