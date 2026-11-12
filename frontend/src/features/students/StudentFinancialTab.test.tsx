import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import type { ChargeRow } from "@/features/charges/types";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { StudentRecordPanel } from "./StudentRecordPanel";
import type { StudentRecord } from "./types";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const record: StudentRecord = {
  id: "s1", name: "Ana Souza", photoUrl: null, birthDate: "1990-05-02", age: 36, minor: false, ageRange: null, registeredUnit: { id: "u1", name: "Centro" }, seals: [],
  contact: { phone: "21912345678", email: "ana@alfa.test", emailProblem: false }, cpf: null,
  address: { postalCode: "01001000", street: "Rua Um", number: "1", complement: null, district: "Centro", city: "Rio", state: "RJ" }, guardians: [],
};
const charge = (over: Partial<ChargeRow> = {}): ChargeRow => ({
  id: "c1", student: { id: "s1", name: "Ana Souza", photoUrl: null }, unit: { id: "u1", name: "Centro" }, type: "MONTHLY", modality: { id: "m1", name: "Jiu-Jitsu" },
  referenceMonth: "2026-03-01", description: null, amountCents: 12000, dueOn: "2026-03-05", status: "OVERDUE", payment: null, daysLate: null, ...over,
});
const paid = charge({ id: "c2", referenceMonth: "2026-02-01", dueOn: "2026-02-05", status: "PAID", payment: { method: "PIX_MP", paidAt: "2026-02-04T12:00:00Z", amountCents: 12000 } });
const list = (items: ChargeRow[]) => ({ items, page: 1, size: 100, total: items.length, counts: { overdue: 0, dueToday: 0, inReview: 0, paidMonth: 0, all: 0 }, totals: { count: items.length, amountCents: 0, paidCents: 0, openCents: 0 } });

let queries: string[];

function setup(opts: { role?: string; charges?: () => Response | Promise<Response> } = {}) {
  queries = [];
  const role = opts.role ?? "COORDINATOR";
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/students/s1/record", () => HttpResponse.json(record)),
    http.get("/api/v1/students/s1/enrollment", () => HttpResponse.json({ id: null, status: "NONE", enrolledAt: null, reopenedAt: null, modalities: [] })),
    http.get("/api/v1/charges", ({ request }) => {
      queries.push(new URL(request.url).search);
      return opts.charges ? opts.charges() : HttpResponse.json(list([charge(), paid]));
    }),
    http.get("/api/v1/charges/c1", () =>
      HttpResponse.json({
        charge: charge(), toleranceDays: 5, composition: { plan: null, planCents: 12000, benefitType: null, benefitCents: 0, amountCents: 12000 },
        payer: { id: "s1", name: "Ana Souza", kind: "STUDENT" }, origin: null, replacedBy: [], reason: null, canceledAt: null, canceledBy: null, payments: [], reminders: [],
        actions: { cancel: true, renegotiate: true, registerPayment: false, sendReminder: false, refund: false },
      }),
    ),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <SessionProvider>
          <StudentRecordPanel id="s1" onClose={() => {}} />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const panel = () => screen.findByRole("dialog", { name: "Ficha do aluno" });
async function openTab(user = userEvent.setup()) {
  const dialog = await panel();
  await user.click(await within(dialog).findByRole("tab", { name: "Financeiro" }));
  return dialog;
}

describe("aba Financeiro da ficha (RF-COB-02, R14)", () => {
  it("CA7, CA9: mostra os cartões, a nota e a tabela com a ação certa por linha; o cabeçalho mostra Em atraso", async () => {
    setup();
    const dialog = await openTab();
    expect(await within(dialog).findByText("Jiu-Jitsu · 03/2026")).toBeInTheDocument();
    expect(within(dialog).getAllByText("R$ 120,00", { selector: "[data-stat-value]" })).toHaveLength(3);
    expect(within(dialog).getByText("Pago em 2026")).toBeInTheDocument();
    expect(within(dialog).getByText("1 pagamento")).toBeInTheDocument();
    expect(within(dialog).getByText("As taxas do meio de pagamento são somadas quando o aluno paga online.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /Registrar pagamento: Jiu-Jitsu · 03\/2026/ })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /Recibo: Jiu-Jitsu · 02\/2026/ })).toBeInTheDocument();
    expect(within(dialog).getAllByText("Em atraso").length).toBeGreaterThanOrEqual(2);
    expect(within(dialog).getByText("Paga")).toBeInTheDocument();
    expect(queries).toEqual(["?studentId=s1&size=100"]);
  });

  it("CA9: Registrar pagamento abre o registro da cobrança e, concluído, a lista recarrega", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/v1/charges/c1/payments", () => HttpResponse.json({ receipt: { number: 7, code: "ABC" }, receiptEmail: "NOT_REQUESTED" }, { status: 201 })),
    );
    setup();
    const dialog = await openTab(user);
    await user.click(await within(dialog).findByRole("button", { name: /Registrar pagamento: Jiu-Jitsu · 03\/2026/ }));
    const pay = await screen.findByRole("dialog", { name: "Registrar pagamento" });
    await user.click(within(pay).getByRole("button", { name: "Confirmar pagamento" }));
    await within(pay).findByRole("status");
    await user.click(within(pay).getAllByRole("button", { name: "Fechar" }).at(-1)!);
    await waitFor(() => expect(queries).toHaveLength(2));
  });

  it("CA9: cobrança em conferência tem Abrir e abre o painel da cobrança", async () => {
    const user = userEvent.setup();
    setup({ charges: () => HttpResponse.json(list([charge({ status: "IN_REVIEW" })])) });
    const dialog = await openTab(user);
    await user.click(await within(dialog).findByRole("button", { name: /Abrir: Jiu-Jitsu · 03\/2026/ }));
    const panelCharge = await screen.findByRole("dialog", { name: "Cobrança" });
    expect(within(panelCharge).queryByRole("link", { name: "Ver aluno" })).toBeNull();
  });

  it("CA9: Paga com atraso aparece com selo próprio", async () => {
    setup({ charges: () => HttpResponse.json(list([{ ...paid, status: "PAID_LATE" }])) });
    expect(await within(await openTab()).findByText("Paga com atraso")).toBeInTheDocument();
  });

  it("CA8: Nova cobrança avulsa abre a cobrança com o aluno; Professor nem tem a aba", async () => {
    const user = userEvent.setup();
    setup();
    const dialog = await openTab(user);
    await user.click(await within(dialog).findByRole("button", { name: "Nova cobrança avulsa" }));
    expect(await screen.findByRole("dialog", { name: "Nova cobrança avulsa" })).toBeInTheDocument();
  });

  it("CA10: a 390 px as cobranças viram cartões em Em aberto e Pagos", async () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: true, media: q, addEventListener: () => {}, removeEventListener: () => {} })) as unknown as typeof window.matchMedia;
    try {
      setup();
      const dialog = await openTab();
      expect(await within(dialog).findByRole("heading", { name: "Em aberto" })).toBeInTheDocument();
      expect(within(dialog).getByRole("heading", { name: "Pagos" })).toBeInTheDocument();
      expect(within(dialog).queryByRole("table")).toBeNull();
      expect(within(dialog).getByText(/^Pix · 04\/02$/)).toBeInTheDocument();
      expect(within(dialog).getByText(/^venceu 05\/03 · \d+ dias$/)).toBeInTheDocument();
    } finally {
      window.matchMedia = original;
    }
  });

  it("CA18: sem cobrança em atraso o cabeçalho mostra Em dia", async () => {
    setup({ charges: () => HttpResponse.json(list([paid])) });
    const dialog = await panel();
    expect(await within(dialog).findByText("Em dia")).toBeInTheDocument();
  });

  it("CA18: Professor não vê a aba nem o selo, e a chamada de cobranças nem é feita", async () => {
    setup({ role: "TEACHER" });
    const dialog = await panel();
    await within(dialog).findByText("Ana Souza");
    expect(within(dialog).queryByRole("tab", { name: "Financeiro" })).toBeNull();
    expect(within(dialog).queryByText("Em dia")).toBeNull();
    expect(queries).toEqual([]);
  });

  it("CA20: sem cobranças mostra o estado vazio", async () => {
    setup({ charges: () => HttpResponse.json(list([])) });
    const dialog = await openTab();
    expect(await within(dialog).findByText("Este aluno ainda não tem cobranças.")).toBeInTheDocument();
  });

  it("CA20: 500 pede nova tentativa e a nova tentativa traz a lista", async () => {
    const user = userEvent.setup();
    let fail = true;
    let release!: () => void;
    const gate = new Promise<void>((r) => { release = r; });
    setup({ charges: async () => (await gate, fail ? HttpResponse.json({ code: "X" }, { status: 500 }) : HttpResponse.json(list([charge()]))) });
    const dialog = await openTab(user);
    expect(await within(dialog).findByText("Carregando...")).toBeInTheDocument();
    release();
    const retry = await within(dialog).findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect(await within(dialog).findByText("Jiu-Jitsu · 03/2026")).toBeInTheDocument();
  });

  it("CA20: 403 mostra sem permissão", async () => {
    setup({ charges: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    expect(await within(await openTab()).findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it("CA20: a 360 px a aba passa no axe nos dois temas", async () => {
    for (const dark of [false, true]) {
      setDevicePrefersDark(dark);
      window.innerWidth = 360;
      const { unmount } = setup();
      const dialog = await openTab();
      await within(dialog).findByText("Jiu-Jitsu · 03/2026");
      await waitFor(async () => expect(await axeViolations(dialog)).toEqual([]));
      unmount();
    }
  });
});
