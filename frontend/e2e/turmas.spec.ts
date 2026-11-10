import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, path: string) {
  await page.evaluate(`history.pushState({}, "", ${JSON.stringify(path)}); dispatchEvent(new PopStateEvent("popstate"))`);
}

// RF-TUR-01: o Coordenador abre Operação › Turmas, vê a lista e filtra pelo dia e pela modalidade.
test("@critical Coordenador filtra a lista de turmas", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  // A modalidade só aparece no filtro depois de ativa na organização.
  await open(page, "/configuracoes/modalidades");
  await page.locator("section", { has: page.getByRole("heading", { name: "Disponíveis para ativar" }) }).getByRole("button", { name: /Ativar\s*Judô/ }).click();
  await expect(page.getByRole("button", { name: /Desativar\s*Judô/ })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Menu principal" });
  await nav.getByText("Operação", { exact: true }).click();
  await expect(nav.getByRole("link", { name: "Turmas" })).toBeVisible();
  await open(page, "/turmas"); // o link recarrega a página e a sessão simulada se perderia
  await expect(page.getByRole("heading", { name: "Turmas", level: 1 })).toBeVisible();
  await expect(page.getByText("Jiu-Jitsu Adulto")).toBeVisible();
  await expect(page.getByText("Judô Infantil")).toBeVisible();
  await expect(page.getByText("Boxe Noturno")).toBeVisible();

  await page.getByLabel("Dia").selectOption("2");
  await expect(page.getByText("Judô Infantil")).toBeVisible();
  await expect(page.getByText("Jiu-Jitsu Adulto")).toHaveCount(0);

  await page.getByLabel("Modalidade").selectOption({ label: "Judô" });
  await expect(page.getByText("Judô Infantil")).toBeVisible();
  await expect(page.getByText("Boxe Noturno")).toHaveCount(0);
});

// RF-TUR-02: o Coordenador entra no painel de uma turma da lista, desativa e vê o selo "Desativada".
test("@critical Coordenador abre e desativa uma turma", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/turmas");
  await page.getByRole("link", { name: "Jiu-Jitsu Adulto" }).click();
  const drawer = page.getByRole("dialog", { name: "Jiu-Jitsu Adulto" });
  await expect(drawer).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir grupo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Desativar" })).toBeEnabled();
  await page.getByRole("button", { name: "Desativar" }).click();
  await page.getByRole("dialog", { name: /^Desativar / }).getByRole("button", { name: "Desativar" }).click();
  await expect(page.getByText("Turma desativada.")).toBeVisible();
  await expect(drawer.getByText("Desativada", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Desativar" })).toBeDisabled();
});

// RF-TUR-03: o Coordenador abre Operação › Turmas, cria uma turma com nome, unidade, modalidade, titular e um horário e vê o painel dela.
test("@critical Coordenador cria uma turma", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/turmas");
  await expect(page.getByRole("heading", { name: "Turmas", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Nova turma" }).click();
  const dialog = page.getByRole("dialog", { name: "Nova turma" });
  await dialog.getByLabel("Nome da turma").fill("Muay Thai Noite");
  await dialog.getByLabel("Unidade").selectOption({ label: "Unidade Centro" });
  await dialog.getByLabel("Modalidade").selectOption({ label: "Judô" });
  await dialog.getByLabel("Professor titular").selectOption({ label: "João Pereira" });
  await dialog.getByRole("checkbox", { name: "Sexta-feira" }).check();
  await dialog.getByRole("button", { name: "Salvar" }).click();

  await expect(page.getByRole("heading", { name: "Muay Thai Noite" })).toBeVisible();
  await expect(page.getByText("Sexta-feira, 19:00–20:00")).toBeVisible();
});

// #458 CA6: a 360 px a lista vira cartões e não há rolagem lateral.
test("Turmas em cartões a 360 px sem rolagem lateral", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/turmas");
  await expect(page.getByText("Jiu-Jitsu Adulto")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  expect(await page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")).toBe(true);
});

// #462 CA6: a janela Desativar turma, com o bloqueio, não rola para o lado a 360 px.
test("Desativar turma com bloqueio a 360 px sem rolagem lateral", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/turmas/00000000-0000-0000-0000-000000000602");
  await page.getByRole("button", { name: "Desativar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Desativar Judô Infantil" });
  await expect(dialog.getByText("2 alunos com esta turma como principal")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Ver alunos" })).toBeVisible();
  expect(await page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")).toBe(true);
});

// #463 CA6: a gaveta da turma e o popover do sino não rolam para o lado a 360 px.
test("Gaveta da turma e popover do sino a 360 px sem rolagem lateral", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/turmas/00000000-0000-0000-0000-000000000602");
  await expect(page.getByRole("dialog", { name: "Judô Infantil" })).toBeVisible();
  expect(await page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")).toBe(true);
  await open(page, "/");
  await page.getByRole("button", { name: /^Notificações/ }).click();
  const popover = page.getByRole("dialog", { name: "Notificações" });
  await expect(popover).toBeVisible();
  const box = await popover.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  expect(await page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")).toBe(true);
});
