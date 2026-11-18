// Matriz fixa da tela "Tabela de permissões" (RF-ACE, #27). Cada linha do canvas aponta para as permissões do servidor que ela cobre
// (`keys`, nomes do enum `Permission`) e traz o nível/escopo de cada perfil no mesmo formato do CSV de testes do back-end
// (backend/src/test/resources/permission-table.csv); permissionMatrix.test.ts reprova se um lado mudar sem o outro.
// Os textos de cada célula ficam em pt-BR.json (`permissionsTable.rows.<id>`).
export type Grants = [coordinator: string, administrator: string, teacher: string];
export type MatrixRow = { id: string; keys: string[]; grants: Grants };

const ALL: Grants = ["FULL/ALL", "FULL/UNITS", "NONE"];
const row = (id: string, keys: string[], grants: Grants = ALL): MatrixRow => ({ id, keys, grants });

export const MATRIX: MatrixRow[] = [
  row("home", ["HOME"], ["FULL/ALL", "FULL/UNITS", "FULL/CLASSES"]),
  row("consolidated", ["ALL_UNITS_CONSOLIDATED"], ["READ/ALL", "NONE", "NONE"]),
  row("studentsSimple", ["STUDENT_VIEW"], ["FULL/ALL", "FULL/UNITS", "FULL/CLASSES"]),
  row("studentsFull", []), // a lista completa não tem linha própria no servidor: o Professor só recebe a lista simples
  row("studentRecord", ["STUDENT_RECORD"], ["FULL/ALL", "FULL/UNITS", "FULL/CLASSES#4"]),
  row("studentContacts", ["STUDENT_CONTACTS"], ["FULL/ALL", "FULL/UNITS", "READ/CLASSES#2"]),
  row("studentManage", ["STUDENT_MANAGE"]),
  row("plansBenefits", ["BENEFITS", "PLANS"]),
  row("collections", ["COLLECTIONS", "CHARGE_ADJUSTMENTS"]),
  row("classes", ["CLASSES_MANAGE"]),
  row("agendaView", ["AGENDA_VIEW"], ["FULL/ALL", "FULL/UNITS", "FULL/CLASSES"]),
  row("agendaEdit", ["AGENDA_EDIT"], ["FULL/ALL", "FULL/UNITS", "FULL/CLASSES#1"]),
  row("noClassDays", ["NO_CLASS_DAYS"]),
  row("graduation", ["GRADUATION"], ["FULL/ALL", "FULL/UNITS", "READ/CLASSES"]),
  row("announcements", ["ANNOUNCEMENTS"], ["FULL/ALL", "FULL/UNITS", "FULL/CLASSES#0"]),
  row("trial", ["TRIAL_CLASSES"], ["FULL/ALL", "FULL/UNITS", "READ/CLASSES#3"]),
  row("teachers", ["TEACHERS"]),
  row("staffUsers", ["STAFF_USERS"]),
  row("unitSettings", ["UNIT_SETTINGS"]),
  row("orgSettings", ["ORGANIZATION_SETTINGS"], ["FULL/ALL", "READ/ALL", "NONE"]),
  row("units", ["UNITS"], ["FULL/ALL", "NONE", "NONE"]),
  row("subscription", ["SUBSCRIPTION"], ["FULL/ALL", "NOTICE/ALL", "NONE"]),
  row("audit", ["AUDIT"]),
  row("reports", ["REPORTS"], ["FULL/ALL", "FULL/UNITS", "OWN/CLASSES"]),
  row("exportLists", ["EXPORT_LISTS"]),
  row("exportFull", ["EXPORT_FULL"], ["FULL/ALL", "NONE", "NONE"]),
  row("import", ["IMPORT"]),
  row("support", ["SUPPORT_ACCESS"], ["FULL/ALL", "NONE", "NONE"]),
];

export const PROFILES = ["COORDINATOR", "ADMINISTRATOR", "TEACHER"] as const;
