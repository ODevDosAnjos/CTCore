import type { StudentDetail } from "@/features/students/types";
import type { MockClass, MockEnrollment, MockPlan } from "../handlers";

// Cenário de pessoas e turmas (#449, R2 a R4 e R14): dados fictícios puros; os ids existentes entram por `ctx`.
export type Ctx = {
  centro: string;
  norte: string;
  modalities: { id: string; name: string }[];
  teachers: { ana: string; joao: string; marcos: string };
  dayShift: (days: number) => string;
};

// Ids do cenário, para as outras partes (cobranças, portal) ligarem seus dados aos mesmos alunos.
export const ID = {
  sul: "00000000-0000-0000-0000-000000000023",
  bruno: "00000000-0000-0000-0000-000000000721",
  carla: "00000000-0000-0000-0000-000000000722",
  diego: "00000000-0000-0000-0000-000000000723",
  elisa: "00000000-0000-0000-0000-000000000724",
  fabio: "00000000-0000-0000-0000-000000000725",
  gabriela: "00000000-0000-0000-0000-000000000726",
  heitor: "00000000-0000-0000-0000-000000000727",
  isadora: "00000000-0000-0000-0000-000000000728",
  joao: "00000000-0000-0000-0000-000000000729",
  lucas: "00000000-0000-0000-0000-00000000072a",
  planSul: "00000000-0000-0000-0000-000000000605",
  classSul: "00000000-0000-0000-0000-000000000604",
  classMuay: "00000000-0000-0000-0000-000000000605",
  classJuvenil: "00000000-0000-0000-0000-000000000606",
};
const PLAN_JUDO = "00000000-0000-0000-0000-000000000601";
const PLAN_JIU = "00000000-0000-0000-0000-000000000602";
const CLASS_JIU = "00000000-0000-0000-0000-000000000601";
const CLASS_JUDO = "00000000-0000-0000-0000-000000000602";
const G = (n: number) => `00000000-0000-0000-0000-0000000008${n.toString(16).padStart(2, "0")}`;

const base = { complement: null, district: "Centro", city: "Rio de Janeiro", state: "RJ", postalCode: "01001000", gender: null, referral: null, emergencyName: null, emergencyRelationship: null, emergencyPhone: null, photoUrl: null };

export function alunosCenario(ctx: Ctx) {
  const { centro, dayShift: d } = ctx;
  const mod = (name: string) => ctx.modalities.find((m) => m.name === name)!.id;
  let seq = 0;
  const row = (unitId: string, modalityId: string, primaryClassId: string, planId: string, dueDay: number, startedAt: string, ended: string | null = null) => ({
    id: `00000000-0000-0000-0000-0000000009${(++seq).toString(16).padStart(2, "0")}`, unitId, modalityId, primaryClassId, otherClassIds: [] as string[], planId, nextPlanId: null, dueDay,
    status: (ended ? "ENDED" : "ACTIVE") as "ACTIVE" | "ENDED", startedAt, endedAt: ended,
  });
  const adult = (id: string, name: string, cpf: string, email: string | null, birthDate: string, n: number, emailProblem = false): StudentDetail => ({
    ...base, id, registeredUnitId: centro, name, birthDate, minor: false, street: "Rua Fictícia", number: String(n), cpf, email, phone: `2190000${String(n).padStart(4, "0")}`, emailProblem, guardians: [],
  });
  const minor = (id: string, name: string, birthDate: string, n: number, guardians: StudentDetail["guardians"]): StudentDetail => ({
    ...base, id, registeredUnitId: centro, name, birthDate, minor: true, street: "Rua Fictícia", number: String(n), cpf: null, email: null, phone: null, emailProblem: false, guardians,
  });
  const resp = (n: number, name: string, financial: boolean, access: "ACTIVE" | "PENDING") => ({ guardianId: G(n), name, email: `responsavel${n}@alfa.test`, phone: `2190001${String(n).padStart(4, "0")}`, financial, access, emailProblem: false });

  const students = [
    adult(ID.bruno, "Bruno Alves Fictício", "11144477735", "bruno.alves@alfa.test", "1988-06-21", 21),
    adult(ID.carla, "Carla Mendes Fictícia", "39053344705", "carla.mendes@alfa.test", "1992-11-03", 22),
    adult(ID.diego, "Diego Farias Fictício", "16899535009", "diego.farias@alfa.test", "1985-02-14", 23),
    adult(ID.elisa, "Elisa Prado Fictícia", "71428793860", "elisa.prado@alfa.test", "1995-09-30", 24),
    adult(ID.fabio, "Fábio Neves Fictício", "45317828791", "fabio.neves@alfa.test", "2000-01-18", 25),
    adult(ID.gabriela, "Gabriela Luz Fictícia", "86288366757", "gabriela.luz@alfa.test", "1998-04-09", 26, true),
    minor(ID.heitor, "Heitor Cruz Fictício", "2016-04-12", 27, [resp(0x11, "Marta Cruz Fictícia", true, "PENDING"), resp(0x12, "Paulo Cruz Fictício", false, "ACTIVE")]),
    minor(ID.isadora, "Isadora Reis Fictícia", "2011-02-20", 28, [resp(0x13, "Renata Reis Fictícia", true, "ACTIVE")]),
    adult(ID.joao, "João Pedro Teixeira Fictício", "12345678909", "joao.teixeira@alfa.test", "1991-08-25", 29),
    adult(ID.lucas, "Lucas Barros Fictício", "01234567890", "lucas.barros@alfa.test", "1987-12-05", 30),
  ];
  // Cada responsável tem CPF (sem ele o cadastro do menor fica incompleto).
  const guardianCpfs: Record<string, string> = { [G(0x11)]: "11122233396", [G(0x12)]: "22233344405", [G(0x13)]: "33344455508" };

  const judo = mod("Judô"), jiu = mod("Jiu-Jitsu");
  const at = (id: string, enrolledAt: string, modalities: ReturnType<typeof row>[]): [string, MockEnrollment] => [id, { id: `00000000-0000-0000-0000-000000000a${(++seq).toString(16).padStart(2, "0")}`, enrolledAt, reopenedAt: null, modalities }];
  const enrollments = Object.fromEntries([
    at(ID.bruno, `${d(-400)}T12:00:00Z`, [row(centro, jiu, CLASS_JIU, PLAN_JIU, 10, d(-400))]),
    at(ID.carla, `${d(-300)}T12:00:00Z`, [row(centro, judo, CLASS_JUDO, PLAN_JUDO, 5, d(-300))]),
    at(ID.diego, `${d(-250)}T12:00:00Z`, [row(centro, jiu, CLASS_JIU, PLAN_JIU, 1, d(-250))]),
    at(ID.elisa, `${d(-500)}T12:00:00Z`, [row(centro, judo, CLASS_JUDO, PLAN_JUDO, 15, d(-500), d(-60))]),
    at(ID.fabio, `${d(-5)}T12:00:00Z`, [row(centro, jiu, CLASS_JIU, PLAN_JIU, 10, d(-5))]),
    at(ID.gabriela, `${d(-200)}T12:00:00Z`, [row(centro, judo, CLASS_JUDO, PLAN_JUDO, 5, d(-200))]),
    at(ID.heitor, `${d(-150)}T12:00:00Z`, [row(centro, judo, CLASS_JUDO, PLAN_JUDO, 5, d(-150))]),
    at(ID.isadora, `${d(-120)}T12:00:00Z`, [row(centro, judo, CLASS_JUDO, PLAN_JUDO, 15, d(-120))]),
    at(ID.joao, `${d(-90)}T12:00:00Z`, [row(centro, jiu, CLASS_JIU, PLAN_JIU, 10, d(-90))]),
    at(ID.lucas, `${d(-180)}T12:00:00Z`, [row(centro, jiu, CLASS_JIU, PLAN_JIU, 1, d(-180)), row(centro, judo, CLASS_JUDO, PLAN_JUDO, 1, d(-180))]),
  ]);
  // Quem já aceitou o termo; Fábio (matrícula nova) fica pendente.
  const aceitos = students.filter((s) => s.id !== ID.fabio).map((s) => s.id);

  const sul = { id: ID.sul, name: "Unidade Sul", shortName: "alfa-sul", shortNameAdjusted: false, city: "Niterói" as string | null, activeStudents: 0, administrators: [] as { name: string }[], active: true };
  const planSul: MockPlan = { id: ID.planSul, unitId: ID.sul, unitName: "Unidade Sul", modalityIndex: 3, name: "Jiu-Jitsu Sul Mensal", valueCents: 18000, weeklyFrequency: 3, validOtherUnits: false, status: "ACTIVE" };
  const klass = (id: string, name: string, unitId: string, modalityId: string, ageRange: string | null, schedule: MockClass["schedule"], head: string, capacity: number | null, extra: Partial<MockClass> = {}): MockClass => ({
    id, name, unitId, modalityId, ageRange, schedule, head, assistants: [], capacity, status: "ACTIVE", ...extra,
  });
  const roster = [ID.bruno, ID.diego, ID.fabio, ID.joao, ID.lucas].map((id) => ({ id, name: students.find((s) => s.id === id)!.name, primary: true }));
  const classes = {
    // Jiu-Jitsu Adulto (601) passa a ter 31 de 30 e cinco alunos no painel.
    jiuAdulto: { activeStudents: 31, roster },
    novas: [
      klass(ID.classSul, "Jiu-Jitsu Sul", ID.sul, jiu, "Adulto", [[2, "19:00", "20:00"], [4, "19:00", "20:00"]], ctx.teachers.ana, 25),
      klass(ID.classMuay, "Muay Thai Noite", centro, mod("Muay Thai"), null, [[2, "20:00", "21:00"]], ctx.teachers.joao, null),
      klass(ID.classJuvenil, "Judô Juvenil", centro, judo, "Juvenil", [[3, "17:00", "18:00"], [5, "17:00", "18:00"]], ctx.teachers.joao, 15),
    ],
  };
  return { students, guardianCpfs, enrollments, aceitos, sul, planSul, classes };
}
