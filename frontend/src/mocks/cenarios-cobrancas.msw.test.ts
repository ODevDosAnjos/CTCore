import { resetMockSession, setScenarios } from "./handlers";
import { ID } from "./cenarios/alunos";

const login = (email: string) => fetch("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "segredo123" }) });
const get = async (path: string) => (await fetch(`/api/v1${path}`)).json();
const UNIT = "00000000-0000-0000-0000-000000000021";

// Quarta-feira, meio-dia em São Paulo: "30 a 120 minutos atrás" fica no mesmo dia da unidade.
afterEach(() => vi.useRealTimers());
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T15:00:00Z"));
  setScenarios(true);
  resetMockSession();
  await login("ana@exemplo.com");
});

describe("cenário de cobranças (#449)", () => {
  it("CA8: 12 ou mais cobranças em todos os tipos e situações; paga, cancelada e renegociada abrem o painel", async () => {
    const body = await get("/charges?size=100");
    expect(body.total).toBeGreaterThanOrEqual(12);
    const items = body.items as { id: string; type: string; status: string; payment: { method: string } | null }[];
    expect(new Set(items.map((c) => c.type))).toEqual(new Set(["MONTHLY", "ONE_OFF", "INSTALLMENT", "ENROLLMENT_FEE"]));
    for (const s of ["PENDING", "DUE_TODAY", "OVERDUE", "IN_REVIEW", "PAID", "PAID_LATE", "CANCELED", "RENEGOTIATED"]) expect(items.map((c) => c.status)).toContain(s);
    const methods = items.filter((c) => c.payment).map((c) => c.payment!.method);
    for (const m of ["PIX_KEY", "CARD_MACHINE", "CASH"]) expect(methods).toContain(m);
    for (const s of ["PAID", "CANCELED", "RENEGOTIATED"]) {
      const c = items.find((x) => x.status === s)!;
      expect((await fetch(`/api/v1/charges/${c.id}`)).status).toBe(200);
    }
  });

  it("CA9: 5 em atraso com último lembrete; bloqueada e bloqueia em 2 dias", async () => {
    const body = await get("/charges/overdue");
    expect(body.total).toBe(5);
    const days = body.items.map((r: { daysToBlock: number | null }) => r.daysToBlock);
    expect(days).toContain(0);
    expect(days).toContain(2);
    expect(body.items.filter((r: { lastReminder: unknown }) => r.lastReminder).length).toBeGreaterThanOrEqual(1);
    expect(body.items.map((r: { daysLate: number }) => r.daysLate)).toEqual(expect.arrayContaining([25, 59]));
  });

  it("CA10: comprovantes com imagem, de duas cobranças juntas e aguardando", async () => {
    const body = await get("/payment-proofs?size=100");
    const items = body.items as { sentAt: string; contentType: string; unitId: string; studentId: string }[];
    expect(items.filter((p) => p.contentType.startsWith("image/")).length).toBeGreaterThanOrEqual(1);
    const pair = items.filter((a) => items.filter((b) => b.sentAt === a.sentAt && b.unitId === a.unitId).length === 2);
    expect(pair).toHaveLength(2);
    expect(items.filter((p) => p.contentType === "application/pdf")).toHaveLength(2);
  });

  it("CA11: recebimentos do dia por meio e por quem lançou; prévia com totais e quem não será cobrado", async () => {
    const day = await get(`/billing/daily-receipts?unitId=${UNIT}`);
    expect(day.byMethod.map((m: { method: string }) => m.method).sort()).toEqual(["BOLETO", "CARD_MACHINE", "CASH", "PIX_KEY"]);
    expect(day.byRegistrar.length).toBeGreaterThanOrEqual(2);
    const preview = await get(`/billing/generation-preview?unitId=${UNIT}&days=60`);
    expect(preview.count).toBeGreaterThan(0);
    expect(preview.totalCents).toBeGreaterThan(0);
    expect(preview.skipped).toEqual(expect.arrayContaining([expect.objectContaining({ studentId: ID.isadora, reason: "FULL_BENEFIT" })]));
  });
});
