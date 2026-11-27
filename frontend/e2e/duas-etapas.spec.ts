import { expect, test } from "@playwright/test";

// RN-ACE-17 / RF-ACE-01 (LoginDuasEtapas): senha certa leva ao segundo passo; o código conclui o login.
test("@critical login com duas etapas: senha, segundo passo, código e área", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("duas@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByRole("heading", { name: "Duas etapas" })).toBeVisible();
  await page.getByLabel("Código").fill("000000");
  await expect(page.getByRole("alert")).toContainText("Código incorreto");

  await page.getByLabel("Código").fill("123456");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
});

// RN-ACE-24 (#628): o Coordenador exige as duas etapas dos Administradores; o Administrador sem elas configura antes de entrar.
// Sem recarregar a página: a exigência do MSW vive em memória.
test("@critical exigir duas etapas dos Administradores: o Coordenador liga e o Administrador configura antes de entrar", async ({ page }) => {
  const login = async (email: string) => {
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill("segredo123");
    await page.getByRole("button", { name: "Entrar" }).click();
  };
  await page.goto("/entrar");
  await login("ana@exemplo.com");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();

  const nav = page.getByRole("navigation", { name: "Menu principal" });
  await nav.getByText("Configurações", { exact: true }).click();
  await nav.getByRole("link", { name: "Dados e segurança" }).click();
  await expect(page).toHaveURL(/\/configuracoes\/dados-e-seguranca$/);
  await expect(nav).toBeVisible();
  await expect(page.getByRole("main").getByRole("heading", { level: 1, name: "Dados e segurança" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Duas etapas", selected: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Auditoria" })).toHaveAttribute("aria-disabled", "true");

  const required = page.getByRole("switch", { name: "Exigir duas etapas dos Administradores" });
  await required.click();
  await page.getByRole("dialog").getByRole("button", { name: "Exigir duas etapas" }).click();
  await expect(required).toBeChecked();

  await page.getByRole("banner").getByRole("button", { name: /Menu da conta/ }).click();
  await page.getByRole("menuitem", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/\/entrar$/);
  await login("admin@exemplo.com");

  await expect(page.getByRole("heading", { name: "Ative as duas etapas para continuar" })).toBeVisible();
  await expect(page.getByText("A sua organização exige a verificação em duas etapas dos Administradores.")).toBeVisible();
  await expect(nav).toHaveCount(0);
  await page.getByRole("button", { name: "Ativar duas etapas" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Agora não" })).toHaveCount(0);
  await dialog.getByLabel("Digite o código de 6 números que aparece no app").fill("123456");
  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await dialog.getByLabel("Guardei os códigos em lugar seguro").check();
  await dialog.getByRole("button", { name: "Concluir" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await expect(nav).toBeVisible();
});

// issue 764, RNF-56: trocar de aparelho a partir de Minha conta › Segurança, dentro da moldura e também a 360 px.
test("Segurança: contagem de códigos de reserva e troca de aparelho, também a 360 px", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("duas@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByLabel("Código").fill("123456");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await page.getByRole("button", { name: /Menu da conta/ }).click();
  await page.getByRole("menuitem", { name: "Minha conta" }).click();
  const main = page.getByRole("main");
  await main.getByRole("tab", { name: "Segurança" }).click();
  await expect(page.getByRole("banner").first()).toBeVisible();
  await expect(main.getByText("códigos de reserva: 8 de 10")).toBeVisible();

  await page.setViewportSize({ width: 360, height: 800 });
  const noScroll = () => page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth");
  expect(await noScroll()).toBeLessThanOrEqual(0);
  await main.getByRole("button", { name: "Trocar de aparelho" }).click();
  const dialog = page.getByRole("dialog", { name: "Trocar de aparelho" });
  await dialog.getByLabel("Senha").fill("segredo123");
  await dialog.getByLabel("Código do app ou de reserva").fill("RESERVA001");
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await expect(dialog.getByAltText("QR code para o aparelho novo")).toBeVisible();
  expect(await noScroll()).toBeLessThanOrEqual(0);
  await dialog.getByLabel("Digite o código de 6 números que aparece no app").fill("123456");
  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(dialog).toBeHidden();
  await expect(main.getByText("Aparelho trocado. Use o app novo no próximo acesso.")).toBeVisible();
  await expect(main.getByText("códigos de reserva: 7 de 10")).toBeVisible();
});
