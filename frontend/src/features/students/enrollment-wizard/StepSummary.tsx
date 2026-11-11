import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatMoney } from "@/components/fields/masks";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { ApiError } from "@/lib/api";
import { formatDate, formatPhoneDisplay } from "@/lib/format";
import { scheduleText } from "../modalityDialogSummary";
import { useClassChoices } from "../ModalityPickers";
import type { StudentDetail } from "../types";
import { useResource } from "../useStudentRecord";
import { previewEnrollment } from "./api";
import { ageOf, dayMonthBefore, monthYear } from "./enrollmentFormat";
import { FirstChargeTable, type ChargeRow } from "./FirstChargeTable";
import { useUnitInfo } from "./StepBilling";
import type {
  ConclusionRequest,
  EnrollmentPreview,
  ModalityDraft,
  PreviewUnit,
} from "./types";

type State =
  | { kind: "loading" }
  | { kind: "forbidden" }
  | { kind: "error" }
  | { kind: "invalid"; error: ApiError }
  | { kind: "ready"; preview: EnrollmentPreview };

const first = (name: string) => name.split(" ")[0] ?? name;

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3 rounded-lg border p-4"
    >
      <h2 className="font-medium">{title}</h2>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, string | undefined][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      {rows
        .filter(([, v]) => v)
        .map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="break-words font-medium">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

function ModalityCard({
  draft,
  planName,
  planCents,
  unitName,
}: {
  draft: ModalityDraft;
  planName: string;
  planCents: number;
  unitName: string;
}) {
  const { t } = useTranslation();
  const k = "enrollmentWizard.summary.";
  const classes = useClassChoices(draft.unitId, draft.modalityId);
  const graduation = useResource<{ levels: { id: string; name: string }[] }>(
    draft.origin.on ? `/modalities/${draft.modalityId}/graduation` : null,
  );
  const klass = classes.data?.items.find((c) => c.id === draft.primaryClassId);
  const b = draft.benefit;
  const benefit = b.on
    ? t(`${k}benefitValue`, {
        value:
          b.type === "PERCENT" ? `${b.percent}%` : formatMoney(b.amount ?? 0),
        reason: b.reason.trim(),
      })
    : undefined;
  const level = graduation.data?.levels.find(
    (l) => l.id === draft.origin.levelId,
  )?.name;
  const slots = scheduleText(t, klass?.schedule);
  return (
    <Card title={t(`${k}modality`)}>
      <Rows
        rows={[
          [
            t(`${k}modality`),
            [klass?.name, slots, unitName].filter(Boolean).join(" · "),
          ],
          [t(`${k}plan`), `${planName} · ${formatMoney(planCents)}`],
          [t(`${k}benefit`), benefit],
          [
            t(`${k}origin`),
            draft.origin.on && level
              ? t(`${k}originValue`, { level, degree: draft.origin.degree })
              : undefined,
          ],
        ]}
      />
    </Card>
  );
}

// Cobranças de uma unidade: mensalidade e taxa da primeira cobrança com o valor por meio, e a segunda cobrança gerada 10 dias antes (RN-MAT-07).
function UnitCharges({
  unit,
  preview,
  showName,
}: {
  unit: PreviewUnit;
  preview: EnrollmentPreview;
  showName: boolean;
}) {
  const { t } = useTranslation();
  const k = "enrollmentWizard.summary.";
  const info = useUnitInfo(unit.unitId);
  const offered = useResource<{ items: { id: string; name: string }[] }>(
    `/units/${unit.unitId}/modalities`,
  );
  const fees =
    info.status === "ready" ? info.data?.settings.feesCents : undefined;
  const methods = (cents: number) =>
    fees?.pix !== undefined && fees.creditCard !== undefined
      ? t(`${k}methods`, {
          pix: formatMoney(cents + fees.pix),
          card: formatMoney(cents + fees.creditCard),
        })
      : undefined;
  const name = (id: string) =>
    offered.data?.items.find((m) => m.id === id)?.name ?? "";
  const mods = preview.modalities.filter((m) => m.unitId === unit.unitId);
  const rows: ChargeRow[] = mods.map((m) => ({
    key: `a-${m.modalityId}`,
    label: `${name(m.modalityId)} · ${monthYear(unit.firstDueOn)}`,
    due: formatDate(unit.firstDueOn),
    cents: m.monthlyCents,
    methods: methods(m.monthlyCents),
  }));
  if (unit.feeExempt)
    rows.push({ key: "fee", label: t(`${k}feeExempt`), due: "—", cents: 0 });
  else if (unit.feeCents > 0)
    rows.push({
      key: "fee",
      label: t(`${k}fee`),
      due: formatDate(unit.firstDueOn),
      cents: unit.feeCents,
      methods: methods(unit.feeCents),
    });
  for (const m of mods) {
    rows.push({
      key: `b-${m.modalityId}`,
      label: `${name(m.modalityId)} · ${monthYear(unit.secondDueOn)}`,
      due: formatDate(unit.secondDueOn),
      cents: m.monthlyCents,
      note: t(`${k}generatedOn`, {
        date: dayMonthBefore(unit.secondDueOn, 10),
      }),
    });
  }
  return (
    <div className="flex flex-col gap-2">
      {showName && <h3 className="text-sm font-medium">{unit.unitName}</h3>}
      <FirstChargeTable rows={rows} withMethods />
    </div>
  );
}

// Etapa 4 (RF-MAT-01, RN-MAT-03): o resumo vem da prévia do servidor, sem gravar nada. Recusa de regra (422) volta para a etapa do campo.
export function StepSummary({
  studentId,
  name,
  detail,
  request,
  modalities,
  payNow,
  onPayNow,
  onInvalid,
}: {
  studentId: string;
  name: string;
  detail: StudentDetail | undefined;
  request: ConclusionRequest;
  modalities: ModalityDraft[];
  payNow: boolean;
  onPayNow: (v: boolean) => void;
  onInvalid: (e: ApiError) => void;
}) {
  const { t } = useTranslation();
  const k = "enrollmentWizard.summary.";
  const [state, setState] = useState<State>({ kind: "loading" });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    previewEnrollment(studentId, request).then(
      (preview) => alive && setState({ kind: "ready", preview }),
      (e) => {
        if (!alive) return;
        if (
          e instanceof ApiError &&
          (e.status === 422 || e.status === 400 || e.status === 409)
        )
          onInvalid(e);
        else
          setState({
            kind:
              e instanceof ApiError && e.status === 403 ? "forbidden" : "error",
          });
      },
    );
    return () => {
      alive = false;
    };
    // O pedido é refeito só quando a pessoa chega à etapa ou tenta de novo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  if (state.kind === "loading") return <LoadingState />;
  if (state.kind === "forbidden") return <ForbiddenState />;
  if (state.kind === "error" || state.kind === "invalid") {
    return (
      <ErrorState
        onRetry={() => {
          setState({ kind: "loading" });
          setTick((n) => n + 1);
        }}
      />
    );
  }
  const { preview } = state;
  const financial = detail?.guardians.find((g) => g.financial);
  const payer = financial ? first(financial.name) : first(name);
  const address = detail
    ? [
        `${detail.street}, ${detail.number}${detail.complement ? `, ${detail.complement}` : ""}`,
        detail.district,
      ].join(" · ")
    : undefined;
  const unitName = (id: string) =>
    preview.units.find((u) => u.unitId === id)?.unitName ?? "";
  return (
    <div className="flex flex-col gap-4">
      {preview.openDebt.count > 0 && (
        <Banner tone="warn">
          {t(`${k}openDebt`, {
            count: preview.openDebt.count,
            value: formatMoney(preview.openDebt.totalCents),
          })}
        </Banner>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t(`${k}student`)}>
          <Rows
            rows={[
              [t(`${k}name`), name],
              [
                t(`${k}birth`),
                detail
                  ? t(`${k}birthValue`, {
                      date: formatDate(detail.birthDate),
                      age: ageOf(detail.birthDate),
                    })
                  : undefined,
              ],
              [t(`${k}address`), address],
              [
                t(`${k}financial`),
                financial
                  ? [
                      financial.name,
                      financial.phone && formatPhoneDisplay(financial.phone),
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : undefined,
              ],
            ]}
          />
        </Card>
        {modalities.map((m, i) => (
          <ModalityCard
            key={m.key}
            draft={m}
            planName={preview.modalities[i]?.planName ?? ""}
            planCents={preview.modalities[i]?.planCents ?? 0}
            unitName={unitName(m.unitId)}
          />
        ))}
      </div>
      <section
        aria-label={t(`${k}charges`)}
        className="flex flex-col gap-3 rounded-lg border p-4"
      >
        {preview.units.map((u) => (
          <UnitCharges
            key={u.unitId}
            unit={u}
            preview={preview}
            showName={preview.units.length > 1}
          />
        ))}
      </section>
      <Card title={t(`${k}term`)}>
        <p className="text-sm">
          {t(`${k}termText`, { who: payer, student: first(name) })}
        </p>
      </Card>
      <div className="sm:hidden">
        <ChoiceCards
          legend={t(`${k}payment`)}
          value={payNow ? "now" : "portal"}
          onChange={(v) => onPayNow(v === "now")}
          options={[
            { value: "now", label: t(`${k}payNow`) },
            {
              value: "portal",
              label: t(
                `${k}${financial ? "payPortalGuardian" : "payPortalStudent"}`,
              ),
              description: t(`${k}inviteGoes`, { who: payer }),
            },
          ]}
        />
      </div>
    </div>
  );
}
