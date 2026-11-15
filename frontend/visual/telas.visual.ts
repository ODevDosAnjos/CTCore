import { expect, test, type Page } from "@playwright/test";
import { casos, larguras, temas, type Passo } from "./casos";

// R3: relógio fixo em 29/10/2026 12:00 (America/Sao_Paulo, -03:00).
const AGORA = new Date("2026-10-29T12:00:00-03:00");

async function assentar(page: Page, perfil?: string) {
  await page.waitForLoadState("networkidle");
  if (perfil) await expect(page.getByRole("status").filter({ hasText: /Carregando/ })).toHaveCount(0); // esqueletos de carregamento
}

async function abrir(page: Page, rota: string, perfil?: string, passos: Passo[] = [], matricula = false, aguardar?: string, oferta = false, dias = false, titularInativo = false, falha?: { path: string; status: number }, planosCanvas = false, beneficios?: "lista" | "davi" | "marina", organizacaoCanvas = false) {
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
    if (titularInativo) {
      // #475: a turma 607 é a Jiu-Jitsu Adulto (601) com outro nome e o titular Sérgio Lopes, que está inativo; o cenário compartilhado não ganha turma
      await page.waitForFunction("window.__mswOverride");
      await page.evaluate(async () => {
        const base = (await (await fetch("/api/v1/classes/00000000-0000-0000-0000-000000000601")).json()) as Record<string, unknown>;
        const head = ((await (await fetch("/api/v1/teachers?size=100&status=INACTIVE")).json()) as { items: { id: string }[] }).items[0];
        (globalThis as unknown as { __mswOverride?: (spec: unknown) => void }).__mswOverride?.({ method: "get", path: "/classes/00000000-0000-0000-0000-000000000607", status: 200, body: { ...base, id: "00000000-0000-0000-0000-000000000607", name: "Jiu-Jitsu Manhã", head: { id: head.id, name: "Sérgio Lopes" }, assistants: [] } });
      });
    }
    if (planosCanvas) {
      // #480: a unidade única "Tijuca" (a Sul do MSW) com os planos do canvas e o resumo do canvas; o cenário compartilhado tem outros planos e benefícios
      await page.waitForFunction("window.__mswOverride");
      await page.evaluate(async () => {
        type Json = { units: { id: string; name: string }[]; items: { name: string; status: string }[]; plans: object; [k: string]: unknown };
        const get = async (url: string) => (await (await fetch(`/api/v1${url}`)).json()) as Json;
        const override = (spec: unknown) => (globalThis as unknown as { __mswOverride?: (spec: unknown) => void }).__mswOverride?.(spec);
        const reach = await get("/units/reachable");
        const sul = { ...reach.units.find((u: { name: string }) => u.name === "Unidade Sul"), name: "Tijuca" };
        const lista = await get(`/plans?size=100&unitId=${sul.id}`);
        const items = lista.items.filter((p: { name: string }) => p.name !== "Jiu-Jitsu Sul Mensal").sort((a: { status: string }, b: { status: string }) => Number(a.status === "INACTIVE") - Number(b.status === "INACTIVE")); // o canvas põe o desativado por último
        const resumo = await get(`/plans/summary?unitId=${sul.id}`);
        override({ method: "get", path: "/units/reachable", status: 200, body: { ...reach, allUnits: false, units: [sul] } });
        override({ method: "get", path: "/plans", status: 200, body: { ...lista, items, total: items.length } });
        override({ method: "get", path: "/plans/summary", status: 200, body: { ...resumo, plans: { ...resumo.plans, active: 4, inactive: 1 }, benefits: { active: 14, high: 2 } } });
      });
    }
    if (beneficios) {
      // #481: a unidade única "Tijuca" e os cinco benefícios do canvas (contagens 14, 2 e 9); `davi` e `marina` acrescentam o aluno, a matrícula, o resumo e o professor das janelas; o cenário compartilhado não muda
      await page.waitForFunction("window.__mswOverride");
      await page.evaluate(async (cenario) => {
        type Json = { units: { id: string; name: string }[]; [k: string]: unknown };
        const override = (spec: unknown) => (globalThis as unknown as { __mswOverride?: (spec: unknown) => void }).__mswOverride?.(spec);
        const reach = (await (await fetch("/api/v1/units/reachable")).json()) as Json;
        const sul = { ...reach.units.find((u) => u.name === "Unidade Sul"), name: "Tijuca" } as { id: string; name: string };
        const modalities = (await (await fetch("/api/v1/modalities")).json()) as { id: string; name: string }[];
        const jiu = modalities.find((m) => m.name === "Jiu-Jitsu") ?? modalities[0];
        const muay = modalities.find((m) => m.name === "Muay Thai") ?? modalities[1];
        const row = (id: string, name: string, modality: { id: string; name: string }, type: string, value: number, reason: string, decidedBy: string, validUntil: string | null, status: string, high: boolean, monthly: number) => ({
          id, student: { id: `s-${id}`, name }, unit: sul, modality: { id: modality.id, name: modality.name }, type, value, reason, decidedBy, grantedBy: "Carla Mendes", validUntil, status, high, monthlyValueCents: monthly, planValueCents: 15000, nextChargeMonth: "2026-11",
        });
        const davi = row("b1", "Davi Nogueira", jiu, "PERCENT", 50, "Atleta da equipe kids", "Marcos Leão", "2026-12-31", "ACTIVE", false, 7500);
        const marina = row("b4", "Marina Teixeira", jiu, "AMOUNT", 3000, "Indicação de amigo", "Carla Mendes", "2026-12-31", "ACTIVE", false, 15000);
        const items = [
          davi,
          row("b2", "Pedro Henrique Dias", jiu, "PERCENT", 100, "Professor auxiliar", "Marcos Leão", null, "ACTIVE", true, 0),
          row("b3", "Theo Andrade", jiu, "PERCENT", 10, "Desconto de família (irmão)", "Carla Mendes", null, "ACTIVE", false, 13500),
          { ...marina, reason: "Indicou 2 alunos", validUntil: "2026-11-30" },
          row("b5", "Olívia Ramos", muay, "PERCENT", 60, "Campanha de retorno", "Carla Mendes", "2026-09-30", "EXPIRED", true, 6000),
        ];
        override({ method: "get", path: "/units/reachable", status: 200, body: { ...reach, allUnits: false, units: [sul] } });
        override({ method: "get", path: "/benefits", status: 200, body: { items, page: 1, size: 25, total: items.length, counts: { active: 14, high: 2, closed: 9 } } });
        if (cenario === "lista") return;
        const aluno = cenario === "davi" ? davi : marina;
        const student = { id: aluno.student.id, name: aluno.student.name, photoUrl: null };
        override({ method: "get", path: "/students", status: 200, body: { items: [student], page: 1, size: 25, total: 1 } });
        override({ method: "get", path: `/students/${student.id}/enrollment`, status: 200, body: { id: "e1", status: "ACTIVE", enrolledAt: "2026-01-10T12:00:00Z", reopenedAt: null, modalities: [{ id: "r1", unit: sul, modality: jiu, primaryClass: { id: "k1", name: "Kids" }, otherClasses: [], plan: { id: "p1", name: "Kids 2x" }, nextPlan: null, dueDay: 5, status: "ACTIVE", startedAt: "2026-01-10T12:00:00Z", endedAt: null, canEdit: true, closureRequestedAt: null }] } });
        const next = cenario === "davi" ? 4500 : 9000;
        override({ method: "post", path: "/benefits/preview", status: 200, body: { plan: { id: "p1", name: "Kids 2x", valueCents: 15000 }, current: aluno, newMonthlyValueCents: next, effectiveFrom: "2026-11", replaces: true, high: true } });
        override({ method: "get", path: "/teachers", status: 200, body: { items: [{ id: "t1", name: "Marcos Leão" }], page: 1, size: 100, total: 1 } });
      }, beneficios);
    }
    if (organizacaoCanvas) {
      // #482: a organização do canvas (ConfigAcademia) e a Administradora que a janela de transferência lista; o cenário compartilhado não muda
      await page.waitForFunction("window.__mswOverride");
      await page.evaluate(async () => {
        const override = (spec: unknown) => (globalThis as unknown as { __mswOverride?: (spec: unknown) => void }).__mswOverride?.(spec);
        const base = (await (await fetch("/api/v1/organization")).json()) as Record<string, unknown>;
        override({
          method: "get",
          path: "/organization",
          status: 200,
          body: {
            ...base,
            name: "Academia Leão",
            color: "#c8462c",
            holderDocument: "11222333000181",
            version: 3,
            lastChange: { at: "2026-10-02T17:12:00Z", by: "Marcos Leão" },
            coordinator: { name: "Marcos Leão", email: "marcos@academialeao.example", twoFactorEnabled: true },
          },
        });
        override({
          method: "get",
          path: "/users",
          status: 200,
          body: [{ linkId: "00000000-0000-0000-0000-0000000000c1", name: "Carla Mendes", email: "carla@academialeao.example", role: "ADMINISTRATOR", units: [{ id: "u1", name: "Tijuca" }, { id: "u2", name: "Barra" }], lastAccessAt: null, status: "ACTIVE", canManage: true }],
        });
      });
    }
    if (falha) {
      // #476: a rota responde com erro (o MSW vive na página); o e-mail do perfil segue logado
      await page.waitForFunction("window.__mswOverride");
      await page.evaluate((f) => (globalThis as unknown as { __mswOverride?: (spec: unknown) => void }).__mswOverride?.({ method: "get", path: f.path, status: f.status, body: { code: "INTERNAL", message: "Erro", fields: [], traceId: "t" } }), falha);
    }
    if (dias) {
      // #474: a Coordenação lança os dias do canvas (recesso em duas unidades, graduação, Finados) e ignora os feriados que sobram, para a tela ter as 4 sugestões e os lançados do canvas
      await page.evaluate(async () => {
        const call = (method: string, url: string, body?: unknown) => fetch(`/api/v1${url}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
        await call("POST", "/auth/login", { email: "ana@exemplo.com", password: "segredo123" });
        const lista = (await (await call("GET", "/no-class-days")).json()) as { units: { id: string }[]; unit: { id: string } };
        const unitIds = lista.units.map((u) => u.id);
        const lancar = async (body: object) => { const r = await call("POST", "/no-class-days", body); if (!r.ok) throw new Error(`dia sem aula do caso: ${r.status} ${await r.text()}`); };
        await lancar({ unitIds, startsOn: "2026-12-24", endsOn: "2027-01-03", reason: "Recesso de fim de ano", classIds: [], notice: { mode: "SCHEDULED", sendAt: "2026-12-01T12:00:00Z" } });
        await lancar({ unitIds: [lista.unit.id], startsOn: "2026-10-31", endsOn: "2026-10-31", reason: "Graduação na Barra (evento)", classIds: [], notice: { mode: "NONE" } });
        await lancar({ unitIds: [lista.unit.id], startsOn: "2026-11-02", endsOn: "2026-11-02", reason: "Finados", classIds: [], holiday: true, notice: { mode: "NONE" } });
        for (const date of ["2027-01-01", "2027-03-26", "2027-04-21", "2027-05-01", "2027-09-07", "2027-10-12"]) await call("POST", "/no-class-days/ignored-holidays", { unitId: lista.unit.id, date });
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
        await abrir(page, caso.rota, caso.perfil, caso.passos, caso.matricula, caso.aguardar, caso.oferta, caso.dias, caso.titularInativo, caso.falha, caso.planosCanvas, caso.beneficios, caso.organizacaoCanvas);
        await expect(page).toHaveScreenshot(`${caso.nome}-${l.nome}-${t.nome}.png`, { fullPage: caso.fullPage });
      });
    }
  }
}
