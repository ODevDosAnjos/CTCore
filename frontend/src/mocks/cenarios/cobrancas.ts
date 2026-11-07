import type { MockBenefit, MockCharge, MockPaymentProof, MockReceipt, MockReminder } from "../handlers";
import type { alunosCenario } from "./alunos";
import { ID } from "./alunos";

// Cenário de cobranças (#449, R5 a R9): dados fictícios puros, sempre relativos a `dayShift` (D3).
type Who = { id: string; name: string };
export type CobrancasCtx = {
  centro: string;
  dayShift: (days: number) => string;
  isoDay: (d: Date) => string;
  by: { ana: Who; other: Who };
};

export function cobrancasCenario(ctx: CobrancasCtx, alunos: ReturnType<typeof alunosCenario>) {
  const { centro, dayShift: d } = ctx;
  const cid = (n: number) => `00000000-0000-0000-0000-000000000c${n.toString(16).padStart(2, "0")}`;
  const nameOf = (id: string) => alunos.students.find((s) => s.id === id)!.name;
  const rowOf = (studentId: string, i = 0) => alunos.enrollments[studentId].modalities[i].id;
  const month = (shift: number) => {
    const t = new Date(`${d(0)}T12:00:00Z`);
    return ctx.isoDay(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + shift, 1)));
  };
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

  let seq = 0;
  const charges: MockCharge[] = [];
  const add = (c: Partial<MockCharge> & Pick<MockCharge, "studentId" | "type" | "dueOn" | "amountCents">) => {
    const full: MockCharge = { id: cid(++seq), unitId: centro, modalityRowId: null, referenceMonth: null, toleranceDays: 0, status: "OPEN", description: "", ...c };
    charges.push(full);
    return full;
  };
  const monthly = (studentId: string, rowIndex: number, ref: number, dueOn: string, amountCents: number, extra: Partial<MockCharge> = {}) =>
    add({ studentId, type: "MONTHLY", modalityRowId: rowOf(studentId, rowIndex), referenceMonth: month(ref), dueOn, amountCents, ...extra });

  // Em aberto: a vencer, vence hoje.
  monthly(ID.bruno, 0, 0, d(5), 18000);
  monthly(ID.fabio, 0, 0, d(0), 18000);
  // Em atraso (5): 25 e 59 dias, com bloqueio em 2 dias e bloqueada; a avulsa não tem bloqueio.
  monthly(ID.carla, 0, -1, d(-25), 15000, { daysToBlock: 2 });
  add({ studentId: ID.diego, type: "INSTALLMENT", dueOn: d(-59), amountCents: 6000, description: "Parcela 2/3 · Renegociação", daysToBlock: 0 });
  add({ studentId: ID.gabriela, type: "ONE_OFF", dueOn: d(-12), amountCents: 9000, description: "Kimono" });
  add({ studentId: ID.heitor, type: "ONE_OFF", dueOn: d(-8), amountCents: 4500, description: "Camiseta do campeonato" });
  // A quinta em atraso é a do `aluno@` (portal.ts), para o total ficar em 5.
  const overdue = charges.slice(2, 6);
  // Em conferência: uma com imagem, duas da mesma unidade enviadas juntas, duas aguardando (PDF).
  const imagem = monthly(ID.joao, 0, 0, d(3), 18000, { status: "IN_REVIEW" });
  const par = [monthly(ID.lucas, 0, 0, d(2), 18000, { status: "IN_REVIEW" }), monthly(ID.lucas, 1, 0, d(2), 15000, { status: "IN_REVIEW" })];
  const aguardando = [
    add({ studentId: ID.fabio, type: "ONE_OFF", dueOn: d(4), amountCents: 7000, description: "Taxa de exame de faixa", status: "IN_REVIEW" }),
    add({ studentId: ID.gabriela, type: "ONE_OFF", dueOn: d(6), amountCents: 5000, description: "Camiseta da academia", status: "IN_REVIEW" }),
  ];
  // Pagas: duas de meses anteriores (uma com atraso) e quatro hoje, uma por meio.
  const pagaPix = monthly(ID.bruno, 0, -1, d(-30), 18000, { status: "PAID" });
  const pagaAtraso = monthly(ID.joao, 0, -1, d(-40), 18000, { status: "PAID" });
  const hojePix = add({ studentId: ID.joao, type: "ONE_OFF", dueOn: d(0), amountCents: 3500, description: "Faixa nova", status: "PAID" });
  const hojeCartao = add({ studentId: ID.isadora, type: "ONE_OFF", dueOn: d(0), amountCents: 8000, description: "Uniforme", status: "PAID" });
  const hojeBoleto = add({ studentId: ID.fabio, type: "ENROLLMENT_FEE", dueOn: d(0), amountCents: 5000, description: "Taxa de matrícula", status: "PAID" });
  const hojeDinheiro = add({ studentId: ID.elisa, type: "ONE_OFF", dueOn: d(0), amountCents: 2500, description: "Protetor bucal", status: "PAID" });
  // Cancelada e renegociada (com as duas parcelas que a substituem).
  add({ studentId: ID.diego, type: "ONE_OFF", dueOn: d(-20), amountCents: 3000, description: "Camiseta", status: "CANCELED", reason: "Cobrança lançada em duplicidade", canceledAt: `${d(-19)}T15:00:00.000Z` });
  const origem = add({ studentId: ID.gabriela, type: "ONE_OFF", dueOn: d(-70), amountCents: 20000, description: "Uniforme completo", status: "RENEGOTIATED", renegotiationId: "r1" });
  add({ studentId: ID.gabriela, type: "INSTALLMENT", dueOn: d(10), amountCents: 10000, description: "Parcela 1/2 · Uniforme completo", originId: origem.id, renegotiationId: "r1" });
  add({ studentId: ID.gabriela, type: "INSTALLMENT", dueOn: d(40), amountCents: 10000, description: "Parcela 2/2 · Uniforme completo", originId: origem.id, renegotiationId: "r1" });

  let number = 0;
  const receipt = (c: MockCharge, method: string, paidAt: string, by: Who): MockReceipt => ({
    code: `CTCENARIO${(++number).toString().padStart(7, "0")}`, unitId: centro, number, chargeId: c.id, amountCents: c.amountCents, paidAt, studentName: nameOf(c.studentId), method, observation: null, by,
  });
  const receipts = [
    receipt(pagaPix, "PIX_KEY", `${d(-29)}T15:00:00.000Z`, ctx.by.ana),
    receipt(pagaAtraso, "CASH", `${d(-30)}T15:00:00.000Z`, ctx.by.ana),
    receipt(hojePix, "PIX_KEY", minutesAgo(30), ctx.by.ana),
    receipt(hojeCartao, "CARD_MACHINE", minutesAgo(60), ctx.by.ana),
    receipt(hojeBoleto, "BOLETO", minutesAgo(90), ctx.by.other),
    receipt(hojeDinheiro, "CASH", minutesAgo(120), ctx.by.other),
  ];

  const reminder = (c: MockCharge, daysAgo: number): MockReminder => ({
    chargeId: c.id, kind: "MANUAL", channel: "EMAIL", status: "SENT", reason: null, createdAt: `${d(-daysAgo)}T14:00:00.000Z`, sentBy: { id: ctx.by.ana.id, name: ctx.by.ana.name },
  });
  const reminders = [reminder(overdue[0], 3), reminder(overdue[1], 10), reminder(overdue[3], 1)];

  let p = 0;
  const proof = (c: MockCharge, sentAt: string, contentType: string): MockPaymentProof => ({
    id: `00000000-0000-0000-0000-000000000d${(++p).toString(16).padStart(2, "0")}`, chargeId: c.id, studentId: c.studentId, unitId: centro, sentAt, status: "PENDING", contentType, refusalReason: null, decidedAt: null,
  });
  const juntos = `${d(-1)}T18:00:00.000Z`;
  const proofs = [
    proof(imagem, `${d(-2)}T13:00:00.000Z`, "image/png"),
    proof(par[0], juntos, "image/jpeg"),
    proof(par[1], juntos, "image/jpeg"),
    proof(aguardando[0], `${d(0)}T09:00:00.000Z`, "application/pdf"),
    proof(aguardando[1], `${d(0)}T10:00:00.000Z`, "application/pdf"),
  ];

  // Bolsa integral: a prévia da geração mostra a Isadora em "não será cobrado".
  const judoRow = alunos.enrollments[ID.isadora].modalities[0];
  const benefits = [{
    id: "00000000-0000-0000-0000-000000000b01", student: { id: ID.isadora, name: nameOf(ID.isadora) }, unit: { id: centro, name: "Unidade Centro" }, modality: { id: judoRow.modalityId, name: "Judô" },
    type: "PERCENT", value: 100, reason: "Bolsa integral do projeto social", decidedBy: "Direção Fictícia", grantedBy: "Gestora Fictícia", validUntil: null, status: "ACTIVE", high: true, monthlyValueCents: 0, rowId: judoRow.id,
  }] as unknown as MockBenefit[];

  return { charges, receipts, reminders, proofs, benefits };
}
