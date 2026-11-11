import type { MockAdhoc, MockAnnouncement, MockTeacher } from "../handlers";

// Cenário de agenda e listas cheias (#449, R15 e R16): dados fictícios puros, datas por `dayShift` (D3).
export type ListasCtx = {
  centro: string;
  norte: string;
  sul: string;
  modalities: { id: string; name: string }[];
  teachers: { ana: string; joao: string };
  accountId: string;
  classJudoInfantil: string;
  dayShift: (days: number) => string;
};

const p = (n: number) => `00000000-0000-0000-0000-00000000e${n.toString(16).padStart(3, "0")}`;

export function listasCenario(ctx: ListasCtx) {
  const { dayShift: d } = ctx;
  const mod = (name: string) => ctx.modalities.find((m) => m.name === name)!;
  const unitName = (id: string) => (id === ctx.centro ? "Unidade Centro" : id === ctx.norte ? "Unidade Norte" : "Unidade Sul");

  // Agenda: a aula de Judô Infantil (terça ou quinta) da próxima semana é cancelada e há uma aula avulsa; a substituição (quarta do Jiu-Jitsu) e o dia sem aula (hoje) já vêm do mock.
  const tuesdayOrThursday = [1, 2, 3, 4, 5, 6, 7].map(d).find((day) => [2, 4].includes(new Date(`${day}T12:00:00Z`).getUTCDay()))!;
  const lessonEdits: [string, { cancelCode: string; cancelText: string | null }][] = [[`${ctx.classJudoInfantil}-${tuesdayOrThursday}-18:00`, { cancelCode: "TEACHER_UNAVAILABLE", cancelText: null }]];
  const adhoc: MockAdhoc[] = [{ id: p(1), unitId: ctx.centro, title: "Seminário de guarda", modalityId: mod("Jiu-Jitsu").id, date: d(2), startsAt: "10:00", endsAt: "11:30", teacherId: ctx.teachers.ana, visibilityClassId: null }];

  const unit = (id: string) => ({ id, name: unitName(id) });
  const teacher = (n: number, name: string, modality: string, units: string[], status: string, access: string, consent: boolean): MockTeacher => ({
    id: p(0x10 + n), name, photoUrl: null, modalities: [{ id: mod(modality).id, name: modality, levelId: null, level: null, degree: null, levelColor: null, levelSecondaryColor: null }], units: units.map(unit), classCount: 0, status, directoryConsent: consent, access,
  });
  const teachers = [
    teacher(1, "Paulo Teixeira", "Judô", [ctx.centro], "ACTIVE", "PENDING", false),
    teacher(2, "Renata Alves", "Boxe", [ctx.sul], "ACTIVE", "ACTIVE", true),
    teacher(3, "Sérgio Nunes", "Jiu-Jitsu", [ctx.centro], "INACTIVE", "ENDED", false),
  ];
  const contacts = Object.fromEntries(
    teachers.map((t, i) => [t.id, { bio: null, email: i === 0 ? "paulo.teixeira@alfa.test" : i === 1 ? "renata.alves@alfa.test" : null, phone: null, consentDeclaredByManagement: false }]),
  );

  // Administradores da gestão (o Coordenador vê estes): Carla já é o convite enviado.
  const staff = [
    { linkId: p(0x20), name: "Fernanda Rocha", email: "fernanda@alfa.test", role: "ADMINISTRATOR", unitIds: [ctx.sul], lastAccessAt: d(-1) as string | null, status: "ACTIVE", self: false, resends: 0 },
    { linkId: p(0x21), name: "Gustavo Prado", email: "gustavo@alfa.test", role: "ADMINISTRATOR", unitIds: [ctx.centro, ctx.sul], lastAccessAt: d(-6) as string | null, status: "ACTIVE", self: false, resends: 0 },
    { linkId: p(0x22), name: "Helena Duarte", email: "helena@alfa.test", role: "ADMINISTRATOR", unitIds: [ctx.sul], lastAccessAt: null as string | null, status: "PENDING", self: false, resends: 1 },
    { linkId: p(0x23), name: "Igor Matos", email: "igor@alfa.test", role: "ADMINISTRATOR", unitIds: [ctx.centro], lastAccessAt: d(-20) as string | null, status: "ACTIVE", self: false, resends: 0 },
  ];

  const notice = (n: number, ago: number, kind: MockAnnouncement["kind"], type: string, title: string, recipients: number, reads: number, classId: string | null): MockAnnouncement => ({
    id: p(0x30 + n), date: `${d(-ago)}T13:00:00Z`, kind, classId, unitId: ctx.centro, type, title, author: "Ana", authorId: ctx.accountId, scheduled: false, recipients, reads,
  });
  const announcements = [notice(1, 3, "MODALITY", "SCHEDULE_CHANGE", "Treino especial de sábado", 28, 21, null)];

  return { lessonEdits, adhoc, teachers, contacts, staff, announcements };
}
