import type { StudentDetail } from "@/features/students/types";
import type { MockCharge, MockEnrollment, MockPortalRequest } from "../handlers";
import { ID } from "./alunos";

// Cenário do portal (#449, R10 a R13): `aluno@` (adulto), `familia@` (dois filhos em unidades diferentes), pedidos. Dados fictícios puros, datas por `dayShift` (D3).
export type PortalCtx = {
  centro: string;
  norte: string;
  modalities: { id: string; name: string }[];
  adult: string;
  minor: string;
  childTwo: string;
  minorDetail: StudentDetail;
  dayShift: (days: number) => string;
};

const PLAN_JUDO = "00000000-0000-0000-0000-000000000601";
const PLAN_JIU = "00000000-0000-0000-0000-000000000602";
const PLAN_BOXE = "00000000-0000-0000-0000-000000000603";
const PLAN_JUDO_OLD = "00000000-0000-0000-0000-000000000604";
const CLASS_JIU = "00000000-0000-0000-0000-000000000601";
const CLASS_BOXE = "00000000-0000-0000-0000-000000000603";
const p = (n: number) => `00000000-0000-0000-0000-00000000f0${n.toString(16).padStart(2, "0")}`;

export function portalCenario(ctx: PortalCtx) {
  const { centro, norte, dayShift: d } = ctx;
  const mod = (name: string) => ctx.modalities.find((m) => m.name === name)!;
  let seq = 0;
  const row = (unitId: string, modalityId: string, primaryClassId: string, planId: string, dueDay: number, startedAt: string) => ({
    id: p(++seq), unitId, modalityId, primaryClassId, otherClassIds: [] as string[], planId, nextPlanId: null, dueDay, status: "ACTIVE" as const, startedAt, endedAt: null,
  });
  const enroll = (days: number, modalities: ReturnType<typeof row>[]): MockEnrollment => ({ id: p(0x40 + ++seq), enrolledAt: `${d(days)}T12:00:00Z`, reopenedAt: null, modalities });

  // `aluno@`: três modalidades de unidades e planos diferentes; Boxe tem encerramento aberto.
  const jiu = row(centro, mod("Jiu-Jitsu").id, CLASS_JIU, PLAN_JIU, 5, d(-300));
  const judo = row(centro, mod("Judô").id, ID.classJuvenil, PLAN_JUDO, 10, d(-300));
  const boxe = row(norte, mod("Boxe").id, CLASS_BOXE, PLAN_BOXE, 15, d(-300));
  // `familia@`: o menor treina na unidade Sul e o segundo filho no Centro.
  const sulRow = row(ID.sul, mod("Jiu-Jitsu").id, ID.classSul, ID.planSul, 10, d(-200));
  const childRow = row(centro, mod("Judô").id, ID.classJuvenil, PLAN_JUDO, 10, d(-200));
  const enrollments = { [ctx.adult]: enroll(-300, [jiu, judo, boxe]), [ctx.minor]: enroll(-200, [sulRow]), [ctx.childTwo]: enroll(-200, [childRow]) };

  const childTwo: StudentDetail = { ...ctx.minorDetail, id: ctx.childTwo, name: "Filho Fictício Dois", birthDate: "2015-09-01", number: "3", guardians: ctx.minorDetail.guardians.map((g) => ({ ...g })) };

  let c = 0;
  const charge = (studentId: string, unitId: string, rowId: string, modalityName: string, dueOn: string, amountCents: number): MockCharge => ({
    id: p(0x80 + ++c), studentId, unitId, modalityRowId: rowId, referenceMonth: `${dueOn.slice(0, 7)}-01`, dueOn, toleranceDays: 0, amountCents, status: "OPEN", description: "", modalityName, type: "MONTHLY",
  });
  const charges = [
    charge(ctx.adult, centro, jiu.id, "Jiu-Jitsu", d(-5), 18000),
    charge(ctx.adult, centro, judo.id, "Judô", d(3), 15000),
    charge(ctx.adult, norte, boxe.id, "Boxe", d(12), 30000),
    charge(ctx.minor, ID.sul, sulRow.id, "Jiu-Jitsu", d(4), 18000),
  ];

  // Pedidos do `aluno@` (gestão e portal): um de cada tipo, um recusado, um aprovado e o encerramento aberto de Boxe.
  let r = 0;
  const request = (kind: string, status: string, ago: number, extra: Partial<MockPortalRequest>): MockPortalRequest => ({
    id: p(0xc0 + ++r), kind, status, studentId: ctx.adult, unitId: centro, modalityRowId: null, targetClassId: null, targetPlanId: null, targetModalityId: null, targetUnitId: null,
    reason: null, note: null, response: null, createdAt: `${d(-ago)}T13:00:00.000Z`, decidedAt: null, ...extra,
  });
  const decided = (ago: number) => ({ decidedAt: `${d(-ago)}T16:00:00.000Z` });
  const requests = [
    request("CLASS_CHANGE", "OPEN", 2, { modalityRowId: judo.id, targetClassId: ID.classJuvenil, note: "Prefiro o horário da tarde." }),
    request("NEW_MODALITY", "APPROVED", 9, { targetModalityId: mod("Muay Thai").id, targetUnitId: centro, response: "Procure a recepção para a matrícula.", ...decided(8) }),
    request("PLAN_CHANGE", "REFUSED", 14, { modalityRowId: judo.id, targetPlanId: PLAN_JUDO_OLD, response: "Esse plano foi desativado.", ...decided(13) }),
    request("CLOSURE", "OPEN", 1, { modalityRowId: boxe.id, unitId: norte, reason: "SCHEDULE" }),
  ];

  return { enrollments, childTwo, charges, requests, pixUnits: [centro, norte, ID.sul] };
}
