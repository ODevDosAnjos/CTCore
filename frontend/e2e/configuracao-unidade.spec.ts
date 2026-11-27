import { expect, test, type Page } from "@playwright/test";

const UNIT = "/configuracoes/unidades/00000000-0000-0000-0000-000000000021";

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
  await open(page, UNIT);
  await expect(page.getByRole("heading", { name: /^Unidade /, level: 1 })).toBeVisible();

  await page.getByLabel("Telefone").fill("21999998888");
  await page.getByLabel("Razão social (opcional)").fill("Dojo Centro Ltda.");
  // RNF-56: a tela abre dentro da moldura.
  await expect(page.getByRole("navigation").first()).toBeVisible();
  await page.getByRole("tab", { name: "Cobrança" }).click();
  await page.getByRole("switch", { name: "Cobrar taxa de matrícula" }).click();
  await page.getByLabel("Valor da taxa").fill("");
  await page.getByLabel("Valor da taxa").pressSequentially("15000");
  // RN-AEX-02: o limite é salvo na unidade.
  await page.getByRole("tab", { name: "Divulgação" }).click();
  await expect(page.getByRole("switch", { name: /Aparecer no diretório/ })).toHaveAttribute("aria-disabled", "true");
  await page.getByLabel("Limite de aulas experimentais por pessoa").selectOption("3");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Salvo", { exact: true })).toBeVisible();

  await open(page, "/");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, UNIT);
  await expect(page.getByLabel("Telefone")).toHaveValue("(21) 99999-8888");
  await expect(page.getByLabel("Razão social (opcional)")).toHaveValue("Dojo Centro Ltda.");
  await page.getByRole("tab", { name: "Cobrança" }).click();
  await expect(page.getByLabel("Valor da taxa")).toHaveValue("R$ 150,00");
  await page.getByRole("tab", { name: "Divulgação" }).click();
  await expect(page.getByLabel("Limite de aulas experimentais por pessoa")).toHaveValue("3");

  // A 360 px nenhuma aba faz a página rolar na horizontal.
  await page.setViewportSize({ width: 360, height: 740 });
  for (const name of ["Dados", "Cobrança", "Lembretes", "Divulgação", "Permissões do Professor"]) {
    await page.getByRole("tab", { name }).click();
    await expect(page.getByRole("tab", { name })).toHaveAttribute("aria-selected", "true");
    expect(await page.evaluate("document.documentElement.scrollWidth"), name).toBeLessThanOrEqual(360);
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.evaluate('fetch("/api/v1/auth/logout", { method: "POST" })');
  await page.goto("/entrar");
  await loginAs(page, "varios@exemplo.com");
  await page.getByRole("button", { name: /Academia Beta Gestão · Professor/ }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, UNIT);
  await expect(page.getByRole("heading", { name: "Esta área não está disponível para o seu perfil" })).toBeVisible();
});

// RN-COB-17 (issue 638): desligar mantém o dia, que volta como salvo; a 390 px o texto de cada linha tem largura e não se sobrepõe.
test("@critical lembretes da unidade: desligar, ajustar o dia, religar, salvar e reabrir; texto legível a 390 px", async ({ page }) => {
  await loginAs(page, "ana@exemplo.com");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, `${UNIT}?aba=reminders`);
  await expect(page.getByRole("navigation").first()).toBeVisible();

  await page.getByRole("switch", { name: "3 dias depois" }).click();
  await expect(page.getByRole("switch", { name: "3 dias depois" })).not.toBeChecked();
  await page.getByLabel("Dias depois no 1º lembrete").fill("5");
  await page.getByRole("switch", { name: "5 dias depois" }).click();
  await page.getByRole("switch", { name: "No dia do vencimento" }).click();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Salvo", { exact: true })).toBeVisible();

  await open(page, "/");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, `${UNIT}?aba=reminders`);
  await expect(page.getByRole("switch", { name: "5 dias depois" })).toBeChecked();
  await expect(page.getByLabel("Dias depois no 1º lembrete")).toHaveValue("5");
  await expect(page.getByRole("switch", { name: "No dia do vencimento" })).not.toBeChecked();

  await page.setViewportSize({ width: 390, height: 844 });
  const rows = page.getByRole("listitem").filter({ has: page.getByRole("switch") });
  await expect(rows).toHaveCount(5);
  for (const row of await rows.all()) {
    const text = row.locator(":scope > div").first();
    const box = (await text.boundingBox())!;
    const title = await text.locator("p").first().innerText();
    expect(box.width, title).toBeGreaterThanOrEqual(150);
    // A chave, o "E-mail", o "Push" e o "Sempre ligado": tudo o que não é o bloco de texto.
    for (const other of await row.locator(":scope > :not(:nth-child(2))").all()) {
      const o = (await other.boundingBox())!;
      const overlaps = o.x < box.x + box.width && box.x < o.x + o.width && o.y < box.y + box.height && box.y < o.y + o.height;
      expect(overlaps, title).toBe(false);
    }
  }
  expect(await page.evaluate("document.documentElement.scrollWidth")).toBeLessThanOrEqual(390);
});
