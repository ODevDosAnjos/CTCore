import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { mockPermissions } from "@/mocks/permissions";
import { buildMenu } from "./buildMenu";
import { menuCatalog } from "./menuCatalog";

const t = (key: string) => key;
const allAvailable = menuCatalog.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i, available: true })) }));
const groupIds = (role: string, catalog = allAvailable) => buildMenu(mockPermissions(role), t, catalog).map((g) => g.id);
const itemIds = (role: string) => buildMenu(mockPermissions(role), t, allAvailable).flatMap((g) => g.items.map((i) => i.id));

describe("buildMenu", () => {
  it("CA11: Professor não vê Financeiro nem Configurações; Administrador não vê Unidades; Coordenador vê tudo", () => {
    expect(groupIds("TEACHER")).toEqual(["home", "operation", "communication", "reports"]);
    expect(groupIds("TEACHER")).not.toContain("finance");
    expect(itemIds("ADMINISTRATOR")).not.toContain("units");
    expect(itemIds("ADMINISTRATOR")).toContain("organizationSettings");
    expect(groupIds("COORDINATOR")).toEqual(menuCatalog.map((g) => g.id));
    expect(itemIds("COORDINATOR")).toContain("units");
  });

  it("CA11: nível NONE some, grupo vazio some e a ordem é a do catálogo; portal não tem menu", () => {
    const menu = buildMenu(mockPermissions("TEACHER"), t, allAvailable);
    expect(menu.find((g) => g.id === "operation")!.items.map((i) => i.id)).toEqual(["agenda", "graduation", "trialClasses"]);
    expect(buildMenu(mockPermissions("STUDENT"), t, allAvailable)).toEqual([]);
    expect(buildMenu(mockPermissions(undefined), t, allAvailable)).toEqual([]);
  });

  it("CA12 / CA19 / CA16 (#29), CA21 (#31) e #37, #46, #49 e #53: com o catálogo real, o Coordenador vê Unidade, Organização, Usuários e Unidades, o Administrador Unidade, Organização e Usuários e o Professor Início e Agenda", () => {
    const home = { id: "home", label: "menu.groups.home", items: [{ id: "home", label: "menu.items.home", href: "/" }] };
    const it_ = (id: string, href: string, extra: object = {}) => ({ id, label: `menu.items.${id}`, href, ...extra });
    const grp = (id: string, items: object[]) => ({ id, label: `menu.groups.${id}`, items });
    const agenda = it_("agenda", "/agenda");
    const communication = grp("communication", [it_("announcements", "/comunicados")]);
    const reports = grp("reports", [it_("reports", "/relatorios", { disabled: true })]);
    expect(bare(buildMenu(mockPermissions("TEACHER"), t))).toEqual([home, grp("operation", [agenda]), communication, reports]);
    const operation = grp("operation", [agenda, it_("classes", "/turmas"), it_("noClassDays", "/dias-sem-aula")]);
    const people = grp("people", [it_("students", "/alunos"), it_("requests", "/pedidos"), it_("teachers", "/professores")]);
    const finance = grp("finance", [it_("collections", "/cobrancas"), it_("plans", "/planos"), it_("benefits", "/beneficios")]);
    const soon = [it_("subscription", "/configuracoes/assinatura", { disabled: true }), it_("audit", "/configuracoes/auditoria", { disabled: true }), it_("import", "/configuracoes/importar", { disabled: true })];
    const common = [
      it_("unitSettings", "/configuracoes/unidade"), it_("modalities", "/configuracoes/modalidades"), it_("ageRanges", "/configuracoes/faixas-etarias"),
      it_("terms", "/configuracoes/termos"), it_("texts", "/configuracoes/textos"), it_("staffUsers", "/configuracoes/usuarios"),
    ];
    const org = it_("organizationSettings", "/configuracoes/organizacao");
    const units = it_("units", "/configuracoes/unidades");
    const rest = [home, people, operation, finance, communication, reports];
    expect(bare(buildMenu(mockPermissions("COORDINATOR"), t))).toEqual([...rest, grp("settings", [org, units, ...common, ...soon])]);
    expect(bare(buildMenu(mockPermissions("ADMINISTRATOR"), t))).toEqual([...rest, grp("settings", [org, ...common, ...soon])]);
  });

  it("T1: item \"Em breve\" só entra se o perfil tem a permissão e traz disabled; grupo traz o ícone", () => {
    const p = { ...mockPermissions("COORDINATOR"), AUDIT: "NONE" as const };
    const menu = buildMenu(p, t);
    const settings = menu.find((g) => g.id === "settings")!;
    expect(settings.items.map((i) => i.id)).not.toContain("audit");
    expect(settings.items.find((i) => i.id === "import")).toMatchObject({ disabled: true });
    expect(settings.items.find((i) => i.id === "units")!.disabled).toBeUndefined();
    expect(settings.icon).toBe("Settings");
  });

  it("A1 (#476): com o catálogo real, Cobranças aparece disponível (não Em breve) para Coordenador e Administrador, e some para o Professor", () => {
    for (const role of ["COORDINATOR", "ADMINISTRATOR"]) {
      const item = buildMenu(mockPermissions(role), t, menuCatalog).flatMap((g) => g.items).find((i) => i.id === "collections");
      expect(item).toMatchObject({ href: "/cobrancas" });
      expect(item).not.toHaveProperty("disabled");
    }
    expect(buildMenu(mockPermissions("TEACHER"), t, menuCatalog).flatMap((g) => g.items).map((i) => i.id)).not.toContain("collections");
  });

  it("#437: sem COLLECTIONS ou ANNOUNCEMENTS o item correspondente não aparece", () => {
    const p = { ...mockPermissions("COORDINATOR"), COLLECTIONS: "NONE" as const, ANNOUNCEMENTS: "NONE" as const };
    const ids = buildMenu(p, t).flatMap((g) => g.items.map((i) => i.id));
    expect(ids).not.toContain("collections");
    expect(ids).not.toContain("announcements");
  });
});

describe("mock de permissões x OpenAPI (CA14)", () => {
  const openapi = parse(readFileSync(join(process.cwd(), "../docs/openapi.yaml"), "utf8"));

  it("tem exatamente os códigos e níveis do contrato e o handler responde 401 sem sessão", async () => {
    expect(Object.keys(openapi.paths["/permissions"].get.responses)).toEqual(expect.arrayContaining(["200", "401"]));
    const codes: string[] = openapi.components.schemas.Permission.enum;
    const levels: string[] = openapi.components.schemas.Access.enum;
    for (const role of ["COORDINATOR", "ADMINISTRATOR", "TEACHER", "STUDENT", undefined]) {
      const map = mockPermissions(role);
      expect(Object.keys(map).sort()).toEqual([...codes].sort());
      for (const level of Object.values(map)) expect(levels).toContain(level);
    }
    expect((await fetch("/api/v1/permissions")).status).toBe(401);
  });
});

// O ícone é só visual: a regra por perfil compara id, nome e endereço.
const bare = (menu: ReturnType<typeof buildMenu>) => menu.map(({ icon: groupIcon, ...g }) => (void groupIcon, { ...g, items: g.items.map(({ icon, ...i }) => (void icon, i)) }));
