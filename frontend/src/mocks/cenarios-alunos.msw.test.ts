import { isValidCpf } from "@/components/fields/masks";
import { resetMockSession, setScenarios } from "./handlers";
import { ID } from "./cenarios/alunos";

const json = { "Content-Type": "application/json" };
const login = (email: string) => fetch("/api/v1/auth/login", { method: "POST", headers: json, body: JSON.stringify({ email, password: "segredo123" }) });
const get = async (path: string) => (await fetch(`/api/v1${path}`)).json();

beforeEach(async () => {
  setScenarios(true);
  resetMockSession();
  await login("ana@exemplo.com");
});

describe("cenário de alunos (#449, CA4)", () => {
  it("traz 12 a 14 alunos nas situações variadas, com contagens coerentes", async () => {
    const body = await get("/students?size=100");
    expect(body.total).toBeGreaterThanOrEqual(12);
    expect(body.total).toBeLessThanOrEqual(14);
    const seals = new Set(body.items.flatMap((s: { seals: string[] }) => s.seals));
    expect(seals).toContain("TERM_PENDING");
    expect(seals).toContain("EMAIL_PROBLEM");
    expect(seals).toContain("NEW");
    const statuses = new Set(body.items.map((s: { status: string }) => s.status));
    expect(statuses).toEqual(new Set(["ACTIVE", "FORMER"]));
    expect(body.counts.active + body.counts.former).toBe(body.items.filter((s: { status: string }) => s.status !== "NONE").length);
    expect(body.counts.overdue).toBe(body.items.filter((s: { financialStatus: string }) => s.financialStatus === "OVERDUE").length);
  });

  it("todo CPF do cenário é válido", async () => {
    const body = await get("/students?size=100");
    for (const s of body.items) {
      const detail = await get(`/students/${s.id}`);
      if (detail.cpf) expect(isValidCpf(detail.cpf)).toBe(true);
    }
  });
});

describe("responsáveis (#449, CA5)", () => {
  it("o menor tem 2 responsáveis, um financeiro e um com acesso; o adulto não tem", async () => {
    const minor = await get(`/students/${ID.heitor}`);
    expect(minor.guardians).toHaveLength(2);
    expect(minor.guardians.filter((g: { financial: boolean }) => g.financial)).toHaveLength(1);
    expect(minor.guardians.some((g: { access: string }) => g.access === "ACTIVE")).toBe(true);
    expect((await get(`/students/${ID.joao}`)).guardians).toEqual([]);
  });

  it("'Tornar financeiro' funciona e o terceiro responsável devolve o limite de 2", async () => {
    const other = (await get(`/students/${ID.heitor}`)).guardians.find((g: { financial: boolean }) => !g.financial);
    const res = await fetch(`/api/v1/students/${ID.heitor}/guardians/${other.guardianId}`, { method: "PUT", headers: json, body: JSON.stringify({ financial: true }) });
    expect(res.status).toBe(200);
    const third = await fetch(`/api/v1/students/${ID.heitor}/guardians`, { method: "POST", headers: json, body: JSON.stringify({ name: "Terceiro Fictício", cpf: "44455566619", email: "terceiro@alfa.test", phone: "21900009999", reason: "Novo responsável" }) });
    expect(third.status).toBe(409);
    expect((await third.json()).code).toBe("GUARDIAN_LIMIT");
  });
});

describe("transferir modalidade (#449, CA6)", () => {
  it("aluno ativo com modalidade tem unidade de destino com turma e plano", async () => {
    const view = await get(`/students/${ID.joao}/enrollment`);
    const row = view.modalities[0];
    const reach = await get("/units/reachable");
    const dest = reach.units.filter((u: { id: string }) => u.id !== row.unit.id);
    expect(dest.length).toBeGreaterThan(0);
    const classes = await get(`/classes?unitId=${dest[0].id}&modalityId=${row.modality.id}&status=ACTIVE`);
    expect(classes.total).toBeGreaterThan(0);
    const res = await fetch(`/api/v1/students/${ID.joao}/modalities/${row.id}/transfer`, {
      method: "POST", headers: json, body: JSON.stringify({ unitId: dest[0].id, primaryClassId: classes.items[0].id, planId: ID.planSul, dueDay: 10 }),
    });
    expect(res.status).toBe(200);
  });
});

describe("turmas (#449, CA7)", () => {
  it("são 6, com lotada 31/30, desativada e sem limite; o painel traz 4 ou mais alunos", async () => {
    const body = await get("/classes?size=100");
    expect(body.total).toBe(6);
    const over = body.items.find((c: { overCapacity: boolean }) => c.overCapacity);
    expect([over.activeStudents, over.capacity]).toEqual([31, 30]);
    expect(body.items.some((c: { status: string }) => c.status === "INACTIVE")).toBe(true);
    expect(body.items.some((c: { capacity: number | null; status: string }) => c.capacity === null && c.status === "ACTIVE")).toBe(true);
    expect((await get(`/classes/${over.id}`)).students.length).toBeGreaterThanOrEqual(4);
  });
});
