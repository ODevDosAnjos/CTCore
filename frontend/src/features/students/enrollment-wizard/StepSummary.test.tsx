import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { StudentDetail } from "../types";
import { buildRequest, newModality } from "./request";
import { StepSummary } from "./StepSummary";
import type { ApiError } from "@/lib/api";

const UNIT = "00000000-0000-0000-0000-000000000021";
const MODALITY = "00000000-0000-0000-0000-000000000103";
const CLASS = "00000000-0000-0000-0000-000000000301";
const clean = (s: string | null) => (s ?? "").replace(/\s/g, " ");

const draft = {
  ...newModality(),
  unitId: UNIT,
  modalityId: MODALITY,
  primaryClassId: CLASS,
  planId: "p",
  benefit: { on: true, type: "PERCENT" as const, percent: "10", amount: null, reason: "irmão", decidedBy: "Coord", validUntil: "" },
};
const detail = {
  birthDate: "2016-05-22",
  street: "Rua Uruguai",
  number: "410",
  complement: "casa 2",
  district: "Tijuca",
  guardians: [{ guardianId: "g", name: "Juliana Andrade", email: "j@x.example", phone: "21996407788", financial: true, access: "ACTIVE", emailProblem: false }],
} as unknown as StudentDetail;

function stub(exempt = true, fees: { pix: number; creditCard: number } | undefined = { pix: 68, creditCard: 573 }) {
  server.use(
    http.get(`/api/v1/units/${UNIT}`, () => HttpResponse.json({ id: UNIT, name: "Tijuca", settings: { dueDays: [10], enrollmentFeeEnabled: true, enrollmentFeeCents: 8000, ...(fees ? { feesCents: fees } : {}) } })),
    http.get(`/api/v1/units/${UNIT}/modalities`, () => HttpResponse.json({ canManage: true, items: [{ id: MODALITY, name: "Jiu-Jitsu", offered: true }] })),
    http.get("/api/v1/classes", () => HttpResponse.json({ items: [{ id: CLASS, name: "Jiu-Jitsu Kids", schedule: [{ weekday: 2, startsAt: "17:00", endsAt: "18:00" }, { weekday: 4, startsAt: "17:00", endsAt: "18:00" }] }] })),
    http.post("/api/v1/students/:id/enrollment/preview", () =>
      HttpResponse.json({
        modalities: [{ unitId: UNIT, modalityId: MODALITY, planId: "p", planName: "Kids 2x", planCents: 15000, discountCents: 1500, monthlyCents: 13500 }],
        units: [{ unitId: UNIT, unitName: "Tijuca", dueDay: 10, firstDueOn: "2026-10-08", toleranceDays: 5, feeCents: exempt ? 0 : 8000, feeExempt: exempt, feeExemptReason: exempt ? "bolsa" : null, firstChargeCents: 13500, secondDueOn: "2026-11-10", suggestedSecondDueOn: "2026-11-10" }],
        openDebt: { count: 1, totalCents: 25000 },
      }),
    ),
  );
}

function open(props: Partial<Parameters<typeof StepSummary>[0]> = {}) {
  const onPayNow = vi.fn();
  const onInvalid = vi.fn<(e: ApiError) => void>();
  render(
    <ThemeProvider>
      <StepSummary studentId="s1" name="Theo Andrade" detail={detail} request={buildRequest([draft], { [UNIT]: { dueDay: "10", feeExempt: false, feeExemptReason: "", secondDueOn: "" } })} modalities={[draft]} payNow={false} onPayNow={onPayNow} onInvalid={onInvalid} {...props} />
    </ThemeProvider>,
  );
  return { onPayNow, onInvalid };
}

describe("etapa 4: resumo (CA16 a CA18)", () => {
  it("CA16: cartões com dados reais, tabela com valor por meio, segunda cobrança gerada 10 dias antes e termo", async () => {
    stub();
    open();
    expect(await screen.findByRole("heading", { name: "Termo de matrícula" })).toBeInTheDocument();
    const student = within(screen.getByRole("region", { name: "Aluno" }));
    expect(student.getByText("Theo Andrade")).toBeInTheDocument();
    expect(clean(student.getByText(/^22\/05\/2016 · \d+ anos$/).textContent)).toMatch(/anos/);
    expect(student.getByText("Rua Uruguai, 410, casa 2 · Tijuca")).toBeInTheDocument();
    expect(student.getByText("Juliana Andrade · (21) 99640-7788")).toBeInTheDocument();
    const modality = within(screen.getByRole("region", { name: "Modalidade" }));
    expect(await modality.findByText("Jiu-Jitsu Kids · Ter e Qui 17h · Tijuca")).toBeInTheDocument();
    expect(modality.getByText("Kids 2x · R$ 150,00")).toBeInTheDocument();
    expect(modality.getByText("10% · motivo: irmão")).toBeInTheDocument();
    const table = within(screen.getByRole("table"));
    expect(await table.findByText(/Pix R\$.135,68 · Cartão R\$.140,73/)).toBeInTheDocument();
    expect(table.getByText("Taxa de matrícula (isenta)")).toBeInTheDocument();
    expect(table.getByText("gerada em 31/10")).toBeInTheDocument();
    expect(table.getByText("Jiu-Jitsu · nov/2026")).toBeInTheDocument();
    expect(screen.getByText(/Juliana aceita o termo no primeiro acesso ao portal/)).toBeInTheDocument();
    expect(screen.getByText("Débito anterior: 1 cobrança em aberto, R$ 250,00")).toBeInTheDocument();
  });

  it("CA16: sem a configuração de taxas da unidade a coluna por meio mostra o traço", async () => {
    stub(false, undefined);
    open({ detail: undefined });
    await screen.findByRole("heading", { name: "Termo de matrícula" });
    expect(screen.queryByText(/^Pix /)).toBeNull();
    expect(screen.getByText("Taxa de matrícula")).toBeInTheDocument();
  });

  it("CA17: o bloco Pagamento grava só a intenção", async () => {
    stub();
    const { onPayNow } = open();
    await screen.findByRole("heading", { name: "Termo de matrícula" });
    expect(screen.getByRole("radio", { name: /^Responsável paga pelo portal/ })).toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: /^Registrar pagamento agora/ }));
    expect(onPayNow).toHaveBeenCalledWith(true);
  });

  it("CA18: recusa 422 avisa a etapa e falha de rede mostra Tentar de novo", async () => {
    stub();
    server.use(http.post("/api/v1/students/:id/enrollment/preview", () => HttpResponse.json({ code: "UNPROCESSABLE", message: "x", changed: false, fields: [{ field: "dueDay", message: "dia não permitido" }], traceId: "t" }, { status: 422 })));
    const { onInvalid } = open();
    await vi.waitFor(() => expect(onInvalid).toHaveBeenCalled());
    server.use(http.post("/api/v1/students/:id/enrollment/preview", () => HttpResponse.error()));
    render(<ThemeProvider><StepSummary studentId="s1" name="Theo" detail={undefined} request={{ modalities: [], units: [] }} modalities={[]} payNow={false} onPayNow={() => undefined} onInvalid={() => undefined} /></ThemeProvider>);
    expect(await screen.findByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });
});
