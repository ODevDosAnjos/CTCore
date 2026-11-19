import { expect, test, type Page } from "@playwright/test";
import { casos, larguras, temas, type Caso, type Passo } from "./casos";

// R3: relógio fixo em 29/10/2026 12:00 (America/Sao_Paulo, -03:00).
const AGORA = new Date("2026-10-29T12:00:00-03:00");

async function assentar(page: Page, perfil?: string) {
  await page.waitForLoadState("networkidle");
  if (perfil) await expect(page.getByRole("status").filter({ hasText: /Carregando/ })).toHaveCount(0); // esqueletos de carregamento
}

async function abrir(page: Page, rota: string, perfil?: string, passos: Passo[] = [], matricula = false, aguardar?: string, oferta = false, dias = false, titularInativo = false, falha?: { path: string; status: number }, planosCanvas = false, beneficios?: "lista" | "davi" | "marina", organizacaoCanvas = false, unidadeCanvas?: "conectada" | "desconectada", unidadesCanvas?: "lista" | "unica", modalidadesCanvas?: "lista" | "administrador" | "desativar" | "recusa", faixasCanvas = false, usuariosCanvas = false, termosCanvas = false, textosCanvas = false, comunicadosCanvas?: Caso["comunicadosCanvas"], inicioCanvas?: Caso["inicioCanvas"], termoCanvas?: Caso["termoCanvas"]) {
  if (perfil) {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(perfil);
    await page.getByLabel("Senha").fill("segredo123");
    await page.getByRole("button", { name: "Entrar" }).click();
    if (perfil.startsWith("duas@")) {
      await page.getByLabel("Código").fill("123456"); // envia sozinho; conta com as duas etapas ligadas
    }
    await expect(page.getByRole("heading", { name: /Bem-vindo ao ctcore|^Olá/ })).toBeVisible(); // portal: "Olá, <nome>" (#493)
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
    if (unidadeCanvas) {
      // #483: a unidade única "Tijuca" (a Sul do MSW) com os dados de ConfigUnidade, as taxas de ConfigPagamentos (R$ 180,90, 186,30, 183,59, 183,49 e 186,30), as modalidades com turmas e planos e a conta do Mercado Pago conectada ou não; o cenário compartilhado não muda
      await page.waitForFunction("window.__mswOverride");
      await page.evaluate(async (conta) => {
        type Json = { units: { id: string; name: string }[]; [k: string]: unknown };
        const get = async (url: string) => (await (await fetch(`/api/v1${url}`)).json()) as Json;
        const override = (spec: unknown) => (globalThis as unknown as { __mswOverride?: (spec: unknown) => void }).__mswOverride?.(spec);
        const reach = await get("/units/reachable");
        const sul = { ...reach.units.find((u) => u.name === "Unidade Sul"), name: "Tijuca" } as { id: string; name: string; shortName: string };
        const base = (await get(`/units/${sul.id}`)) as Json & { settings: Record<string, unknown> };
        const modalities = (await get("/modalities")) as unknown as { id: string; name: string }[];
        const jiu = modalities.find((m) => m.name === "Jiu-Jitsu") ?? modalities[0];
        const muay = modalities.find((m) => m.name === "Muay Thai") ?? modalities[1];
        override({ method: "get", path: "/units/reachable", status: 200, body: { ...reach, allUnits: false, units: [sul] } });
        override({
          method: "get",
          path: `/units/${sul.id}`,
          status: 200,
          body: {
            ...base,
            name: "Tijuca",
            shortName: "Tijuca",
            cnpj: "11222333000181",
            postalCode: "20270000",
            address: "Rua Conde de Bonfim, 600 · Tijuca · Rio de Janeiro/RJ",
            city: "Rio de Janeiro",
            whatsapp: "21970001200",
            email: "tijuca@academialeao.example",
            lastChange: { at: "2026-10-05T19:22:00Z", by: "Carla Mendes" },
            settings: {
              ...base.settings,
              dueDays: [5, 10, 15],
              enrollmentFeeEnabled: true,
              enrollmentFeeCents: 8000,
              feesCents: { cash: 0, pix: 90, bankSlip: 349, creditCard: 630, debitCard: 359, automaticDebit: 630, manualPix: 0, terminalCard: 0, transfer: 0 },
              pixKey: "11222333000181",
              paymentAccount: conta === "conectada" ? "CONNECTED" : "NOT_CONNECTED",
            },
          },
        });
        override({
          method: "get",
          path: `/units/${sul.id}/modalities`,
          status: 200,
          body: { canManage: true, items: [{ ...jiu, offered: true, classCount: 5, planCount: 4, graduationEnabled: true }, { ...muay, offered: true, classCount: 1, planCount: 1, graduationEnabled: true }] },
        });
      }, unidadeCanvas);
    }
    if (unidadesCanvas) {
      // #484: a lista do canvas (Tijuca, Barra e Méier desativada em 30/06/2026) ou só "Academia Leão · Tijuca"; a Barra tem 83 alunos e 5 turmas ativos, sem cobrança em conferência
      await page.waitForFunction("window.__mswOverride");
      await page.evaluate(async (cenario) => {
        const override = (spec: unknown) => (globalThis as unknown as { __mswOverride?: (spec: unknown) => void }).__mswOverride?.(spec);
        const base = { shortNameAdjusted: false, city: "Rio de Janeiro/RJ", active: true, deactivatedAt: null as string | null };
        const tijuca = { ...base, id: "00000000-0000-0000-0000-0000000004a1", name: "Tijuca", shortName: "academia-leao-tijuca", activeStudents: 131, administrators: [{ name: "Carla Mendes" }] };
        const barra = { ...base, id: "00000000-0000-0000-0000-0000000004a2", name: "Barra", shortName: "academia-leao-barra", activeStudents: 83, administrators: [{ name: "Carla Mendes" }, { name: "Diego Alves" }] };
        const meier = { ...base, id: "00000000-0000-0000-0000-0000000004a3", name: "Méier", shortName: "academia-leao-meier", activeStudents: 0, administrators: [], active: false, deactivatedAt: "2026-06-30T15:00:00Z" };
        const unica = { ...tijuca, name: "Academia Leão · Tijuca", city: "Rio de Janeiro" };
        override({ method: "get", path: "/units", status: 200, body: cenario === "unica" ? [unica] : [tijuca, barra, meier] });
        override({ method: "get", path: `/units/${barra.id}/deactivation-check`, status: 200, body: { activeStudents: 83, activeClasses: 5, pendingProofs: 0, lastActiveUnit: false, canDeactivate: false } });
      }, unidadesCanvas);
    }
    if (modalidadesCanvas) {
      // #485: Jiu-Jitsu (19 níveis) e Muay Thai (8) ativas em Tijuca e Barra, as outras do catálogo disponíveis; "desativar" recusa o Muay Thai (3 turmas e 63 alunos); "recusa" recusa desmarcar o Muay Thai na Tijuca (a turma da noite, 26 alunos)
      await page.waitForFunction("window.__mswOverride");
      await page.evaluate(async (cenario) => {
        type Item = { id: string; name: string };
        const override = (spec: unknown) => (globalThis as unknown as { __mswOverride?: (spec: unknown) => void }).__mswOverride?.(spec);
        const catalogo = (await (await fetch("/api/v1/modalities")).json()) as Item[];
        const jiu = catalogo.find((m) => m.name === "Jiu-Jitsu") ?? catalogo[0];
        const muay = catalogo.find((m) => m.name === "Muay Thai") ?? catalogo[1];
        const ativa = (m: Item, niveis: number, canManage: boolean) => ({ ...m, active: true, canManage, graduationEnabled: true, levelCount: niveis, offeredUnits: ["Tijuca", "Barra"] });
        const todas = (canManage: boolean) => catalogo.map((m) => (m.id === jiu.id ? ativa(m, 19, canManage) : m.id === muay.id ? ativa(m, 8, canManage) : { ...m, active: false, canManage, graduationEnabled: false, levelCount: 0, offeredUnits: [] }));
        const admin = cenario === "administrador";
        if (cenario !== "recusa") override({ method: "get", path: "/modalities", status: 200, body: admin ? todas(false).filter((m) => m.active) : todas(true) });
        const nivel = (id: string, name: string, color: string, minAge: number | null, maxAge: number | null, maxDegree = 4, kids = false) => ({ id, name, color, secondaryColor: null, maxDegree, minAge, maxAge, kids });
        override({
          method: "get",
          path: `/modalities/${jiu.id}/graduation`,
          status: 200,
          body: {
            enabled: true,
            requireOriginProof: false,
            canManage: true,
            levels: [
              nivel("n1", "Branca", "#FFFFFF", 4, null), nivel("n2", "Cinza (e variações)", "#9E9E9E", 4, 15, 4, true), nivel("n3", "Amarela (e variações)", "#E8C23A", 7, 15, 4, true),
              nivel("n4", "Laranja (e variações)", "#E07B20", 10, 15, 4, true), nivel("n5", "Verde (e variações)", "#2F8F4E", 13, 15, 4, true), nivel("n6", "Azul", "#2350A8", 16, null),
              nivel("n7", "Roxa", "#6B3FA0", 16, null), nivel("n8", "Marrom", "#6B3F1F", 18, null), nivel("n9", "Preta", "#1B1B1F", 19, null, 6),
            ],
          },
        });
        if (cenario === "desativar") {
          override({
            method: "put",
            path: `/modalities/${muay.id}/activation`,
            status: 409,
            body: {
              code: "MODALITY_IN_USE", message: "Em uso.", changed: false, traceId: "t",
              fields: [
                { field: "activeClasses", message: "3" }, { field: "activeStudents", message: "63" },
                { field: "class", message: "Muay Thai Adulto · Noite (Tijuca)" }, { field: "class", message: "Muay Thai Iniciante (Barra)" }, { field: "class", message: "Muay Thai Avançado (Barra)" },
              ],
            },
          });
        }
        if (cenario === "recusa") {
          const reach = (await (await fetch("/api/v1/units/reachable")).json()) as { units: { id: string }[] };
          override({
            method: "put",
            path: `/units/${reach.units[0].id}/modalities/${muay.id}`,
            status: 409,
            body: { code: "UNIT_MODALITY_IN_USE", message: "Há turmas ativas.", changed: false, traceId: "t", fields: [{ field: "class", message: "Muay Thai Adulto · Noite" }, { field: "classStudents", message: "26" }] },
          });
        }
      }, modalidadesCanvas);
    }
    if (faixasCanvas) {
      // #486: as três faixas do canvas, com "Usada em" (duas turmas, uma, sete) e a última alteração de Marcos Leão
      await page.waitForFunction("window.__mswOverride");
      await page.evaluate(() => {
        const faixa = (id: string, name: string, minAge: number, maxAge: number | null, count: number, names: string[]) => ({ id, name, minAge, maxAge, usedIn: { count, names } });
        (globalThis as unknown as { __mswOverride?: (spec: unknown) => void }).__mswOverride?.({
          method: "get",
          path: "/age-ranges",
          status: 200,
          body: {
            canManage: true,
            items: [faixa("r1", "Infantil", 4, 12, 2, ["Turmas Kids", "Muay Thai Kids"]), faixa("r2", "Juvenil", 13, 17, 1, ["Jiu-Jitsu Juvenil"]), faixa("r3", "Adulto", 18, null, 7, ["A", "B"])],
            lastChange: { at: "2026-10-02T17:12:00Z", by: "Marcos Leão" },
          },
        });
      });
    }
    if (usuariosCanvas) {
      // #487: Tijuca e Barra e a equipe do canvas que a regra permite à Coordenação (só Administradores): Carla Mendes (Tijuca e Barra), Diego Alves (Barra) e o convite pendente de Paula Ribeiro (Barra)
      await page.waitForFunction("window.__mswOverride");
      await page.evaluate(() => {
        const override = (spec: unknown) => (globalThis as unknown as { __mswOverride?: (spec: unknown) => void }).__mswOverride?.(spec);
        const tijuca = { id: "00000000-0000-0000-0000-0000000004a1", name: "Tijuca" };
        const barra = { id: "00000000-0000-0000-0000-0000000004a2", name: "Barra" };
        const pessoa = (n: number, name: string, email: string, units: object[], lastAccessAt: string | null, status: string) => ({ linkId: `00000000-0000-0000-0000-0000000004b${n}`, name, email, role: "ADMINISTRATOR", units, lastAccessAt, status, canManage: true });
        override({ method: "get", path: "/units/reachable", status: 200, body: { allUnits: true, units: [tijuca, barra].map((u) => ({ ...u, shortName: u.name.toLowerCase() })) } });
        override({
          method: "get",
          path: "/users",
          status: 200,
          body: [
            pessoa(1, "Carla Mendes", "carla@academialeao.example", [tijuca, barra], "2026-10-29T10:42:00Z", "ACTIVE"),
            pessoa(2, "Diego Alves", "diego@academialeao.example", [barra], "2026-10-28T15:00:00Z", "ACTIVE"),
            pessoa(3, "Paula Ribeiro", "paula.ribeiro@email.example", [barra], null, "PENDING"),
          ],
        });
      });
    }
    if (termosCanvas) {
      // #488: o termo de matrícula do canvas, na versão 3, com as versões 3, 2 e 1 e seus aceites
      await page.waitForFunction("window.__mswOverride");
      await page.evaluate(() => {
        const versao = (version: number, publishedAt: string, acceptances: number, body: string) => ({ version, body, reaccept: false, publishedAt, publishedBy: "Marcos Leão", acceptances });
        const corpo = "Termo de matrícula · Academia Leão\n\n1. A mensalidade vence no dia escolhido na matrícula e é cobrada por modalidade.\n2. Não há juros, multa ou pagamento parcial. A taxa do meio de pagamento online é somada ao valor.\n3. Com 30 dias de atraso, a modalidade é bloqueada até o pagamento.\n4. O aluno declara estar apto à prática esportiva. A academia não guarda dados de saúde.\n5. O encerramento pode ser pedido pelo portal a qualquer momento.";
        const versions = [versao(3, "2026-09-01T15:00:00Z", 187, corpo), versao(2, "2025-01-10T15:00:00Z", 142, corpo + " "), versao(1, "2022-03-05T15:00:00Z", 96, corpo + "  ")];
        (globalThis as unknown as { __mswOverride?: (spec: unknown) => void }).__mswOverride?.({ method: "get", path: "/organization/terms/ENROLLMENT", status: 200, body: { canManage: true, current: versions[0], versions } });
      });
    }
    if (textosCanvas) {
      // #488: os nove modelos do canvas; Boas-vindas, "antes do vencimento" e "depois do vencimento" têm texto próprio (a última alteração, de Carla Mendes, é a do canvas); o perfil é o Administrador, que só consulta
      await page.waitForFunction("window.__mswOverride");
      await page.evaluate(() => {
        const lembrete = ["nome", "valor", "vencimento", "unidade", "descricao", "link_pagamento"];
        const modelo = (key: string, group: string, fields: string[], subject: string, body: string, custom: { subject: string; body: string } | null = null) => ({
          key, group, fields, platform: { subject, body }, custom, updatedAt: custom ? "2026-09-15T12:30:00Z" : null, updatedBy: custom ? "Carla Mendes" : null,
        });
        const antes = "Oi, {nome}! Passando para lembrar que a mensalidade de {descricao} da {unidade}, de {valor}, vence em {vencimento}.\nVocê pode pagar por Pix, cartão ou boleto aqui: {link_pagamento}\nBons treinos!";
        const models = [
          modelo("WELCOME", "WELCOME", ["nome", "unidade"], "Bem-vindo(a) à {unidade}", "Olá, {nome}! Seja bem-vindo(a).", { subject: "Bem-vindo(a) à {unidade}", body: "Oi, {nome}! Que bom ter você na {unidade}." }),
          modelo("REMINDER_BEFORE", "REMINDERS", lembrete, "Lembrete: sua cobrança vence em breve", "Lembrete de cobrança: {descricao}, {valor}, {vencimento}.", { subject: "Sua mensalidade vence em breve: {descricao}", body: antes }),
          modelo("REMINDER_DUE", "REMINDERS", lembrete, "Lembrete: sua cobrança vence hoje", "Sua cobrança vence hoje: {descricao}, {valor}."),
          modelo("REMINDER_OVERDUE", "REMINDERS", lembrete, "Lembrete: cobrança em atraso", "Há uma cobrança em atraso: {descricao}, {valor}.", { subject: "Sua mensalidade está em atraso: {descricao}", body: "Oi, {nome}! A mensalidade de {descricao}, de {valor}, venceu em {vencimento}." }),
          modelo("ANNOUNCEMENT_CANCELED_CLASS", "ANNOUNCEMENTS", ["unidade", "turma", "data", "horario"], "Aula cancelada", "A aula de {turma} do dia {data} foi cancelada."),
          modelo("ANNOUNCEMENT_TEACHER_CHANGE", "ANNOUNCEMENTS", ["unidade", "turma", "data"], "Troca de professor", "A aula de {turma} terá outro professor."),
          modelo("ANNOUNCEMENT_SCHEDULE_CHANGE", "ANNOUNCEMENTS", ["unidade", "turma", "data", "horario"], "Alteração de horário", "A aula de {turma} muda de horário."),
          modelo("ANNOUNCEMENT_NO_CLASS_DAY", "ANNOUNCEMENTS", ["unidade", "periodo", "motivo"], "Dia sem aula", "Não haverá aula em {periodo}: {motivo}."),
          modelo("ANNOUNCEMENT_GENERAL", "ANNOUNCEMENTS", ["unidade"], "Aviso geral", "Aviso de {unidade}."),
        ];
        (globalThis as unknown as { __mswOverride?: (spec: unknown) => void }).__mswOverride?.({ method: "get", path: "/organization/texts", status: 200, body: { canManage: false, models } });
      });
    }
    if (comunicadosCanvas) {
      // #491: a unidade única "Tijuca" (a Barra só nos destinos) e os comunicados do canvas. lista: os cinco de Comunicados, 0 enviados hoje; curta: o agendado e o enviado de Cancelar/Celular, 3 de 20; limite: os mesmos com 20 de 20;
      // novo e novo-celular: o formulário com a turma do canvas e a prévia (26 e 33 pessoas); organizacao: a janela sobre a lista curta, com 286 pessoas nas duas unidades e 1 de 20 do limite próprio
      await page.waitForFunction("window.__mswOverride");
      await page.evaluate((cenario) => {
        const override = (spec: unknown) => (globalThis as unknown as { __mswOverride?: (spec: unknown) => void }).__mswOverride?.(spec);
        const tijuca = { id: "00000000-0000-0000-0000-0000000004a1", name: "Tijuca", shortName: "tijuca" };
        const barra = { id: "00000000-0000-0000-0000-0000000004a2", name: "Barra", shortName: "barra" };
        override({ method: "get", path: "/units/reachable", status: 200, body: { allUnits: false, units: [tijuca] } });
        const item = (n: number, date: string, kind: string, name: string, title: string, type: string, author: string, status: string, recipients: number | null, reads: number, pinnedUntil: string | null, estimatedRecipients: number | null) => ({
          id: `00000000-0000-0000-0000-0000000005a${n}`, date, target: { kind, id: `00000000-0000-0000-0000-0000000006a${n}`, name }, title, type, author, status, recipients, reads, pinnedUntil, estimatedRecipients,
        });
        const seminario = item(1, "2026-10-13T11:00:00Z", "CLASS", "Jiu-Jitsu Adulto · Noite", "Seminário de raspagens", "GENERAL", "Rafael Duarte", "SCHEDULED", null, 0, null, 31);
        const quinta = item(2, "2026-10-08T13:02:00Z", "CLASS", "Muay Thai Adulto · Noite", "Aula de quinta cancelada", "CANCELED_CLASS", "Bianca Torres", "SENT", 26, 18, null, null);
        const lista = [
          item(3, "2026-10-08T13:00:00Z", "CLASS", "Muay Thai Adulto · Noite", "Aula de quinta cancelada", "CANCELED_CLASS", "Carla Mendes", "SENT", 26, 19, null, null),
          item(4, "2026-12-01T12:00:00Z", "UNIT", "Tijuca e Barra", "Recesso de fim de ano", "NO_CLASS_DAY", "Marcos Leão", "SCHEDULED", null, 0, null, 214),
          item(5, "2026-10-06T21:12:00Z", "MODALITY", "Jiu-Jitsu", "Seminário de raspagens no sábado", "GENERAL", "Rafael Duarte", "SENT", 98, 71, "2026-10-17", null),
          item(6, "2026-10-01T12:30:00Z", "CLASS", "Jiu-Jitsu Adulto · Manhã", "Troca de professor na sexta", "TEACHER_CHANGE", "Carla Mendes", "SENT", 18, 15, null, null),
          item(7, "2026-09-20T17:05:00Z", "CLASS", "Jiu-Jitsu Adulto · Noite", "Novo horário a partir de outubro", "SCHEDULE_CHANGE", "Carla Mendes", "SENT", 31, 28, null, null),
        ];
        const items = cenario === "lista" ? lista : [seminario, quinta];
        override({ method: "get", path: "/announcements", status: 200, body: { items, page: 1, size: 25, total: items.length } });
        const used = cenario === "lista" ? 0 : cenario === "limite" ? 20 : 3;
        override({ method: "get", path: "/announcements/daily-limit", status: 200, body: { unit: { id: tijuca.id, name: "Tijuca", used, limit: 20 }, organization: { used: 1, limit: 20 } } });
        const muay = { id: "00000000-0000-0000-0000-000000000c91", name: "Muay Thai Adulto · Noite (Tijuca)", unitId: tijuca.id, modalityId: "00000000-0000-0000-0000-000000000c92", groupLink: "https://chat.example.com/muay" };
        const jiu = { id: "00000000-0000-0000-0000-000000000c93", name: "Jiu-Jitsu Adulto · Noite", unitId: tijuca.id, modalityId: "00000000-0000-0000-0000-000000000c94", groupLink: null };
        override({ method: "get", path: "/announcements/targets", status: 200, body: { organization: true, units: [tijuca, barra], modalities: [{ id: muay.modalityId, name: "Muay Thai", unitId: tijuca.id }], classes: [muay, jiu] } });
        // modelos do canvas: o Aviso geral da janela da organização já vem com o texto do recesso
        const modelo = (title: string, body: string) => ({ title, body });
        const templates = {
          CANCELED_CLASS: modelo("Aula de quinta cancelada", "Oi, pessoal! A aula de {data}, às {horario}, está cancelada. Voltamos no horário de sempre. Bons treinos!"),
          TEACHER_CHANGE: modelo("Troca de professor", "A aula de {turma} terá outro professor a partir de {data}."),
          SCHEDULE_CHANGE: modelo("Alteração de horário", "A aula de {turma} muda de horário a partir de {data}. O novo horário é {horario}."),
          NO_CLASS_DAY: modelo("Dia sem aula", "Não haverá aula em {periodo}: {motivo}."),
          GENERAL: cenario === "organizacao" ? modelo("Recesso de fim de ano", "Oi, pessoal! A Academia Leão entra em recesso de 24/12 a 03/01. As mensalidades não mudam. Boas festas!") : modelo("Seminário de raspagens", "Sábado, 17/10, às 10h, seminário de raspagens com o professor Rafael. Aberto a todas as faixas."),
        };
        override({ method: "get", path: "/announcements/templates", status: 200, body: { templates } });
        const preview = cenario === "organizacao" ? [286, 280, 6, 271] : cenario === "novo-celular" ? [33, 31, 2, 31] : [26, 24, 2, 25];
        override({ method: "post", path: "/announcements/preview", status: 200, body: { recipients: preview[0], adults: preview[1], guardians: preview[2], portal: preview[0], email: preview[3], whatsapp: null, channels: ["PORTAL", "EMAIL"] } });
      }, comunicadosCanvas);
    }
    if (termoCanvas) {
      // #494: o termo do canvas (versão 3); filhos: o passo aceita o primeiro (Davi), para a tela mostrar "1 de 2"
      await page.waitForFunction("window.__mswTermo");
      await page.evaluate((cenario) => {
        const corpo = ["1. A mensalidade vence no dia escolhido na matrícula e é cobrada por modalidade.", "2. Não há juros, multa ou pagamento parcial. A taxa do meio de pagamento online é somada ao valor e aparece antes de você escolher.", "3. Com 30 dias de atraso, a modalidade é bloqueada até o pagamento.", "4. O encerramento pode ser pedido aqui pelo portal, a qualquer momento.", "5. A academia não guarda dados de saúde, só o que o aluno informa na matrícula."].join(String.fromCharCode(10));
        const alunos = cenario === "um" ? [{ id: "00000000-0000-0000-0000-000000000731", name: "Theo" }] : [{ id: "00000000-0000-0000-0000-000000000732", name: "Davi Nogueira" }, { id: "00000000-0000-0000-0000-000000000733", name: "Lia Nogueira" }];
        (globalThis as unknown as { __mswTermo?: (...args: unknown[]) => void }).__mswTermo?.(alunos, { version: 3, body: corpo }, { version: 1, body: "Fotos e vídeos de aulas e eventos nas redes da academia." });
      }, termoCanvas);
    }
    if (inicioCanvas) {
      // #493: em-dia: sem cobrança e com o próximo vencimento do canvas (PortalEmDia); confirmar: uma modalidade nova pendente (PortalConfirmarModalidade)
      await page.waitForFunction("window.__mswOverride");
      await page.evaluate(async (cenario) => {
        const override = (spec: unknown) => (globalThis as unknown as { __mswOverride?: (spec: unknown) => void }).__mswOverride?.(spec);
        if (cenario === "em-dia") {
          const home = (await (await fetch("/api/v1/portal/home")).json()) as { charges: object; [k: string]: unknown };
          override({ method: "get", path: "/portal/home", status: 200, body: { ...home, charges: { items: [], nextDueOn: "2026-11-10" } } });
        } else {
          override({ method: "get", path: "/portal/modality-confirmations", status: 200, body: [{ modalityRowId: "00000000-0000-0000-0000-0000000007f1", studentId: "00000000-0000-0000-0000-000000000722", studentName: "Bruno Lima", modality: "Muay Thai", unit: "Tijuca", planId: "00000000-0000-0000-0000-0000000007f2", plan: "Muay Thai Mensal", planValueCents: 18000 }] });
        }
      }, inicioCanvas);
      // o Início já carregou antes do override: sai e volta pelo histórico (recarregar perderia a sessão simulada)
      const ir = (r: string) => page.evaluate(`history.pushState({}, "", ${JSON.stringify(r)}); dispatchEvent(new PopStateEvent("popstate"))`);
      await ir("/portal/avisos");
      await expect(page.getByRole("heading", { name: "Avisos", level: 1 })).toBeVisible();
      await ir("/");
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
  // Minha conta (#490): a lista de sessões (portal e aba Sessões) ou o conteúdo da aba pedida
  if (perfil && rota.startsWith("/conta")) await expect(page.getByRole("button", { name: /^Encerrar a sessão em/ }).or(page.getByText(/alterada (em|há)|nunca alterada|^Ativa$|^Desligada$|Sino da gestão/)).first()).toBeVisible();
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
        await abrir(page, caso.rota, caso.perfil, caso.passos, caso.matricula, caso.aguardar, caso.oferta, caso.dias, caso.titularInativo, caso.falha, caso.planosCanvas, caso.beneficios, caso.organizacaoCanvas, caso.unidadeCanvas, caso.unidadesCanvas, caso.modalidadesCanvas, caso.faixasCanvas, caso.usuariosCanvas, caso.termosCanvas, caso.textosCanvas, caso.comunicadosCanvas, caso.inicioCanvas, caso.termoCanvas);
        await expect(page).toHaveScreenshot(`${caso.nome}-${l.nome}-${t.nome}.png`, { fullPage: caso.fullPage });
      });
    }
  }
}
