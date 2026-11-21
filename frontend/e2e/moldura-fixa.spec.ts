import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// RNF-43 (#675): a moldura é a rota-pai; navegar troca só a área central. Dados fictícios do MSW.
async function login(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
}

// Conta as leituras de um endereço da API (o service worker do MSW não esconde o pedido da página).
function count(page: Page, path: string) {
  const hits = { n: 0 };
  page.on("request", (r) => {
    if (new URL(r.url()).pathname === `/api/v1${path}`) hits.n++;
  });
  return hits;
}
// Navega pelo roteador (sem recarregar: o goto perderia a sessão do MSW).

const abre = (page: Page, path: string) =>
  page.evaluate(`history.pushState({}, "", ${JSON.stringify(path)}); dispatchEvent(new PopStateEvent("popstate"))`);

// Atrasa no fetch da página (o MSW atende pelo service worker, que o page.route não alcança).
const delay = (page: Page, pattern: string, ms = 1500) =>
  page.addInitScript(
    ([p, t]) => {
      const original = globalThis.fetch;
      globalThis.fetch = async (...args) => {
        const url = String(args[0] instanceof Request ? args[0].url : args[0]);
        if (new RegExp(p).test(url)) await new Promise((ok) => setTimeout(ok, Number(t)));
        return original(...args);
      };
    },
    [pattern, String(ms)],
  );

// Marca o menu lateral (ou as abas) e a barra de cima: se a moldura fosse remontada, a marca sumiria.
const mark = (page: Page, nav: string) =>
  page.evaluate(`document.querySelector(${JSON.stringify(nav)}).setAttribute("data-marca", "menu"); document.querySelector("header").setAttribute("data-marca", "barra")`);
const marked = (page: Page) => page.evaluate<string[]>(`[...document.querySelectorAll("[data-marca]")].map((e) => e.getAttribute("data-marca")).sort()`);

test("@critical gestão no desktop: menu, barra, grupo aberto e menu recolhido ficam, e /permissions é lido uma vez", async ({ page }) => {
  const reads = count(page, "/permissions"); // o StrictMode do dev lê duas vezes na montagem: vale a contagem depois dela
  await login(page, "ana@exemplo.com");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Menu principal" });
  await expect.poll(() => reads.n).toBeGreaterThan(0);
  const base = reads.n;
  await mark(page, "nav[aria-label='Menu principal']");
  await nav.getByRole("button", { name: "Pessoas" }).click();
  await nav.getByRole("link", { name: "Alunos" }).click();
  await expect(page.getByRole("heading", { name: "Alunos", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Recolher menu" }).click();
  for (const href of ["/pedidos", "/agenda", "/"]) {
    await nav.locator(`a[href='${href}']`).first().click();
    await expect(page).toHaveURL((u) => u.pathname === href);
  }
  expect(await marked(page)).toEqual(["barra", "menu"]);
  await expect(page.getByRole("button", { name: "Expandir menu" })).toBeVisible();
  await page.getByRole("button", { name: "Expandir menu" }).click();
  await expect(nav.getByRole("button", { name: "Pessoas" })).toHaveAttribute("aria-expanded", "true");
  expect(reads.n).toBe(base);
});

test("@critical gestão: a moldura continua visível com a tela atrasada e o carregando fica só no centro", async ({ page }) => {
  await delay(page, "/api/v1/students");
  await login(page, "ana@exemplo.com");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await mark(page, "nav[aria-label='Menu principal']");
  const nav = page.getByRole("navigation", { name: "Menu principal" });
  await nav.getByRole("button", { name: "Pessoas" }).click();
  await nav.getByRole("link", { name: "Alunos" }).click();
  await expect(page.locator("main").getByRole("status")).toBeVisible();
  await expect(nav).toBeVisible();
  await expect(page.locator("header").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Alunos", level: 1 })).toBeVisible();
  expect(await marked(page)).toEqual(["barra", "menu"]);
});

test("@critical endereço antigo, endereço inexistente e troca de vínculo", async ({ page }) => {
  await login(page, "ana@exemplo.com");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await abre(page, "/planos/lista");
  await expect(page).toHaveURL((u) => u.pathname === "/planos");
  await expect(page.getByRole("navigation", { name: "Menu principal" })).toBeVisible();
  await abre(page, "/nao-existe-aqui");
  await expect(page.getByRole("heading", { name: "Página não encontrada", level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Menu principal" })).toBeVisible();
  await page.getByRole("link", { name: "Ir para o Início" }).last().click();
  await expect(page).toHaveURL((u) => u.pathname === "/");
});

test("@critical sem sessão, endereço inexistente leva ao login", async ({ page }) => {
  await page.goto("/nao-existe-aqui");
  await expect(page).toHaveURL(/\/entrar/);
});

test("@critical troca de vínculo leva ao Início do vínculo novo e lê as permissões de novo", async ({ page }) => {
  const reads = count(page, "/permissions"); // o StrictMode do dev lê duas vezes na montagem: vale a contagem depois dela
  await login(page, "varios@exemplo.com");
  await page.getByRole("button", { name: /Academia Alfa Gestão/ }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  await expect.poll(() => reads.n).toBeGreaterThan(0);
  const base = reads.n;
  await abre(page, "/turmas");
  await expect(page).toHaveURL((u) => u.pathname === "/turmas");
  await page.getByRole("button", { name: "Trocar organização ou área" }).click();
  await page.getByRole("button", { name: /Academia Beta Gestão/ }).click();
  await expect(page).toHaveURL((u) => u.pathname === "/");
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
  expect(reads.n).toBeGreaterThan(base);
});

test.describe("a 360 px", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("@critical gestão: abas e barra continuam os mesmos", async ({ page }) => {
    const reads = count(page, "/permissions");
    await login(page, "ana@exemplo.com");
    await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
    await expect.poll(() => reads.n).toBeGreaterThan(0);
    const base = reads.n;
    const tabs = page.getByRole("navigation", { name: "Abas principais" });
    await mark(page, "nav[aria-label='Abas principais']");
    for (const href of await page.evaluate<string[]>(`[...document.querySelectorAll("nav[aria-label='Abas principais'] a[href^='/']")].map((a) => a.getAttribute("href"))`)) {
      await tabs.locator(`a[href='${href}']`).first().click();
      await expect(page).toHaveURL((u) => u.pathname === href);
    }
    expect(await marked(page)).toEqual(["barra", "menu"]);
    expect(await page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")).toBe(true);
    expect(reads.n).toBe(base);
  });

  test("@critical portal: moldura fixa, /portal/shell lido uma vez e telas atrasadas só no centro", async ({ page }) => {
    const reads = count(page, "/portal/shell");
    await delay(page, "/api/v1/portal/(agenda|announcements)");
    await login(page, "familia@exemplo.com");
    const tabs = page.getByRole("navigation", { name: "Portal, abas" });
    await expect.poll(() => reads.n).toBeGreaterThan(0);
    const base = reads.n;
    await expect(tabs).toBeVisible();
    await mark(page, "nav[aria-label='Portal, abas']");
    for (const href of ["/portal/agenda", "/portal/avisos"]) {
      await tabs.locator(`a[href='${href}']`).first().click();
      await expect(page).toHaveURL((u) => u.pathname === href);
      await expect(tabs).toBeVisible();
    }
    await expect(page.locator("main").getByRole("heading", { level: 1 })).toBeVisible();
    expect((await marked(page)).includes("menu")).toBe(true);
    expect(reads.n).toBe(base);
  });

  test("@critical portal reduzido: /portal/agenda vai a /portal/financeiro sem segunda leitura", async ({ page }) => {
    const reads = count(page, "/portal/shell");
    await login(page, "reduzido@exemplo.com");
    await expect(page.getByRole("navigation", { name: "Portal, abas" })).toBeVisible();
    await expect.poll(() => reads.n).toBeGreaterThan(0);
    const base = reads.n;
    await abre(page, "/portal/agenda");
    await expect(page).toHaveURL((u) => u.pathname === "/portal/financeiro");
    await expect(page.getByRole("navigation", { name: "Portal, abas" })).toBeVisible();
    expect(reads.n).toBe(base);
  });
});
