import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatMoney } from "@/components/fields/masks";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { DateField } from "@/components/ui/date-field";
import { Field } from "@/components/ui/field";
import { SegmentedChoice } from "@/components/ui/segmented-choice";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/features/units/Text";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useResource } from "../useStudentRecord";
import { previewEnrollment } from "./api";
import { monthYear } from "./enrollmentFormat";
import { FirstChargeTable, type ChargeRow } from "./FirstChargeTable";
import type { ConclusionRequest, EnrollmentPreview, UnitDraft } from "./types";

export interface UnitInfo {
  name: string;
  settings: {
    dueDays: number[];
    enrollmentFeeEnabled: boolean;
    enrollmentFeeCents: number;
    feesCents?: { pix?: number; creditCard?: number };
  };
}

const ALL_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);
const WAIT_MS = 300;
const BILLING_KEYS = ["dueDay", "feeExemptReason", "secondDueOn"];

export const useUnitInfo = (unitId: string) => useResource<UnitInfo>(`/units/${unitId}`);

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; preview: EnrollmentPreview }
  | { status: "invalid"; fields: Record<string, string>; message: string }
  | { status: "forbidden" }
  | { status: "error" };

// Prévia do servidor (RN-MAT-03, 05, 07) pedida ao entrar na etapa e a cada mudança de dia, taxa ou data, com espera curta para não pedir a cada tecla.
function usePreview(studentId: string, request: ConclusionRequest, enabled: boolean) {
  const [state, setState] = useState<PreviewState>({ status: "idle" });
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(request);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const timer = setTimeout(() => {
      previewEnrollment(studentId, JSON.parse(key) as ConclusionRequest).then(
        (preview) => alive && setState({ status: "ready", preview }),
        (e) => {
          if (!alive) return;
          if (e instanceof ApiError && [400, 409, 422].includes(e.status)) {
            setState({ status: "invalid", fields: Object.fromEntries(e.fields.map((f) => [f.field.split(".").pop()!, f.message])), message: e.message });
          } else setState({ status: e instanceof ApiError && e.status === 403 ? "forbidden" : "error" });
        },
      );
    }, WAIT_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [studentId, key, enabled, tick]);
  return {
    state: enabled ? state : ({ status: "idle" } as PreviewState),
    retry: () => {
      setState({ status: "loading" });
      setTick((n) => n + 1);
    },
  };
}

function UnitBlock({
  unitId,
  name,
  draft,
  inherited,
  errors,
  preview,
  loading,
  onChange,
}: {
  unitId: string;
  name: string;
  draft: UnitDraft;
  inherited?: number;
  errors: Record<string, string>;
  preview: EnrollmentPreview | undefined;
  loading: boolean;
  onChange: (d: UnitDraft) => void;
}) {
  const { t } = useTranslation();
  const k = "enrollmentWizard.billing.";
  const info = useUnitInfo(unitId);
  const offered = useResource<{ items: { id: string; name: string }[] }>(`/units/${unitId}/modalities`);
  // Sem a configuração da unidade (alcance de leitura menor), o servidor decide os dias e a taxa; a prévia mostra o resultado.
  const settings = info.status === "ready" ? info.data?.settings : undefined;
  const days = inherited ? [inherited] : (settings?.dueDays ?? ALL_DAYS);
  const set = (patch: Partial<UnitDraft>) => onChange({ ...draft, ...patch });
  if (info.status === "loading") return <LoadingState />;
  const u = preview?.units.find((x) => x.unitId === unitId);
  const modalityName = (id: string) => offered.data?.items.find((m) => m.id === id)?.name ?? "";
  const rows: ChargeRow[] = [];
  if (u && preview) {
    for (const m of preview.modalities.filter((x) => x.unitId === unitId)) {
      rows.push({ key: `${m.modalityId}-${m.planId}`, label: t(`${k}firstMonth`, { name: modalityName(m.modalityId), month: monthYear(u.firstDueOn) }), due: formatDate(u.firstDueOn), cents: m.monthlyCents });
    }
    if (u.feeExempt) rows.push({ key: "fee", label: t(`${k}feeRow`), badge: t(`${k}exemptBadge`), due: formatDate(u.firstDueOn), struck: settings?.enrollmentFeeCents, cents: 0 });
    else if (u.feeCents > 0) rows.push({ key: "fee", label: t(`${k}feeRow`), due: formatDate(u.firstDueOn), cents: u.feeCents });
  }
  return (
    <section aria-label={name} className="flex flex-col gap-4">
      {info.status === "error" && <ErrorState onRetry={info.reload} />}
      <div className="flex flex-col gap-2">
        <SegmentedChoice
          label={t(`${k}dueDay`)}
          className="flex-wrap self-start"
          options={days.map((d) => ({ value: String(d), label: t(`${k}dayOption`, { day: d }) }))}
          value={inherited ? String(inherited) : draft.dueDay}
          onChange={(v) => set({ dueDay: v })}
        />
        {errors.dueDay && <p className="text-xs text-danger-foreground">{errors.dueDay}</p>}
        <p className="text-sm text-muted-foreground">{inherited ? t(`${k}dueInherited`, { day: inherited }) : t(`${k}dueAll`)}</p>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="font-medium">{t(`${k}firstCharge`)}</h2>
        {u ? (
          <>
            <p className="text-sm text-muted-foreground">{t(`${k}firstRule`, { days: u.toleranceDays })}</p>
            <FirstChargeTable rows={rows} total={u.firstChargeCents} />
          </>
        ) : loading ? (
          <LoadingState />
        ) : (
          <p className="text-sm text-muted-foreground">{t(`${k}pickDay`)}</p>
        )}
      </div>
      {settings?.enrollmentFeeEnabled && (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <Switch
            checked={draft.feeExempt}
            onCheckedChange={(v) => set({ feeExempt: v })}
            label={t(`${k}exempt`)}
            description={t(`${k}feeHelp`, { unit: name, value: formatMoney(settings.enrollmentFeeCents) })}
          />
          {draft.feeExempt && <Text label={t(`${k}exemptReason`)} value={draft.feeExemptReason} onChange={(v) => set({ feeExemptReason: v })} maxLength={200} help={t(`${k}exemptReasonHelp`)} error={errors.feeExemptReason} />}
        </div>
      )}
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="font-medium">{t(`${k}secondCharge`)}</h2>
        {u && <p className="text-sm text-muted-foreground">{t(`${k}secondSuggested`, { date: formatDate(u.suggestedSecondDueOn) })}</p>}
        <Field label={t(`${k}secondDue`)} hint={errors.secondDueOn ? undefined : t(`${k}secondDueHelp`)} error={errors.secondDueOn} className="sm:max-w-xs">
          {(c) => <DateField {...c} value={draft.secondDueOn} onChange={(e) => set({ secondDueOn: e.target.value })} />}
        </Field>
      </div>
    </section>
  );
}

// Etapa 3 (RF-MAT-01, RN-MAT-03, 05, 07): um dia de vencimento por unidade, a primeira cobrança calculada pelo servidor, a taxa com isenção e a segunda cobrança.
export function StepBilling({
  studentId,
  request,
  ready,
  units,
  drafts,
  inherited,
  errors,
  onChange,
}: {
  studentId: string;
  request: ConclusionRequest;
  ready: boolean;
  units: { id: string; name: string }[];
  drafts: Record<string, UnitDraft>;
  inherited: Record<string, number>;
  errors: Record<string, string>;
  onChange: (unitId: string, d: UnitDraft) => void;
}) {
  const { state, retry } = usePreview(studentId, request, ready);
  if (state.status === "forbidden") return <ForbiddenState />;
  const shown = { ...errors, ...(state.status === "invalid" ? state.fields : {}) };
  const loose = state.status === "invalid" && !Object.keys(state.fields).some((f) => BILLING_KEYS.includes(f));
  return (
    <div className="flex flex-col gap-4">
      {state.status === "error" && <ErrorState onRetry={retry} />}
      {loose && <Banner tone="danger">{state.message}</Banner>}
      {units.map((u) => (
        <UnitBlock key={u.id} unitId={u.id} name={u.name} draft={drafts[u.id]} inherited={inherited[u.id]} errors={shown} preview={state.status === "ready" ? state.preview : undefined} loading={ready && (state.status === "idle" || state.status === "loading")} onChange={(d) => onChange(u.id, d)} />
      ))}
    </div>
  );
}
