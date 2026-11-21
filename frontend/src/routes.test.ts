import { mockPermissions } from "@/mocks/permissions";
import { buildTabs } from "@/features/permissions/buildTabs";
import { menuCatalog } from "@/features/permissions/menuCatalog";
import { notificationTarget } from "@/features/notifications/notificationActions";
import type { NotificationType } from "@/features/notifications/useNotifications";
import { activeItemOf, canAccess, findRoute, hrefOf, routes, routeById } from "./routes";

const t = (k: string) => k;
const ids = routes.map((r) => r.id);

describe("mapa de rotas (CA4)", () => {
  it("ids e endereços não se repetem", () => {
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(routes.map((r) => r.path)).size).toBe(routes.length);
  });

  it("todo item do menu, toda aba do celular e todo destino de notificação existe no mapa", () => {
    for (const i of menuCatalog.flatMap((g) => g.items)) expect(ids).toContain(i.id);
    for (const role of ["COORDINATOR", "TEACHER"]) for (const tab of buildTabs(mockPermissions(role), role, t)) expect(ids).toContain(tab.id);
    const types: NotificationType[] = ["PAYMENT_RECEIVED", "HIGH_BENEFIT", "STUDENT_MAJORITY", "EMAIL_PROBLEM", "INVITE_PENDING", "CLOSURE_REQUEST", "PORTAL_REQUEST", "PAYMENT_PROOF", "MP_DISCONNECTED", "SUBSCRIPTION_OVERDUE"];
    for (const type of types) {
      for (const refType of [null, "student"]) {
        const to = notificationTarget({ type, refType, refId: refType ? "7" : null });
        expect(findRoute(to.split("?")[0]), to).toBeDefined();
      }
    }
    expect(notificationTarget({ type: "EMAIL_PROBLEM", refType: "student", refId: "7" })).toBe("/alunos/7");
  });

  it("o item ativo e a trilha vêm do mapa", () => {
    expect(activeItemOf(findRoute("/"))).toBe("home");
    expect(activeItemOf(findRoute("/alunos/nova-matricula"))).toBe("students");
    expect(findRoute("/alunos/nova-matricula")?.trail).toBe("enrollmentWizard.trail");
    expect(activeItemOf(findRoute("/alunos/12"))).toBe("students");
    expect(activeItemOf(findRoute("/cobrancas/previa"))).toBe("collections");
    expect(activeItemOf(findRoute("/configuracoes"))).toBe("");
    expect(activeItemOf(findRoute("/agenda/aulas/3/alunos/4"))).toBe("agenda");
    expect(findRoute("/configuracoes/usuarios/permissoes")?.trail).toBe("permissionsTable.title");
    expect(findRoute("/nao-existe")).toBeUndefined();
    expect(hrefOf("students")).toBe("/alunos");
  });

  it("CA6: endereço que mudou tem redirecionamento no mapa", () => {
    expect(routeById("plansList").redirect).toBe("/planos");
  });

  it("item 'Em breve' e item fora do menu não têm tela", () => {
    expect(findRoute("/relatorios")).toBeUndefined();
    expect(findRoute("/graduacao")).toBeUndefined();
  });
});

// Perfis que entram hoje, pela lista fixa do App.tsx antes da #675 (D1): o acesso por permissão libera os mesmos.
const ALL = ["COORDINATOR", "ADMINISTRATOR", "TEACHER"];
const GESTAO = ["COORDINATOR", "ADMINISTRATOR"];
const legacy: Record<string, string[]> = {
  agenda: ALL, lesson: ALL, teacherRecord: ["TEACHER"], announcements: ALL, newAnnouncement: ALL,
  units: ["COORDINATOR"], newUnit: ["COORDINATOR"],
};

describe("equivalência do acesso por permissão com a lista de perfis de hoje (CA5, D1)", () => {
  const management = routes.filter((r) => r.area === "management" && !r.redirect && !r.item?.state);
  it.each(management.map((r) => [r.id, r] as const))("%s libera os mesmos perfis", (id, route) => {
    const expected = legacy[id] ?? GESTAO;
    const allowed = ALL.filter((role) => canAccess(route, role, mockPermissions(role)));
    expect(allowed).toEqual(expected);
  });

  it("perfil do portal não entra em rota da gestão, nem o da gestão em rota do portal; sem perfil, nada", () => {
    expect(canAccess(routeById("students"), "STUDENT", mockPermissions("STUDENT"))).toBe(false);
    expect(canAccess(routeById("portalFinance"), "COORDINATOR", mockPermissions("COORDINATOR"))).toBe(false);
    expect(canAccess(routeById("portalFinance"), "STUDENT", undefined)).toBe(true);
    expect(canAccess(routeById("home"), undefined, undefined)).toBe(false);
  });

  it("CA5: sem a chave do servidor a rota nega (Professor sem comunicados, Administrador sem Organização)", () => {
    expect(canAccess(routeById("announcements"), "TEACHER", { ...mockPermissions("TEACHER"), ANNOUNCEMENTS: "NONE" })).toBe(false);
    expect(canAccess(routeById("organizationSettings"), "ADMINISTRATOR", { ...mockPermissions("ADMINISTRATOR"), ORGANIZATION_SETTINGS: "NONE" })).toBe(false);
  });
});
