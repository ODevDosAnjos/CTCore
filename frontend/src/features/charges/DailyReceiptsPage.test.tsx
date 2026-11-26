import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { DailyReceipts } from "./types";

const session: SessionView = {
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role: "COORDINATOR", unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
};
const ana = { id: "p1", name: "Ana Admin" };
const data = (over: Partial<DailyReceipts> = {}): DailyReceipts => ({
  date: "2026-10-08",
  totalCents: 41000,
  count: 6,
  byMethod: [
    { method: "PIX_MP", count: 1, totalCents: 10000, feePassedCents: 50 },
    { method: "CREDIT_CARD", count: 1, totalCents: 8000, feePassedCents: 200 },
    { method: "DEBIT_CARD", count: 1, totalCents: 3000, feePassedCents: 30 },
    { method: "BOLETO", count: 1, totalCents: 1800, feePassedCents: 349 },
    { method: "CASH", count: 2, totalCents: 18200, feePassedCents: 0 },
  ],
  byRegistrar: [
    { registeredBy: ana, count: 2, totalCents: 18200 },
    { registeredBy: null, count: 4, totalCents: 22800 },
  ],
  payments: [],
  ...over,
});

let calls: URLSearchParams[];

function setup(opts: { receipts?: () => Response | Promise<Response>; allUnits?: boolean } = {}) {
  calls = [];
  window.history.replaceState(null, "", "/cobrancas/recebimentos");
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session)),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: { ...mockPermissions("COORDINATOR"), COLLECTIONS: "FULL" } })),
    http.get("/api/v1/units/reachable", () =>
      HttpResponse.json({ allUnits: opts.allUnits ?? false, units: [{ id: "u1", name: "Centro", shortName: "c" }, ...(opts.allUnits ? [{ id: "u2", name: "Norte", shortName: "n" }] : [])] }),
    ),
    http.get("/api/v1/billing/daily-receipts", ({ request }) => {
      calls.push(new URL(request.url).searchParams);
      return opts.receipts ? opts.receipts() : HttpResponse.json(data());
    }),
    http.get("/api/v1/charges", () => HttpResponse.json({ items: [], page: 1, size: 20, total: 0 })),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/cobrancas/recebimentos"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = () => screen.findByRole("heading", { name: "Recebimentos do dia", level: 1 });
const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
const shift = (iso: string, d: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + d * 86_400_000).toISOString().slice(0, 10);

describe("DailyReceiptsPage (RF-COB-08, #479)", () => {
  afterEach(() => setDeviceNarrow(false));

  it("CA1, CA3: subtítulo só com a data por extenso; Dia anterior e Exportar CSV (Em breve); sem campo de data nem Voltar", async () => {
    setup();
    await ready();
    expect(await screen.findByText(/^[A-Z][^ ,]+, \d{1,2} de [a-zç]+ de \d{4}$/)).toBeInTheDocument();
    expect(screen.queryByText(/sem abertura ou fechamento/)).toBeNull();
    expect(screen.getByRole("button", { name: "Dia anterior" })).toBeInTheDocument();
    const csv = screen.getByRole("button", { name: /Exportar CSV/ });
    expect(csv).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Em breve")).toBeInTheDocument();
    expect(screen.queryByLabelText("Data")).toBeNull();
    expect(screen.queryByRole("link", { name: "Voltar às cobranças" })).toBeNull();
    await screen.findByText("Total");
    const before = calls.length;
    await userEvent.setup().click(csv);
    expect(calls).toHaveLength(before);
  });

  it("CA2: Dia anterior volta um dia, a rota recebe a data e aparece Próximo dia, que volta a hoje", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    await screen.findByText("Total");
    expect(screen.queryByRole("button", { name: "Próximo dia" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Dia anterior" }));
    await waitFor(() => expect(calls.at(-1)!.get("date")).toBe(shift(today(), -1)));
    await user.click(await screen.findByRole("button", { name: "Próximo dia" }));
    await waitFor(() => expect(calls.at(-1)!.get("date")).toBe(today()));
    expect(screen.queryByRole("button", { name: "Próximo dia" })).toBeNull();
  });

  it("CA4, CA5, CA6: por meio com cartão somado, taxa e Total; por quem lançou com o portal; sem lista nem cartões de total", async () => {
    setup();
    await ready();
    await screen.findByText("Total");
    const [byMethod, byRegistrar] = screen.getAllByRole("table");
    expect(screen.getAllByRole("table")).toHaveLength(2);
    expect(within(byMethod).getAllByRole("row").slice(1, -1).map((r) => within(r).getAllByRole("cell")[0].textContent)).toEqual(["Pix pelo portal", "Cartão pelo portal", "Boleto", "Dinheiro"]);
    expect(within(byMethod).getByText("Cartão pelo portal").closest("tr")).toHaveTextContent(/2.*110,00.*2,30/);
    expect(within(byMethod).getByText("Dinheiro").closest("tr")).toHaveTextContent(/2.*182,00.*—/);
    expect(within(byMethod).getByText("Total").closest("tr")).toHaveTextContent(/6.*410,00.*6,29/);
    expect(within(byRegistrar).getByText("Portal (aluno pagou)").closest("tr")).toHaveTextContent(/4.*228,00/);
    expect(within(byRegistrar).getByText("Ana Admin").closest("tr")).toHaveTextContent(/2.*182,00/);
    expect(screen.queryByText("Pagamentos do dia")).toBeNull();
    expect(screen.queryByText("Total recebido")).toBeNull();
  });

  it("CA7: com todas as unidades pede a unidade; dia vazio, erro com nova tentativa e 403", async () => {
    const user = userEvent.setup();
    setup({ allUnits: true });
    await ready();
    expect(await screen.findByText("Escolha uma unidade", { selector: "p, h2, h3" })).toBeInTheDocument();
    expect(calls).toHaveLength(0);
    await user.selectOptions(screen.getByRole("combobox", { name: "Unidade" }), "u2");
    await screen.findByText("Total");
    expect(calls.at(-1)!.get("unitId")).toBe("u2");
  });

  it("CA7: carregando, erro com tentar de novo e dia sem pagamento", async () => {
    const user = userEvent.setup();
    let mode: "error" | "empty" = "error";
    setup({ receipts: () => (mode === "error" ? HttpResponse.json({}, { status: 500 }) : HttpResponse.json(data({ count: 0, totalCents: 0, byMethod: [], byRegistrar: [], payments: [] }))) });
    await ready();
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    mode = "empty";
    await user.click(retry);
    expect(await screen.findByText("Nenhum recebimento neste dia")).toBeInTheDocument();
  });

  it("CA7: 403 da rota vira sem permissão", async () => {
    setup({ receipts: () => HttpResponse.json({}, { status: 403 }) });
    await ready();
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it("CA13: a 360 px vira cartões, sem tabela, e o axe não acusa violação nos dois temas", async () => {
    for (const dark of [false, true]) {
      setDeviceNarrow(true, dark);
      window.innerWidth = 360;
      const { container, unmount } = setup();
      await ready();
      await screen.findByText("Total");
      expect(screen.queryAllByRole("table")).toHaveLength(0);
      expect(screen.getByText("Portal (aluno pagou)")).toBeInTheDocument();
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });
});
