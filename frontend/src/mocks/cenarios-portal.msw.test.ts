import { resetMockSession, setScenarios } from "./handlers";

const json = { "Content-Type": "application/json" };
const login = (email: string) => fetch("/api/v1/auth/login", { method: "POST", headers: json, body: JSON.stringify({ email, password: "segredo123" }) });
const get = async (path: string) => (await fetch(`/api/v1${path}`)).json();
const ADULT = "00000000-0000-0000-0000-000000000701";
const MINOR = "00000000-0000-0000-0000-000000000702";
const CHILD_TWO = "00000000-0000-0000-0000-000000000703";
const accept = async (id: string) => {
  const term = await get("/portal/term");
  return fetch(`/api/v1/portal/students/${id}/term-acceptance`, { method: "POST", headers: json, body: JSON.stringify({ version: term[0].term.version }) });
};

beforeEach(() => {
  setScenarios(true);
  resetMockSession();
});

describe("cenário do portal (#449)", () => {
  it("CA12: aluno@ tem 3 abertas de modalidades diferentes (uma vencida), histórico, chave Pix e imagem concedida", async () => {
    await login("aluno@exemplo.com");
    const fin = await get("/portal/finance");
    expect(fin.open).toHaveLength(3);
    expect(new Set(fin.open.map((c: { modality: { name: string } }) => c.modality.name)).size).toBe(3);
    expect(fin.open.filter((c: { situation: string }) => c.situation === "OVERDUE")).toHaveLength(1);
    expect(fin.history.some((h: { status: string }) => h.status === "PAID")).toBe(true);
    const overdue = fin.open.find((c: { situation: string }) => c.situation === "OVERDUE");
    expect((await get(`/portal/charges/${overdue.id}/pix-instructions`)).pixKey).toBeTruthy();
    expect((await get("/portal/info")).terms.imageUse.granted).toBe(true);
  });

  it("CA13: familia@ vê abertas de dois filhos em unidades diferentes e envia comprovante de duas da mesma unidade", async () => {
    await login("familia@exemplo.com");
    const fin = await get("/portal/finance?scope=FAMILY");
    expect(new Set(fin.open.map((c: { studentId: string }) => c.studentId))).toEqual(new Set([MINOR, CHILD_TWO]));
    expect(new Set(fin.open.map((c: { unit: { id: string } }) => c.unit.id)).size).toBeGreaterThanOrEqual(2);
    const same = fin.open.filter((c: { studentId: string }) => c.studentId === CHILD_TWO).slice(0, 2).map((c: { id: string }) => c.id);
    expect(same).toHaveLength(2);
    // FormData do jsdom não passa pelo fetch do Node: multipart montado à mão (como em portal-finance.msw.test.ts).
    const body = [...same.map((id: string) => `--x
Content-Disposition: form-data; name="chargeIds"

${id}
`), `--x
Content-Disposition: form-data; name="file"; filename="c"
Content-Type: image/png

${"a".repeat(100)}
--x--
`].join("");
    const sent = await fetch("/api/v1/portal/charges/proof", { method: "POST", headers: { "Content-Type": "multipart/form-data; boundary=x" }, body });
    expect(sent.status).toBe(201);
    expect(await sent.json()).toHaveLength(2);
  });

  it("CA14: termo pendente do adulto (termo@) e dos dois filhos (familia@, 1 de 2) só quando pedido", async () => {
    await login("termo@exemplo.com");
    expect(await get("/portal/term")).toHaveLength(1);

    await login("familia@exemplo.com");
    expect(await get("/portal/term")).toEqual([]);

    setScenarios(true, { termoFamilia: true });
    await login("familia@exemplo.com");
    const pending = await get("/portal/term");
    expect(pending.map((t: { id: string }) => t.id).sort()).toEqual([MINOR, CHILD_TWO].sort());
    expect((await accept(pending[0].id)).status).toBe(201);
    expect(await get("/portal/term")).toHaveLength(1);
  });

  it("CA15: pedidos da gestão e do portal, um de cada tipo, recusado, aprovado e encerramento aberto", async () => {
    await login("ana@exemplo.com");
    const all = (await get("/portal-requests?status=ALL&size=100")).items as { kind: string; status: string; modalityRowId: string | null }[];
    expect(new Set(all.map((r) => r.kind))).toEqual(new Set(["CLASS_CHANGE", "NEW_MODALITY", "PLAN_CHANGE", "CLOSURE"]));
    expect(all.some((r) => r.status === "REFUSED")).toBe(true);
    expect(all.some((r) => r.status === "APPROVED")).toBe(true);
    const closure = all.find((r) => r.kind === "CLOSURE" && r.status === "OPEN")!;

    await login("aluno@exemplo.com");
    const mine = (await get(`/portal/students/${ADULT}/requests`)) as { kind: string }[];
    expect(mine).toHaveLength(all.length);
    const dup = await fetch(`/api/v1/portal/students/${ADULT}/requests`, { method: "POST", headers: json, body: JSON.stringify({ kind: "CLOSURE", modalityRowId: closure.modalityRowId, reason: "SCHEDULE" }) });
    expect(dup.status).toBe(409);
  });
});
