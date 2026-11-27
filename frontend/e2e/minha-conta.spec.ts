import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: /Bem-vindo ao ctcore|^Olá/ })).toBeVisible();
}

// RF-ACE-04 / RN-ACE-20: trocar a senha em Minha conta encerra as outras sessões e mantém a atual.
// O MSW vive em cada aba, então a "outra sessão" é a do aparelho listado pelo mock; o 401 dela é provado no back-end (SessionListIT).
test("@critical troca de senha encerrando as outras sessões", async ({ page }) => {
  await login(page, "ana@exemplo.com");

  await page.getByRole("button", { name: /Menu da conta/ }).click();
  await page.getByRole("menuitem", { name: "Minha conta" }).click();
  await expect(page.getByRole("heading", { name: "Minha conta", level: 1 })).toBeVisible();
  await page.getByRole("tab", { name: "Segurança" }).click();
  await expect(page.getByText("Safari em iOS")).toBeVisible();
  await page.getByRole("button", { name: "Trocar senha" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Senha atual").fill("Atual12345");
  await dialog.locator("#acc-senha").fill("NovaSenha123");
  await dialog.getByLabel("Confirmar senha").fill("NovaSenha123");
  await dialog.getByRole("button", { name: "Trocar senha" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText("Safari em iOS")).toHaveCount(0);
  await expect(page.getByText("Chrome em Windows")).toBeVisible();
  await expect(page.getByText("Este aparelho")).toBeVisible();
});

// #762, RNF-56: as quatro abas dentro da moldura, com F5 e sem rolagem horizontal a 360 px.
const ABAS = [
  ["perfil", "Perfil"],
  ["seguranca", "Segurança"],
  ["notificacoes", "Notificações"],
  ["privacidade", "Privacidade"],
] as const;

for (const [area, email, conteudo] of [
  ["gestão", "ana@exemplo.com", ["Meus vínculos", "Sessões ativas", "Sino da gestão", "Baixar meus dados"]],
  ["portal", "aluno@exemplo.com", ["Meus vínculos", "Sessões ativas", "Preferências de e-mail", "Excluir minha conta"]],
] as const) {
  test(`Minha conta (${area}): as quatro abas dentro da moldura, F5 e 360 px`, async ({ page }) => {
    await login(page, email);
    if (area === "gestão") {
      await page.getByRole("button", { name: /Menu da conta/ }).click();
      await page.getByRole("menuitem", { name: "Minha conta" }).click();
    } else {
      await page.getByRole("banner").getByRole("link", { name: /Minha conta/ }).click();
    }
    const main = page.getByRole("main");
    await expect(main.getByRole("tab")).toHaveText(ABAS.map(([, nome]) => nome));
    for (const [i, [id, nome]] of ABAS.entries()) {
      await main.getByRole("tab", { name: nome }).click();
      await expect(page).toHaveURL(new RegExp(`aba=${id}$`));
      await page.reload();
      await expect(main.getByRole("tab", { name: nome })).toHaveAttribute("aria-selected", "true");
      await expect(main.getByRole("heading", { name: conteudo[i] })).toBeVisible();
      await expect(page.getByRole("banner").first()).toBeVisible();
    }

    await page.setViewportSize({ width: 360, height: 800 });
    for (const [i, [id]] of ABAS.entries()) {
      await page.goto(`/conta?aba=${id}`);
      // abaixo de 640 px a Privacidade do portal vira linhas "Em breve", sem título de cartão
      const alvo = area === "portal" && id === "privacidade" ? main.getByRole("list", { name: "Dados da conta" }) : main.getByRole("heading", { name: conteudo[i] });
      await expect(alvo).toBeVisible();
      expect(await page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")).toBeLessThanOrEqual(0);
    }
  });
}

// #763: Perfil dentro da moldura da gestão. PNG fictício de 1 pixel, gerado aqui.
test("Perfil: salva nome e telefone, envia a foto, vê no topo e remove, também a 360 px", async ({ page }) => {
  await login(page, "ana@exemplo.com");
  await page.getByRole("button", { name: /Menu da conta/ }).click();
  await page.getByRole("menuitem", { name: "Minha conta" }).click();
  const main = page.getByRole("main");
  const top = page.getByRole("banner").first();
  await main.getByRole("tab", { name: "Perfil" }).click();

  await main.getByRole("textbox", { name: /^Nome/ }).fill("Ana Fictícia");
  await main.getByRole("textbox", { name: "Telefone/WhatsApp" }).fill("21999990000");
  await main.getByRole("button", { name: "Salvar" }).click();
  await expect(main.getByText("Dados salvos.")).toBeVisible();
  await expect(top.getByText("Ana Fictícia")).toBeVisible();

  await main.getByLabel("Arquivo da foto").setInputFiles({
    name: "foto.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHnOcQAAAAABJRU5ErkJggg==", "base64"),
  });
  await page.getByRole("dialog", { name: "Cortar a foto" }).getByRole("button", { name: "Usar este corte" }).click();
  await expect(main.getByText("Foto salva.")).toBeVisible();
  await expect(top.locator("img[src^='data:image/png']")).toBeVisible();

  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")).toBeLessThanOrEqual(0);

  await main.getByRole("button", { name: "Remover foto" }).click();
  await expect(main.getByText("Foto removida.")).toBeVisible();
  await expect(top.locator("img[src^='data:image/png']")).toHaveCount(0);
});
