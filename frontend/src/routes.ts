import { generatePath, matchRoutes } from "react-router";
import type { Permission, PermissionMap } from "./features/permissions/types";

// RNF-43: mapa único de rotas. Dele saem as rotas do App, o menu, o item ativo, a trilha, as abas do celular e os destinos das notificações.
// O servidor continua sendo a barreira (403 em toda rota); o acesso daqui só evita mostrar tela que ele recusaria.

export const MANAGEMENT_ROLES = ["COORDINATOR", "ADMINISTRATOR", "TEACHER"];

export interface MenuGroupDef {
  id: string;
  /** Ícone do grupo no menu lateral. */
  icon?: string;
}
/** Nomes em pt-BR.json: menu.groups.<id>. A ordem daqui é a ordem do menu. */
export const menuGroups: MenuGroupDef[] = [
  { id: "home" },
  { id: "people", icon: "Users" },
  { id: "operation", icon: "CalendarDays" },
  { id: "finance", icon: "Wallet" },
  { id: "communication", icon: "Megaphone" },
  { id: "reports", icon: "ChartColumn" },
  { id: "settings", icon: "Settings" },
];

export interface MenuItemDef {
  group: string;
  icon: string;
  /** "soon": aparece desabilitado "Em breve" (sem rota); "off": ainda não aparece no menu. Sem valor: a tela existe. */
  state?: "soon" | "off";
}

export interface AppRoute {
  id: string;
  path: string;
  /** "management": só Coordenador, Administrador e Professor; "portal": só os demais perfis; "both": qualquer perfil logado. */
  area: "management" | "portal" | "both";
  /** Nível diferente de NONE na permissão do servidor libera a rota e mostra o item no menu (D1). */
  permission?: Permission;
  /** Restringe a perfis quando não há permissão equivalente (D1). */
  roles?: string[];
  /** Quando é o item do menu, a rota se marca; senão, `menu` diz qual item fica marcado. */
  item?: MenuItemDef;
  menu?: string;
  /** Chave i18n do último trecho da trilha. */
  trail?: string;
  /** Rota-mãe: a tela dela tem um `<Outlet />` para esta (ex.: painéis da Agenda). */
  parent?: string;
  /** Endereço que mudou: leva ao novo (R6). */
  redirect?: string;
}

const m = (id: string, path: string, permission: Permission, group: string, icon: string, state?: MenuItemDef["state"]): AppRoute => ({
  id,
  path,
  area: "management",
  permission,
  item: { group, icon, state },
});
const sub = (id: string, path: string, menu: string, permission: Permission, extra: Partial<AppRoute> = {}): AppRoute => ({ id, path, area: "management", permission, menu, ...extra });

export const routes: AppRoute[] = [
  { id: "home", path: "/", area: "both", permission: "HOME", item: { group: "home", icon: "House" } },
  { id: "account", path: "/conta", area: "both" },
  { id: "confirmEmail", path: "/confirmar-email/:code", area: "both" },
  { id: "noAccess", path: "/sem-acesso", area: "both" },

  m("students", "/alunos", "STUDENT_MANAGE", "people", "Users"),
  sub("studentRecord", "/alunos/:id", "students", "STUDENT_MANAGE", { parent: "students" }),
  sub("enrollment", "/alunos/nova-matricula", "students", "STUDENT_MANAGE", { trail: "enrollmentWizard.trail" }),
  m("requests", "/pedidos", "STUDENT_MANAGE", "people", "Inbox"),
  m("teachers", "/professores", "TEACHERS", "people", "UserCheck"),
  sub("teacherPanel", "/professores/:id", "teachers", "TEACHERS", { parent: "teachers" }),

  m("agenda", "/agenda", "AGENDA_VIEW", "operation", "CalendarDays"),
  sub("lesson", "/agenda/aulas/:id", "agenda", "AGENDA_VIEW", { parent: "agenda" }),
  sub("teacherRecord", "/agenda/aulas/:id/alunos/:studentId", "agenda", "AGENDA_VIEW", { parent: "agenda", roles: ["TEACHER"] }),
  m("classes", "/turmas", "CLASSES_MANAGE", "operation", "LayoutGrid"),
  sub("classPanel", "/turmas/:id", "classes", "CLASSES_MANAGE", { parent: "classes" }),
  m("noClassDays", "/dias-sem-aula", "NO_CLASS_DAYS", "operation", "CalendarOff"),
  m("graduation", "/graduacao", "GRADUATION", "operation", "Award", "off"),
  m("trialClasses", "/aulas-experimentais", "TRIAL_CLASSES", "operation", "Ticket", "off"),

  m("collections", "/cobrancas", "COLLECTIONS", "finance", "Wallet"),
  sub("chargePanel", "/cobrancas/:id", "collections", "COLLECTIONS", { parent: "collections" }),
  sub("chargePreview", "/cobrancas/previa", "collections", "COLLECTIONS"),
  sub("dailyReceipts", "/cobrancas/recebimentos", "collections", "COLLECTIONS"),
  sub("overdue", "/cobrancas/atrasados", "collections", "COLLECTIONS"),
  sub("paymentProofs", "/cobrancas/conferencia", "collections", "COLLECTIONS"),
  m("plans", "/planos", "PLANS", "finance", "Layers"),
  sub("planPanel", "/planos/:id", "plans", "PLANS", { parent: "plans" }),
  sub("plansList", "/planos/lista", "plans", "PLANS", { redirect: "/planos" }),
  m("benefits", "/beneficios", "BENEFITS", "finance", "Gift"),

  m("announcements", "/comunicados", "ANNOUNCEMENTS", "communication", "Megaphone"),
  sub("newAnnouncement", "/comunicados/novo", "announcements", "ANNOUNCEMENTS"),

  m("reports", "/relatorios", "REPORTS", "reports", "ChartColumn", "soon"),
  m("allUnits", "/todas-as-unidades", "ALL_UNITS_CONSOLIDATED", "reports", "Building2", "off"),

  // `/configuracoes` não é item do menu: nenhum item fica marcado nela.
  { id: "settings", path: "/configuracoes", area: "management", permission: "UNIT_SETTINGS" },
  m("organizationSettings", "/configuracoes/organizacao", "ORGANIZATION_SETTINGS", "settings", "Building"),
  m("units", "/configuracoes/unidades", "UNITS", "settings", "MapPin"),
  sub("newUnit", "/configuracoes/unidades/nova", "units", "UNITS"),
  m("unitSettings", "/configuracoes/unidade", "UNIT_SETTINGS", "settings", "Settings"),
  m("modalities", "/configuracoes/modalidades", "ORGANIZATION_SETTINGS", "settings", "Dumbbell"),
  m("ageRanges", "/configuracoes/faixas-etarias", "ORGANIZATION_SETTINGS", "settings", "Baby"),
  m("terms", "/configuracoes/termos", "ORGANIZATION_SETTINGS", "settings", "FileText"),
  m("texts", "/configuracoes/textos", "ORGANIZATION_SETTINGS", "settings", "Type"),
  m("staffUsers", "/configuracoes/usuarios", "STAFF_USERS", "settings", "UserCog"),
  sub("permissionsTable", "/configuracoes/usuarios/permissoes", "staffUsers", "STAFF_USERS", { trail: "permissionsTable.title" }),
  m("subscription", "/configuracoes/assinatura", "SUBSCRIPTION", "settings", "CreditCard", "soon"),
  m("audit", "/configuracoes/auditoria", "AUDIT", "settings", "ScrollText", "soon"),
  m("import", "/configuracoes/importar", "IMPORT", "settings", "Upload", "soon"),
  m("exportFull", "/configuracoes/exportacao", "EXPORT_FULL", "settings", "Download", "off"),
  m("support", "/configuracoes/suporte", "SUPPORT_ACCESS", "settings", "LifeBuoy", "off"),

  { id: "portalRequests", path: "/portal/pedidos", area: "portal" },
  { id: "portalCard", path: "/portal/carteirinha", area: "portal" },
  { id: "portalAgenda", path: "/portal/agenda", area: "portal" },
  { id: "portalAnnouncements", path: "/portal/avisos", area: "portal" },
  { id: "portalFinance", path: "/portal/financeiro", area: "portal" },
  { id: "portalInfo", path: "/portal/minhas-informacoes", area: "portal" },
];

export const routeById = (id: string): AppRoute => {
  const r = routes.find((x) => x.id === id);
  if (!r) throw new Error(`rota desconhecida: ${id}`);
  return r;
};

/** Endereço de uma rota do mapa (com os parâmetros, se tiver). */
export const hrefOf = (id: string, params?: Record<string, string>): string => generatePath(routeById(id).path, params);

// Rotas com elemento: as que existem no roteador (as "Em breve" e as ainda fora do menu não têm tela).
export const hasScreen = (r: AppRoute) => !r.item?.state;

/** Rota do mapa para um endereço (a mais específica); undefined se não houver (página não encontrada). */
export function findRoute(pathname: string): AppRoute | undefined {
  const live = routes.filter(hasScreen);
  const hit = matchRoutes(live.map((r) => ({ id: r.id, path: r.path })), pathname)?.at(-1);
  return live.find((r) => r.id === hit?.route.id);
}

/** Id do item do menu que fica marcado na rota ("" se nenhum). */
export const activeItemOf = (r: AppRoute | undefined): string => (r?.item ? r.id : (r?.menu ?? ""));

export const isManagement = (role: string | undefined) => !!role && MANAGEMENT_ROLES.includes(role);

/** O mesmo critério do menu (D1): perfil da área e permissão do servidor diferente de NONE. */
export function canAccess(r: AppRoute, role: string | undefined, permissions: PermissionMap | undefined): boolean {
  if (!role) return false;
  if (r.area === "management" && !isManagement(role)) return false;
  if (r.area === "portal" && isManagement(role)) return false;
  if (r.roles && !r.roles.includes(role)) return false;
  if (r.permission && isManagement(role)) return !!permissions && permissions[r.permission] !== "NONE";
  return true;
}
