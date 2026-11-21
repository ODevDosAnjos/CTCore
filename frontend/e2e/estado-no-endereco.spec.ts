import { expect, test, type Page } from "@playwright/test";

const CENTRO = "00000000-0000-0000-0000-000000000021";
const JIU_JITSU = "00000000-0000-0000-0000-000000000103";
const ALUNO_MENOR = "00000000-0000-0000-0000-000000000702";
const TURMA_ADULTO = "00000000-0000-0000-0000-000000000601";
const PLANO_LIVRE = "00000000-0000-0000-0000-000000000602";

async function open(page: Page, path: string) {
  await page.evaluate(`history.pushState({}, "", ${JSON.stringify(path)}); dispatchEvent(new PopStateEvent("popstate"))`);
}

async function call(page: Page, method: string, path: string, body?: unknown) {
  const result = await page.evaluate(
    async ([m, p, b]) => {
      const response = await fetch(`/api/v1${p}`, { method: m as string, headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined });
      return { status: response.status, body: await response.json().catch(() => null) };
    },
    [method, path, body] as const,
  );
  expect(result.status, `${method} ${path}`).toBeLessThan(300);
  return result.body;
}

async function login(page: Page) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
}

// Conta as chamadas de listagem (GET na coleção, sem id) para provar que abrir e fechar o painel não refaz a lista.
function countListings(page: Page, collection: string) {
  const counter = { n: 0 };
  page.on("request", (r) => new RegExp(`/api/v1/${collection}(\\?|$)`).test(r.url()) && r.method() === "GET" && counter.n++);
  return counter;
}

// RNF-27, RNF-43 (#676): o endereço é a fonte do estado. O F5 recarrega a página; o login simulado sobrevive ao reload (sessionStorage).
test("@critical Alunos: filtro, painel, aba, voltar e F5 ficam no endereço", async ({ page }) => {
  await login(page);
  await open(page, "/alunos?q=menor");
  await expect(page.getByText("Aluno Menor Fictício")).toBeVisible();
  await expect(page.getByText("Aluno Adulto Fictício")).toHaveCount(0);

  const listings = countListings(page, "students");
  await page.getByRole("link", { name: "Abrir a ficha de Aluno Menor Fictício" }).click();
  const panel = page.getByRole("dialog", { name: "Ficha do aluno" });
  await expect(page).toHaveURL(/\/alunos\/00000000-0000-0000-0000-000000000702\?q=menor$/);
  await panel.getByRole("tab", { name: "Responsáveis" }).click();
  await expect(page).toHaveURL(/\?q=menor&aba=responsaveis$/);

  await page.reload(); // F5: o mesmo aluno, na mesma aba, sobre a mesma lista
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("tab", { name: "Responsáveis" })).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(/\/alunos\/00000000-0000-0000-0000-000000000702\?q=menor&aba=responsaveis$/);

  listings.n = 0;
  await panel.getByRole("button", { name: "Fechar" }).click();
  await expect(panel).toHaveCount(0);
  await expect(page).toHaveURL(/\/alunos\?q=menor$/);
  await expect(page.getByText("Aluno Adulto Fictício")).toHaveCount(0);
  expect(listings.n, "fechar o painel não refaz a listagem").toBe(0);

  await page.goBack(); // o painel reabre, na aba que estava (a troca de aba não entrou no histórico)
  await expect(panel).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/alunos\?q=menor$/);
  await expect(panel).toHaveCount(0);
});

test("@critical Turmas: filtro, painel, sem nova listagem, voltar, F5 e link para a lista de alunos", async ({ page }) => {
  await login(page);
  await open(page, "/turmas?q=Jiu");
  await expect(page.getByRole("heading", { name: "Turmas", level: 1 })).toBeVisible();
  const listings = countListings(page, "classes");
  await page.getByRole("link", { name: "Jiu-Jitsu Adulto" }).first().click();
  const drawer = page.getByRole("dialog", { name: "Jiu-Jitsu Adulto" });
  await expect(drawer).toBeVisible();
  await expect(page).toHaveURL(/\/turmas\/[^/?]+\?q=Jiu$/);

  await page.reload(); // F5: o mesmo registro reabre
  await expect(drawer).toBeVisible();
  await expect(page).toHaveURL(/\/turmas\/[^/?]+\?q=Jiu$/);

  listings.n = 0;
  await drawer.getByRole("button", { name: "Fechar" }).click();
  await expect(drawer).toHaveCount(0);
  await expect(page).toHaveURL(/\/turmas\?q=Jiu$/);
  expect(listings.n, "fechar o painel não refaz a listagem").toBe(0);

  await page.goBack(); // reabre o painel
  await expect(drawer).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/turmas\?q=Jiu$/);
  await expect(drawer).toHaveCount(0);

  // Link para outra lista com filtro: "Ver todos os alunos" do painel da turma.
  await page.getByRole("link", { name: "Jiu-Jitsu Adulto" }).first().click();
  await page.getByRole("link", { name: "Ver todos os alunos" }).click();
  await expect(page).toHaveURL(/\/alunos\?classId=[^&]+$/);
  await expect(page.getByRole("heading", { name: "Alunos", level: 1 })).toBeVisible();
});

test("@critical Professores: filtro, painel, voltar e F5", async ({ page }) => {
  await login(page);
  await open(page, "/professores?q=Jo");
  const link = page.getByRole("link", { name: "João Pereira" });
  await expect(link).toBeVisible();
  const listings = countListings(page, "teachers");
  await link.click();
  await expect(page).toHaveURL(/\/professores\/[^/?]+\?q=Jo$/);
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();

  await page.reload(); // F5: o mesmo professor reabre
  await expect(drawer).toBeVisible();
  await expect(page).toHaveURL(/\/professores\/[^/?]+\?q=Jo$/);

  listings.n = 0;
  await drawer.getByRole("button", { name: "Fechar" }).click();
  await expect(page).toHaveURL(/\/professores\?q=Jo$/);
  await expect(drawer).toHaveCount(0);
  expect(listings.n, "fechar o painel não refaz a listagem").toBe(0);

  await page.goBack();
  await expect(drawer).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/professores\?q=Jo$/);
  await expect(link).toBeVisible();
});

// A cobrança nasce da matrícula feita na própria sessão simulada, que não sobrevive ao F5 (só o login sobrevive): sem F5 aqui.
test("@critical Cobranças: abrir e fechar mantém o filtro; o endereço antigo chega a /cobrancas/<id>", async ({ page }) => {
  await login(page);
  await call(page, "PUT", `/modalities/${JIU_JITSU}/activation`, { active: true });
  await call(page, "PUT", `/units/${CENTRO}/modalities/${JIU_JITSU}`, { offered: true });
  const done = (await call(page, "POST", `/students/${ALUNO_MENOR}/enrollment/conclude`, {
    modalities: [{ unitId: CENTRO, modalityId: JIU_JITSU, primaryClassId: TURMA_ADULTO, planId: PLANO_LIVRE, dueDay: 5 }],
    units: [{ unitId: CENTRO }],
  })) as { charges: { id: string }[] };
  const id = done.charges[0].id;

  await open(page, `/cobrancas?studentId=${ALUNO_MENOR}`);
  await expect(page.getByRole("heading", { name: "Cobranças", level: 1 })).toBeVisible();
  const listings = countListings(page, "charges");
  await page.getByText("Aluno Menor Fictício").first().click();
  await expect(page).toHaveURL(new RegExp(`/cobrancas/${id}\\?studentId=${ALUNO_MENOR}$`));
  const panel = page.getByRole("dialog").first();
  await expect(panel).toBeVisible();

  listings.n = 0;
  await panel.getByRole("button", { name: "Fechar" }).click();
  await expect(page).toHaveURL(new RegExp(`/cobrancas\\?studentId=${ALUNO_MENOR}$`));
  expect(listings.n, "fechar o painel não refaz a listagem").toBe(0);

  await page.goBack(); // reabre
  await expect(page).toHaveURL(new RegExp(`/cobrancas/${id}\\?studentId=${ALUNO_MENOR}$`));
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/cobrancas\\?studentId=${ALUNO_MENOR}$`));

  await open(page, `/cobrancas?cobranca=${id}&status=OVERDUE`);
  await expect(page).toHaveURL(new RegExp(`/cobrancas/${id}\\?status=OVERDUE$`));
});

test("Abas: Minha conta e Unidade guardam a aba no endereço, sem histórico e com F5", async ({ page }) => {
  await login(page);
  await open(page, "/conta");
  await page.getByRole("tab", { name: "Sessões" }).click();
  await expect(page).toHaveURL(/\/conta\?aba=sessoes$/);
  await page.reload(); // F5 mantém a aba
  await expect(page.getByRole("tab", { name: "Sessões" })).toHaveAttribute("aria-selected", "true");

  await open(page, "/configuracoes/unidade");
  await page.getByRole("tab", { name: /^Pagamentos/ }).click();
  await expect(page).toHaveURL(/\/configuracoes\/unidade\?aba=payments$/);
  await page.reload();
  await expect(page.getByRole("tab", { name: /^Pagamentos/ })).toHaveAttribute("aria-selected", "true");
  await page.goBack(); // a troca de aba usou replace: o voltar sai da tela
  await expect(page).toHaveURL(/\/conta\?aba=sessoes$/);
});
