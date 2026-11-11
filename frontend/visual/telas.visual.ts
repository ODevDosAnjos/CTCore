import { expect, test, type Page } from "@playwright/test";
import { casos, larguras, temas, type Passo } from "./casos";

// R3: relógio fixo em 29/10/2026 12:00 (America/Sao_Paulo, -03:00).
const AGORA = new Date("2026-10-29T12:00:00-03:00");

async function assentar(page: Page, perfil?: string) {
  await page.waitForLoadState("networkidle");
  if (perfil) await expect(page.getByRole("status").filter({ hasText: /Carregando/ })).toHaveCount(0); // esqueletos de carregamento
}

async function abrir(page: Page, rota: string, perfil?: string, passos: Passo[] = [], matricula = false, aguardar?: string, oferta = false) {
  if (perfil) {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(perfil);
    await page.getByLabel("Senha").fill("segredo123");
    await page.getByRole("button", { name: "Entrar" }).click();
    if (perfil.startsWith("duas@")) {
      await page.getByLabel("Código do app").fill("123456"); // conta com as duas etapas ligadas
      await page.getByRole("button", { name: "Confirmar" }).click();
    }
    await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();
    if (oferta) {
      // a Coordenação liga Jiu-Jitsu na unidade Centro para o assistente oferecer a modalidade
      await page.evaluate(async () => {
        await fetch("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "ana@exemplo.com", password: "segredo123" }) });
        await fetch("/api/v1/modalities/00000000-0000-0000-0000-000000000103/activation", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: true }) });
        const r = await fetch("/api/v1/units/00000000-0000-0000-0000-000000000021/modalities/00000000-0000-0000-0000-000000000103", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offered: true }) });
        if (!r.ok) throw new Error(`oferta do caso: ${r.status}`);
      });
    }
    if (matricula) {
      // o MSW vive na página: a Coordenação matricula o aluno fictício na turma 601, liga a ficha do Professor e o login volta ao perfil do caso
      await page.evaluate(async (email) => {
        const post = (url: string, body: unknown) => fetch(`/api/v1${url}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        await post("/auth/login", { email: "ana@exemplo.com", password: "segredo123" });
        const r = await post("/students/00000000-0000-0000-0000-000000000701/enrollment/conclude", {
          modalities: [{ unitId: "00000000-0000-0000-0000-000000000021", modalityId: "00000000-0000-0000-0000-000000000103", primaryClassId: "00000000-0000-0000-0000-000000000601", planId: "00000000-0000-0000-0000-000000000602", dueDay: 5 }],
          units: [],
        });
        // 409: o cenário do MSW (#449) já matriculou o aluno nesta modalidade
        if (!r.ok && r.status !== 409) throw new Error(`matrícula do caso: ${r.status} ${await r.text()}`);
        // "ver ficha do aluno" ligada na unidade da turma (no padrão ela vem desligada)
        const unit = (await (await fetch("/api/v1/units/00000000-0000-0000-0000-000000000021")).json()) as { version: number; settings: { teacherPermissions: object } };
        const u = await fetch("/api/v1/units/00000000-0000-0000-0000-000000000021", {
          method: "PUT", headers: { "Content-Type": "application/json", "If-Match": String(unit.version) },
          body: JSON.stringify({ ...unit, settings: { ...unit.settings, teacherPermissions: { ...unit.settings.teacherPermissions, studentRecord: true } } }),
        });
        if (!u.ok) throw new Error(`permissão do caso: ${u.status} ${await u.text()}`);
        await post("/auth/login", { email, password: "segredo123" });
      }, perfil);
    }
    // recarregar perderia a sessão simulada: navega pelo histórico
    await page.evaluate(`history.pushState({}, "", ${JSON.stringify(rota)}); dispatchEvent(new PopStateEvent("popstate"))`);
    if (rota !== "/") await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeHidden();
  } else {
    await page.goto(rota);
  }
  await expect(page.locator("[data-vitrine], h1").first()).toBeVisible();
  // só serve para evitar a rolagem errada no clique: com a página ainda crescendo, a rolagem automática fica menor e o fundo do print oscila (#530)
  if (passos.length > 0) await assentar(page, perfil);
  if (perfil && rota === "/conta") await expect(page.getByRole("button", { name: /^Encerrar a sessão em/ }).first()).toBeVisible(); // lista de sessões
  for (const p of passos) {
    if ("preencher" in p) await page.getByLabel(p.preencher[0], { exact: true }).fill(p.preencher[1]);
    else if ("escolher" in p) {
      const campo = page.getByLabel(p.escolher[0], { exact: true });
      await campo.selectOption({ label: (await campo.locator("option").filter({ hasText: p.escolher[1] }).first().textContent())! });
    } else {
      const botao = page.getByRole(p.papel ?? "button", { name: new RegExp(`^${p.clicar}`) }).first();
      if (!p.seExistir || (await botao.count()) > 0) await botao.click({ force: p.papel === "radio" || p.papel === "checkbox" });
    }
  }
  await assentar(page, perfil);
  if (aguardar) await expect(page.locator(aguardar).first()).toBeVisible();
  // animação infinita (ex.: o spinner do botão em carregamento) nunca termina: o Playwright já a congela no print, então só as finitas contam
  await page.waitForFunction(`[...document.images].every((i) => i.complete && i.naturalWidth > 0) && !document.getAnimations().some((a) => a.playState === "running" && a.effect.getComputedTiming().iterations !== Infinity)`);
  await page.evaluate("document.fonts.ready");
}

for (const caso of casos) {
  for (const l of larguras) {
    for (const t of temas) {
      test(`${caso.nome} ${l.nome} ${t.nome}`, async ({ page }) => {
        await page.setViewportSize({ width: l.width, height: l.height });
        await page.emulateMedia({ colorScheme: t.colorScheme, reducedMotion: "reduce" });
        await page.clock.setFixedTime(AGORA);
        await abrir(page, caso.rota, caso.perfil, caso.passos, caso.matricula, caso.aguardar, caso.oferta);
        await expect(page).toHaveScreenshot(`${caso.nome}-${l.nome}-${t.nome}.png`, { fullPage: caso.fullPage });
      });
    }
  }
}
