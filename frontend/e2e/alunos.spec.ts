import type { Page } from "@playwright/test";
import { expect, test } from "./support/msw";

async function open(page: Page, path: string) {
  await page.evaluate(`history.pushState({}, "", ${JSON.stringify(path)}); dispatchEvent(new PopStateEvent("popstate"))`);
}

// RF-ALU-01: o Coordenador abre Pessoas › Alunos, vê a lista e filtra pelo nome.
test("@critical Coordenador filtra a lista de alunos", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Menu principal" });
  await nav.getByText("Pessoas", { exact: true }).click();
  await expect(nav.getByRole("link", { name: "Alunos" })).toBeVisible();
  await open(page, "/alunos"); // o link recarrega a página e a sessão simulada se perderia
  await expect(page.getByRole("heading", { name: "Alunos", level: 1 })).toBeVisible();
  await expect(page.getByText("Aluno Adulto Fictício")).toBeVisible();
  await expect(page.getByText("Aluno Menor Fictício")).toBeVisible();

  await page.getByRole("searchbox", { name: "Buscar" }).fill("menor");
  await expect(page.getByText("Aluno Menor Fictício")).toBeVisible();
  await expect(page.getByText("Aluno Adulto Fictício")).toHaveCount(0);
});

// RF-ALU-02: o Coordenador filtra a lista pelo selo "Cadastro incompleto" e vê só o aluno esperado, com a etiqueta.
test("@critical Coordenador filtra alunos por selo", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/alunos");
  await expect(page.getByText("Aluno Menor Fictício")).toBeVisible();

  await page.getByRole("search").getByRole("button", { name: /^Selos/ }).click();
  await page.getByRole("listbox", { name: "Selos" }).getByRole("option", { name: "Cadastro incompleto" }).click();
  await expect(page.getByText("Aluno Menor Fictício")).toHaveCount(0);
  await expect(page.getByText("Aluno Adulto Fictício")).toBeVisible();
  await expect(page.getByRole("table").getByText("Cadastro incompleto", { exact: true })).toBeVisible();
});

// RF-ALU-03: o Coordenador abre a ficha em painel, vê o cabeçalho e o Resumo, vai para Responsáveis e fecha.
test("@critical Coordenador abre a ficha do aluno", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/alunos");
  await page.getByRole("link", { name: "Abrir a ficha de Aluno Menor Fictício" }).click();

  const panel = page.getByRole("dialog", { name: "Ficha do aluno" });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Aluno Menor Fictício").first()).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Responsáveis" })).toBeVisible();
  await expect(page).toHaveURL(/\/alunos\/00000000-0000-0000-0000-000000000702$/);

  await panel.getByRole("tab", { name: "Responsáveis" }).click();
  await expect(panel.getByText("Responsável Um Fictício")).toBeVisible();
  await expect(panel.getByRole("button", { name: "Vincular responsável" })).toBeVisible();

  await panel.getByRole("button", { name: "Fechar" }).click();
  await expect(panel).toHaveCount(0);
  await expect(page).toHaveURL(/\/alunos$/);
});

// #459 CA7: a 360 px a lista de alunos não tem rolagem lateral.
test("Alunos a 360 px sem rolagem lateral", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await open(page, "/alunos");
  await expect(page.getByText("Aluno Adulto Fictício")).toBeVisible();
  expect(await page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")).toBe(true);
});

async function loginAna(page: Page) {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
}
const ADULTO = "00000000-0000-0000-0000-000000000701";
// cenário: matrícula concluída pela API simulada, que gera a mensalidade em aberto do aluno adulto
const matricular = (page: Page) =>
  page.evaluate(async (id) => {
    const r = await fetch(`/api/v1/students/${id}/enrollment/conclude`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modalities: [{ unitId: "00000000-0000-0000-0000-000000000021", modalityId: "00000000-0000-0000-0000-000000000103", primaryClassId: "00000000-0000-0000-0000-000000000601", planId: "00000000-0000-0000-0000-000000000602", dueDay: 5 }],
        units: [],
      }),
    });
    if (!r.ok) throw new Error(String(r.status));
  }, ADULTO);
const noOverflow = (page: Page) => page.evaluate("document.documentElement.scrollWidth <= window.innerWidth");

// #461 CA8: a 360 px as janelas Cancelar cobrança e Encerrar modalidade não têm rolagem lateral.
test("Cancelar cobrança a 360 px sem rolagem lateral", async ({ page }) => {
  await loginAna(page);
  await matricular(page);
  await open(page, "/cobrancas");
  await page.getByRole("button", { name: /^Abrir cobrança de Aluno Adulto/ }).first().click();
  await page.getByRole("button", { name: "Cancelar cobrança" }).click();
  const dialog = page.getByRole("dialog", { name: "Cancelar cobrança" });
  await expect(dialog.getByLabel("Motivo")).toBeVisible();
  expect(await noOverflow(page)).toBe(true);
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test("Encerrar modalidade a 360 px sem rolagem lateral", async ({ page }) => {
  await loginAna(page);
  await matricular(page);
  await open(page, `/alunos/${ADULTO}`);
  await page.getByRole("tab", { name: "Matrícula" }).click();
  await page.getByRole("button", { name: "Encerrar" }).first().click();
  const dialog = page.getByRole("dialog", { name: /^Encerrar / });
  await dialog.getByRole("radio", { name: "Horário" }).check({ force: true });
  await dialog.getByText("Cancelar", { exact: true }).first().click();
  await expect(dialog.getByLabel("Motivo do cancelamento")).toBeVisible();
  expect(await noOverflow(page)).toBe(true);
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});

// #464 CA6: o estado de erro da lista a 360 px, com o servidor em 500, não rola para os lados.
test("Erro ao carregar a lista a 360 px sem rolagem lateral", async ({ page, msw }) => {
  await msw.override({ method: "get", path: "/students", status: 500, body: { code: "INTERNAL", message: "Erro." } });
  await loginAna(page);
  await page.setViewportSize({ width: 360, height: 740 });
  await open(page, "/alunos");
  await expect(page.getByRole("button", { name: "Tentar de novo" })).toBeVisible();
  expect(await noOverflow(page)).toBe(true);
});
