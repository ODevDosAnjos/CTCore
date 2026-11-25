import { expect, test, type Page } from "@playwright/test";

// #710: o CSS gerado tem de conter as utilitárias do código, qualquer que seja a rota aberta primeiro.
async function entrar(page: Page) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: /Bem-vindo ao ctcore|^Olá/ })).toBeVisible();
}

// a sessão do MSW vive na página: navega pelo roteador, sem recarregar
const ir = async (page: Page, rota: string) => {
  await page.evaluate(`history.pushState({}, "", "${rota}"); dispatchEvent(new PopStateEvent("popstate"))`);
  await page.waitForLoadState("networkidle");
};

const cor = (page: Page, classe: string) =>
  page.evaluate<string>(`(() => { const el = document.body.appendChild(document.createElement("span")); el.className = "${classe}"; const v = getComputedStyle(el).backgroundColor; el.remove(); return v; })()`);

async function conferir(page: Page) {
  expect(await cor(page, "bg-warn")).not.toBe("rgba(0, 0, 0, 0)");
  expect(await cor(page, "bg-info")).not.toBe("rgba(0, 0, 0, 0)");
  await page.getByRole("button", { name: "Notificações" }).first().click();
  const rodape = page.getByText("As notificações somem depois de 30 dias");
  await expect(rodape).toBeVisible();
  await expect(rodape).toHaveCSS("text-align", "center");
}

for (const ordem of [["/alunos", "/"], ["/", "/alunos"], ["/dev/vitrine", "/alunos"]]) {
  test(`css ${ordem.join(" depois ")}`, async ({ page }) => {
    await entrar(page);
    await ir(page, ordem[0]);
    await ir(page, ordem[1]);
    await expect(page.getByRole("button", { name: "Notificações" }).first()).toBeVisible();
    await conferir(page);
  });
}
