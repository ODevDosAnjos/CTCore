import type { Permission } from "./types";

export interface CatalogItem {
  id: string;
  permission: Permission;
  href: string;
  /** D7: só vira true no item que entrega a tela; o menu nunca aponta para endereço inexistente. */
  available: boolean;
  /** Item de sprint futura que o canvas mostra: aparece desabilitado "Em breve" (sem rota), só para quem teria a permissão. */
  soon?: boolean;
  /** Ícone (lucide-react) do menu lateral; o mapa nome -> componente fica em `components/layout/icons.ts`. */
  icon: string;
}
export interface CatalogGroup {
  id: string;
  /** Ícone do grupo no menu lateral. */
  icon?: string;
  items: CatalogItem[];
}

const item = (id: string, permission: Permission, href: string, icon: string, available = false): CatalogItem => ({ id, permission, href, icon, available });
const soon = (id: string, permission: Permission, href: string, icon: string): CatalogItem => ({ ...item(id, permission, href, icon), soon: true });

// Nomes em pt-BR.json: menu.groups.<id> e menu.items.<id>.
export const menuCatalog: CatalogGroup[] = [
  { id: "home", items: [item("home", "HOME", "/", "House", true)] },
  {
    id: "people",
    icon: "Users",
    items: [
      item("students", "STUDENT_MANAGE", "/alunos", "Users", true),
      item("requests", "STUDENT_MANAGE", "/pedidos", "Inbox", true),
      item("teachers", "TEACHERS", "/professores", "UserCheck", true),
    ],
  },
  {
    id: "operation",
    icon: "CalendarDays",
    items: [
      item("agenda", "AGENDA_VIEW", "/agenda", "CalendarDays", true),
      item("classes", "CLASSES_MANAGE", "/turmas", "LayoutGrid", true),
      item("noClassDays", "NO_CLASS_DAYS", "/dias-sem-aula", "CalendarOff", true),
      item("graduation", "GRADUATION", "/graduacao", "Award"),
      item("trialClasses", "TRIAL_CLASSES", "/aulas-experimentais", "Ticket"),
    ],
  },
  {
    id: "finance",
    icon: "Wallet",
    items: [
      item("collections", "COLLECTIONS", "/cobrancas", "Wallet", true),
      item("plans", "PLANS", "/planos", "Layers", true),
      item("benefits", "BENEFITS", "/beneficios", "Gift", true),
    ],
  },
  { id: "communication", icon: "Megaphone", items: [item("announcements", "ANNOUNCEMENTS", "/comunicados", "Megaphone", true)] },
  {
    id: "reports",
    icon: "ChartColumn",
    items: [soon("reports", "REPORTS", "/relatorios", "ChartColumn"), item("allUnits", "ALL_UNITS_CONSOLIDATED", "/todas-as-unidades", "Building2")],
  },
  {
    id: "settings",
    icon: "Settings",
    items: [
      item("organizationSettings", "ORGANIZATION_SETTINGS", "/configuracoes/organizacao", "Building", true),
      item("units", "UNITS", "/configuracoes/unidades", "MapPin", true),
      item("unitSettings", "UNIT_SETTINGS", "/configuracoes/unidade", "Settings", true),
      item("modalities", "ORGANIZATION_SETTINGS", "/configuracoes/modalidades", "Dumbbell", true),
      item("ageRanges", "ORGANIZATION_SETTINGS", "/configuracoes/faixas-etarias", "Baby", true),
      item("terms", "ORGANIZATION_SETTINGS", "/configuracoes/termos", "FileText", true),
      item("texts", "ORGANIZATION_SETTINGS", "/configuracoes/textos", "Type", true),
      item("staffUsers", "STAFF_USERS", "/configuracoes/usuarios", "UserCog", true),
      soon("subscription", "SUBSCRIPTION", "/configuracoes/assinatura", "CreditCard"),
      soon("audit", "AUDIT", "/configuracoes/auditoria", "ScrollText"),
      soon("import", "IMPORT", "/configuracoes/importar", "Upload"),
      item("exportFull", "EXPORT_FULL", "/configuracoes/exportacao", "Download"),
      item("support", "SUPPORT_ACCESS", "/configuracoes/suporte", "LifeBuoy"),
    ],
  },
];
