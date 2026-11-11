import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { useState } from "react";
import { server } from "@/mocks/server";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { buildRequest, newModality } from "./request";
import { StepBilling } from "./StepBilling";
import type { ConclusionRequest, UnitDraft } from "./types";

const UNIT = "00000000-0000-0000-0000-000000000021";
const MODALITY = "00000000-0000-0000-0000-000000000103";
const clean = (s: string | null) => (s ?? "").replace(/\s/g, " ");

const mod = { ...newModality(), unitId: UNIT, modalityId: MODALITY, primaryClassId: "c", planId: "p" };

function stub({ fee = 8000, preview }: { fee?: number; preview?: (body: ConclusionRequest) => Response } = {}) {
  server.use(
    http.get(`/api/v1/units/${UNIT}`, () => HttpResponse.json({ id: UNIT, name: "Tijuca", settings: { dueDays: [1, 5, 10, 15], enrollmentFeeEnabled: fee > 0, enrollmentFeeCents: fee, feesCents: {} } })),
    http.get(`/api/v1/units/${UNIT}/modalities`, () => HttpResponse.json({ canManage: true, items: [{ id: MODALITY, name: "Jiu-Jitsu", offered: true }] })),
    http.post("/api/v1/students/:id/enrollment/preview", async ({ request }) => {
      const body = (await request.json()) as ConclusionRequest;
      if (preview) return preview(body);
      const exempt = Boolean(body.units[0].feeExempt);
      return HttpResponse.json({
        modalities: [{ unitId: UNIT, modalityId: MODALITY, planId: "p", planName: "Livre", planCents: 15000, discountCents: 1500, monthlyCents: 13500 }],
        units: [{ unitId: UNIT, unitName: "Tijuca", dueDay: 10, firstDueOn: "2026-10-08", toleranceDays: 5, feeCents: exempt ? 0 : fee, feeExempt: exempt, feeExemptReason: exempt ? "bolsa" : null, firstChargeCents: exempt ? 13500 : 13500 + fee, secondDueOn: "2026-11-10", suggestedSecondDueOn: "2026-11-10" }],
        openDebt: { count: 0, totalCents: 0 },
      });
    }),
  );
}

function Host({ inherited }: { inherited?: number }) {
  const [drafts, setDrafts] = useState<Record<string, UnitDraft>>({ [UNIT]: { dueDay: inherited ? String(inherited) : "", feeExempt: false, feeExemptReason: "", secondDueOn: "" } });
  const d = drafts[UNIT];
  return (
    <ThemeProvider>
      <StepBilling
        studentId="s1"
        request={buildRequest([mod], drafts)}
        ready={Boolean(d.dueDay) && (!d.feeExempt || d.feeExemptReason.trim().length >= 3)}
        units={[{ id: UNIT, name: "Tijuca" }]}
        drafts={drafts}
        inherited={inherited ? { [UNIT]: inherited } : {}}
        errors={{}}
        onChange={(_, next) => setDrafts({ [UNIT]: next })}
      />
    </ThemeProvider>
  );
}

describe("etapa 3: vencimento e primeira cobrança (CA13 a CA15)", () => {
  it("CA13: escolher o dia pede a prévia e mostra a tabela com o total; a isenção mostra selo, valor riscado e total sem a taxa", async () => {
    stub();
    const user = userEvent.setup();
    render(<Host />);
    expect(await screen.findByText("Escolha o dia de vencimento para ver a primeira cobrança.")).toBeInTheDocument();
    await user.click(await screen.findByRole("radio", { name: "Dia 10" }));
    expect(await screen.findByText("Jiu-Jitsu · out/2026 (primeiro mês)")).toBeInTheDocument();
    expect(screen.getByText("O primeiro mês é sempre cheio e vence no dia da matrícula, com 5 dias de tolerância.")).toBeInTheDocument();
    expect(clean(screen.getByRole("row", { name: /Total/ }).textContent)).toContain("R$ 215,00");
    await user.click(screen.getByRole("switch", { name: "Isentar a taxa de matrícula" }));
    await user.type(screen.getByLabelText("Motivo da isenção"), "bolsa");
    expect(await screen.findByText("Isenta")).toBeInTheDocument();
    expect(clean(screen.getByText(/R\$ 80,00/, { selector: "del" }).textContent)).toBe("R$ 80,00");
    await waitFor(() => expect(clean(screen.getByRole("row", { name: /Total/ }).textContent)).toContain("R$ 135,00"));
  });

  it("CA13: unidade sem taxa não mostra o interruptor nem a linha da taxa", async () => {
    stub({ fee: 0 });
    const user = userEvent.setup();
    render(<Host />);
    await user.click(await screen.findByRole("radio", { name: "Dia 5" }));
    await screen.findByText("Jiu-Jitsu · out/2026 (primeiro mês)");
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByText("Taxa de matrícula")).toBeNull();
  });

  it("CA14: a data sugerida vem da prévia e a recusa do servidor aparece no campo", async () => {
    stub();
    const user = userEvent.setup();
    render(<Host />);
    await user.click(await screen.findByRole("radio", { name: "Dia 10" }));
    expect(await screen.findByText(/Sugerida para 10\/11\/2026, no dia de vencimento escolhido/)).toBeInTheDocument();
    stub({
      preview: () => HttpResponse.json({ code: "UNPROCESSABLE", message: "x", changed: false, fields: [{ field: "units.0.secondDueOn", message: "entre 15 e 60 dias da matrícula" }], traceId: "t" }, { status: 422 }) as unknown as Response,
    });
    await user.type(screen.getByLabelText("Data da segunda cobrança"), "2026-10-09");
    expect(await screen.findByText("entre 15 e 60 dias da matrícula")).toBeInTheDocument();
  });

  it("CA15: aluno que já paga na unidade vê só o dia herdado e a nota", async () => {
    stub();
    render(<Host inherited={10} />);
    expect(await screen.findByRole("radio", { name: "Dia 10" })).toBeChecked();
    expect(screen.getAllByRole("radio")).toHaveLength(1);
    expect(screen.getByText(/já paga nesta unidade no dia 10/)).toBeInTheDocument();
  });
});
