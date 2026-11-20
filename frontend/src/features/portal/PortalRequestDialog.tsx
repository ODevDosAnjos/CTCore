import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Banner } from "@/components/ui/banner";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { ReasonField } from "@/components/ReasonField";
import { SummaryBox } from "@/components/ui/summary-box";
import { ModalityDialog, PickSelect, ReadOnlyField } from "@/features/students/ModalityPickers";
import { scheduleText } from "@/features/students/modalityDialogSummary";
import type { PortalRequestKind } from "@/features/portal-requests/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { createRequest, type ModalityOption, type OfferOption } from "./usePortalRequests";

const REASONS = ["CITY_CHANGE", "FINANCIAL", "SCHEDULE", "INJURY", "DISSATISFACTION", "OTHER"];
const DAY = 86_400_000;
const k = "portalOwn.dialog.";

type Props = { studentId: string; kind: PortalRequestKind; modalities: ModalityOption[]; offers: OfferOption[]; onClose: () => void; onDone: () => void };

// Uma janela para os quatro tipos de pedido (RF-MAT-04, canvas); o pedido nunca altera a matrícula (RN-MAT-16).
// Com mais de uma modalidade ativa, "Modalidade" é seletor (R9); com encerramento aberto na modalidade, troca de turma e de plano viram só o aviso (RN-MAT-18).
export function PortalRequestDialog({ studentId, kind, modalities, offers, onClose, onDone }: Props) {
  const { t } = useTranslation();
  const [rowId, setRowId] = useState(modalities.length === 1 ? modalities[0].modalityRowId : "");
  const [pick, setPick] = useState("");
  const [unit, setUnit] = useState("");
  const [note, setNote] = useState("");
  const [now] = useState(() => Date.now());
  const mod = modalities.find((m) => m.modalityRowId === rowId);
  const own = kind !== "NEW_MODALITY";
  const blocked = (kind === "CLASS_CHANGE" || kind === "PLAN_CHANGE") && !!mod?.closureRequestedAt;
  const chosen = (m: ModalityOption) => t(`${k}modalityLine`, { modality: m.modality, unit: m.unit });

  const units = [...new Map(offers.map((o) => [o.unitId, { id: o.unitId, name: o.unit }])).values()];
  const ofUnit = offers.filter((o) => o.unitId === unit).map((o) => ({ id: o.modalityId, name: o.modality }));

  const work = () => {
    if (kind === "NEW_MODALITY") return createRequest(studentId, { kind, targetUnitId: unit, targetModalityId: pick, note: note.trim() || undefined });
    const target = { CLASS_CHANGE: { targetClassId: pick }, PLAN_CHANGE: { targetPlanId: pick }, CLOSURE: { reason: pick } }[kind];
    return createRequest(studentId, { kind, modalityRowId: rowId, ...target, note: kind === "PLAN_CHANGE" ? undefined : note.trim() || undefined });
  };

  const modalityField = !own ? null : modalities.length === 1 ? (
    <ReadOnlyField label={t(`${k}modality`)} value={chosen(modalities[0])} />
  ) : (
    <PickSelect label={t(`${k}modality`)} value={rowId} onChange={(v) => { setRowId(v); setPick(""); }} options={modalities.map((m) => ({ id: m.modalityRowId, name: chosen(m) }))} required />
  );
  const message = (error?: string) => <ReasonField label={t(`${k}note`)} value={note} onChange={setNote} optional max={500} error={error} note={kind === "CLASS_CHANGE" ? t(`${k}CLASS_CHANGE.help`) : undefined} />;

  let body: (errors: Record<string, string>) => ReactNode;
  let ready = !!pick && (own ? !!mod : !!unit);
  let summary: string[] = [];
  if (blocked) {
    ready = false;
    body = () => (
      <>
        <Banner tone="warn">{t(`${k}blocked.text`, { modality: mod!.modality })}</Banner>
        {modalityField}
      </>
    );
  } else if (kind === "CLASS_CHANGE") {
    body = (e) => (
      <>
        {modalityField}
        {mod && (
          <PickSelect
            label={t(`${k}CLASS_CHANGE.field`)}
            value={pick}
            onChange={setPick}
            required
            options={mod.classes.map((c) => ({ id: c.id, name: t(`${k}CLASS_CHANGE.option`, { name: c.name, schedule: scheduleText(t, c.schedule), teacher: c.teacher }) }))}
            error={e.targetClassId}
          />
        )}
        {message(e.note)}
      </>
    );
  } else if (kind === "PLAN_CHANGE") {
    body = (e) => (
      <>
        {modalityField}
        {mod && (
          <>
            <ReadOnlyField label={t(`${k}PLAN_CHANGE.current`)} value={mod.currentPlan.name} />
            <div>
              <ChoiceCards
                legend={t(`${k}PLAN_CHANGE.field`)}
                required
                value={pick}
                onChange={setPick}
                options={mod.plans.map((p) => ({ value: p.id, label: p.name, aside: p.available ? formatCurrency(p.valueCents) : t("format.empty"), description: p.available ? undefined : t(`${k}PLAN_CHANGE.unavailable`), disabled: !p.available }))}
              />
              {e.targetPlanId && <p className="text-sm text-danger-foreground">{e.targetPlanId}</p>}
            </div>
            <p className="text-xs text-muted-foreground">{t(`${k}PLAN_CHANGE.help`)}</p>
          </>
        )}
      </>
    );
  } else if (kind === "NEW_MODALITY") {
    summary = ["choose", "confirm", "free"].map((x) => t(`${k}NEW_MODALITY.summary.${x}`));
    body = (e) => (
      <>
        <PickSelect label={t(`${k}NEW_MODALITY.unit`)} value={unit} onChange={(v) => { setUnit(v); setPick(""); }} options={units} required error={e.targetUnitId} />
        <div className="flex flex-col gap-1">
          <PickSelect label={t(`${k}NEW_MODALITY.field`)} value={pick} onChange={setPick} options={ofUnit} required error={e.targetModalityId} />
          <p className="text-xs text-muted-foreground">{t(`${k}NEW_MODALITY.help`)}</p>
        </div>
        {message(e.note)}
      </>
    );
  } else {
    const others = [...new Set(modalities.filter((m) => m.modalityRowId !== rowId).map((m) => m.modality))];
    summary = mod
      ? [
          t(`${k}CLOSURE.summary.now`, { modality: mod.modality, today: formatDate(now) }),
          t(`${k}CLOSURE.summary.until`, { until: formatDate(now + 7 * DAY).slice(0, 5) }),
          t(`${k}CLOSURE.summary.charges`),
          ...(others.length ? [t(`${k}CLOSURE.summary.others`, { count: others.length, names: new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" }).format(others) })] : []),
        ]
      : [];
    body = (e) => (
      <>
        {modalityField}
        <PickSelect label={t(`${k}CLOSURE.field`)} value={pick} onChange={setPick} required options={REASONS.map((r) => ({ id: r, name: t(`students.record.enrollment.end.reasons.${r}`) }))} error={e.reason} />
        <ReasonField label={t(`${k}CLOSURE.more`)} value={note} onChange={setNote} optional max={500} error={e.note} />
      </>
    );
  }

  return (
    <ModalityDialog
      size="sm"
      fullOnMobile
      scrim="canvas"
      title={t(`${k}${kind}.title`)}
      state="ready"
      cancelLabel={blocked ? t(`${k}blocked.close`) : kind === "CLOSURE" ? t(`${k}CLOSURE.back`) : t(`${k}cancel`)}
      submitLabel={t(`${k}submit`)}
      submitVariant={kind === "CLOSURE" ? "dangerSolid" : "primary"}
      noSubmit={blocked}
      canSubmit={ready}
      work={work}
      onClose={onClose}
      onDone={onDone}
      errorPrefix="portalOwn.errors."
    >
      {(errors) => (
        <>
          {body(errors)}
          {summary.length > 0 && (own ? !!mod : true) && <SummaryBox label={t("students.record.enrollment.summaryLabel")} items={summary} />}
        </>
      )}
    </ModalityDialog>
  );
}
