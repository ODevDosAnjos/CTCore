import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MoneyField } from "@/components/fields/fields";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { ModalityDot } from "@/components/ui/modality-dot";
import { Text } from "@/features/units/Text";
import { ApiError } from "@/lib/api";
import { OtherClasses, PickSelect, useClassChoices, usePlanChoices, type Choice } from "../ModalityPickers";
import { useResource } from "../useStudentRecord";
import { ClassWarnings } from "./ClassWarnings";
import { uploadOriginProof } from "./api";
import { monthlyText } from "./modalityMonthly";
import { emptyOrigin, MAX_ACTIVE, newModality } from "./request";
import type { ModalityDraft } from "./types";

interface Level extends Choice {
  maxDegree: number;
}
interface Graduation {
  enabled: boolean;
  requireOriginProof: boolean;
  levels: Level[];
}

const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_PROOF = 5 * 1024 * 1024;

// Bloco da graduação de origem (RN-GRA-09, RN-MAT-09): só aparece em modalidade com graduação ligada; o comprovante é enviado antes (D8).
function OriginBlock({ studentId, draft, graduation, onChange }: { studentId: string; draft: ModalityDraft; graduation: Graduation; onChange: (m: ModalityDraft) => void }) {
  const { t } = useTranslation();
  const k = "enrollmentWizard.modalities.origin.";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const o = draft.origin;
  const setOrigin = (patch: Partial<ModalityDraft["origin"]>) => onChange({ ...draft, origin: { ...o, ...patch } });
  const level = graduation.levels.find((l) => l.id === o.levelId);

  async function send(file: File | undefined) {
    if (!file) return;
    if (!PROOF_TYPES.includes(file.type) || file.size > MAX_PROOF) {
      setError(t(`${k}fileInvalid`));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const stored = await uploadOriginProof(studentId, file);
      setOrigin({ proofKey: stored.proofKey, proofName: file.name });
    } catch (e) {
      setError(e instanceof ApiError && e.status === 422 ? (e.fields[0]?.message ?? t(`${k}fileInvalid`)) : t(`${k}uploadError`));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <PickSelect
        label={t(`${k}title`)}
        blank={t(`${k}none`)}
        value={o.on ? o.levelId : ""}
        onChange={(v) => setOrigin({ on: v !== "", levelId: v, degree: "0", proofRequired: graduation.requireOriginProof })}
        options={graduation.levels}
      />
      {o.on && (
        <>
          <p className="text-xs text-muted-foreground">{t("enrollmentWizard.modalities.originHint")}</p>
          <PickSelect
            label={t(`${k}degree`)}
            blank="0"
            value={o.degree}
            onChange={(v) => setOrigin({ degree: v })}
            options={Array.from({ length: (level?.maxDegree ?? 0) + 1 }, (_, i) => ({ id: String(i), name: String(i) }))}
          />
          <Text label={t(`${k}achievedOn`)} type="date" value={o.achievedOn} onChange={(v) => setOrigin({ achievedOn: v })} />
          <div>
            <label className="block text-sm font-medium" htmlFor={`proof-${draft.key}`}>
              {graduation.requireOriginProof ? t(`${k}proofRequired`) : t(`${k}proofOptional`)}
            </label>
            <input id={`proof-${draft.key}`} type="file" accept={PROOF_TYPES.join(",")} className="min-h-11 w-full" disabled={busy} onChange={(e) => void send(e.target.files?.[0])} />
            {o.proofName && <p className="text-sm">{t(`${k}proofSent`, { name: o.proofName })}</p>}
            {graduation.requireOriginProof && !o.proofKey && <p className="text-sm text-muted-foreground">{t(`${k}proofNeeded`)}</p>}
            {error && (
              <Banner tone="danger">
                {error}
              </Banner>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BenefitBlock({ draft, onChange }: { draft: ModalityDraft; onChange: (m: ModalityDraft) => void }) {
  const { t } = useTranslation();
  const k = "enrollmentWizard.modalities.benefit.";
  const b = draft.benefit;
  const set = (patch: Partial<ModalityDraft["benefit"]>) => onChange({ ...draft, benefit: { ...b, ...patch } });
  return (
    <div className="flex flex-col gap-3">
      <PickSelect
        label={t(`${k}title`)}
        blank={t(`${k}none`)}
        value={b.on ? b.type : ""}
        onChange={(v) => set({ on: v !== "", type: v === "AMOUNT" ? "AMOUNT" : "PERCENT" })}
        options={[
          { id: "PERCENT", name: t(`${k}percent`) },
          { id: "AMOUNT", name: t(`${k}amount`) },
        ]}
      />
      {b.on && (
        <>
          {b.type === "PERCENT" ? (
            <Text label={t(`${k}percentValue`)} value={b.percent} inputMode="numeric" onChange={(v) => set({ percent: v })} />
          ) : (
            <MoneyField label={t(`${k}amountValue`)} onChange={(v) => set({ amount: v })} />
          )}
          <Text label={t(`${k}reason`)} value={b.reason} onChange={(v) => set({ reason: v })} maxLength={200} />
          <Text label={t(`${k}decidedBy`)} value={b.decidedBy} onChange={(v) => set({ decidedBy: v })} maxLength={80} />
          <Text label={t(`${k}validUntil`)} type="date" value={b.validUntil} onChange={(v) => set({ validUntil: v })} />
        </>
      )}
    </div>
  );
}

function ModalityCard({
  studentId,
  index,
  draft,
  units,
  taken,
  errors,
  onChange,
  onRemove,
}: {
  studentId: string;
  index: number;
  draft: ModalityDraft;
  units: Choice[];
  taken: Set<string>;
  errors: Record<string, string>;
  onChange: (m: ModalityDraft) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const k = "enrollmentWizard.modalities.";
  const offered = useResource<{ items: (Choice & { offered: boolean })[] }>(draft.unitId ? `/units/${draft.unitId}/modalities` : null);
  const classes = useClassChoices(draft.unitId || null, draft.modalityId);
  const plans = usePlanChoices(draft.unitId || null, draft.modalityId);
  const graduation = useResource<Graduation>(draft.modalityId ? `/modalities/${draft.modalityId}/graduation` : null);
  const options = (offered.data?.items ?? []).filter((m) => m.offered && (!taken.has(m.id) || m.id === draft.modalityId));
  const choiceState = draft.modalityId ? [classes, plans] : [];
  const failed = [offered, ...choiceState].find((r) => r.status === "error" || r.status === "notFound");
  const denied = [offered, ...choiceState].some((r) => r.status === "forbidden");
  const loading = [offered, ...choiceState].some((r) => r.status === "loading");
  const set = (patch: Partial<ModalityDraft>) => onChange({ ...draft, ...patch });
  const modalityName = options.find((m) => m.id === draft.modalityId)?.name;
  const plan = plans.data?.items.find((p) => p.id === draft.planId);
  const classList = classes.data?.items ?? [];
  const ready = Boolean(draft.modalityId) && classes.status === "ready" && classList.length > 0;
  const hasPlans = Boolean(draft.modalityId) && plans.status === "ready" && (plans.data?.items.length ?? 0) > 0;
  return (
    <li className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">{modalityName ? <ModalityDot name={modalityName} /> : t(`${k}item`, { n: index + 1 })}</h2>
        <Button type="button" variant="ghost" size="icon" aria-label={t(`${k}remove`)} onClick={onRemove}>
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PickSelect label={t(`${k}unit`)} value={draft.unitId} onChange={(v) => set({ unitId: v, modalityId: "", primaryClassId: "", otherClassIds: [], planId: "" })} options={units} />
        {draft.unitId && options.length > 0 && (
          <PickSelect
            label={t(`${k}modality`)}
            value={draft.modalityId}
            onChange={(v) => set({ modalityId: v, primaryClassId: "", otherClassIds: [], planId: "", origin: emptyOrigin() })}
            options={options}
            error={errors.modalityId}
          />
        )}
        {ready && (
          <>
            <PickSelect label={t(`${k}class`)} value={draft.primaryClassId} onChange={(v) => set({ primaryClassId: v, otherClassIds: draft.otherClassIds.filter((x) => x !== v) })} options={classList} error={errors.primaryClassId} />
            <OtherClasses popover options={classList} primary={draft.primaryClassId} value={draft.otherClassIds} onChange={(v) => set({ otherClassIds: v })} error={errors.otherClassIds} />
          </>
        )}
      </div>
      {denied && <ForbiddenState />}
      {failed && <ErrorState onRetry={() => [offered, classes, plans].forEach((r) => r.reload())} />}
      {loading && <LoadingState />}
      {draft.unitId && offered.status === "ready" && options.length === 0 && <p className="text-sm text-muted-foreground">{t(`${k}noModality`)}</p>}
      {draft.modalityId && classes.status === "ready" && classList.length === 0 && <p className="text-sm text-muted-foreground">{t(`${k}noClass`)}</p>}
      {draft.modalityId && plans.status === "ready" && !hasPlans && <p className="text-sm text-muted-foreground">{t(`${k}noPlan`)}</p>}
      {ready &&
        [draft.primaryClassId, ...draft.otherClassIds].filter(Boolean).map((id) => (
          <ClassWarnings key={id} studentId={studentId} classId={id} className={classList.find((c) => c.id === id)?.name ?? ""} />
        ))}
      {hasPlans && (
        <div className="grid gap-3 sm:grid-cols-2">
          <PickSelect label={t(`${k}plan`)} value={draft.planId} onChange={(v) => set({ planId: v })} options={plans.data!.items} error={errors.planId} />
          <BenefitBlock draft={draft} onChange={onChange} />
        </div>
      )}
      {draft.modalityId && graduation.status === "ready" && graduation.data?.enabled && (
        <OriginBlock studentId={studentId} draft={draft} graduation={graduation.data} onChange={onChange} />
      )}
      {plan?.valueCents !== undefined && <p className="text-sm font-medium">{monthlyText(t, plan.valueCents, draft.benefit)}</p>}
    </li>
  );
}

// Etapa 2 (RF-MAT-01, RN-MAT-02, RN-MAT-09): uma ou mais modalidades, até 10 ativas no total.
export function StepModalities({
  studentId,
  activeCount,
  takenModalityIds,
  modalities,
  errors,
  onChange,
}: {
  studentId: string;
  activeCount: number;
  takenModalityIds: Set<string>;
  modalities: ModalityDraft[];
  errors: Record<string, string>;
  onChange: (m: ModalityDraft[]) => void;
}) {
  const { t } = useTranslation();
  const k = "enrollmentWizard.modalities.";
  const units = useResource<{ units: Choice[] }>("/units/reachable");
  if (units.status === "loading" || units.status === "idle") return <LoadingState />;
  if (units.status === "forbidden") return <ForbiddenState />;
  if (units.status === "error" || units.status === "notFound") return <ErrorState onRetry={units.reload} />;
  if ((units.data?.units.length ?? 0) === 0) return <EmptyState title={t(`${k}emptyTitle`)} text={t(`${k}emptyText`)} />;
  const full = activeCount + modalities.length >= MAX_ACTIVE;
  const taken = new Set([...takenModalityIds, ...modalities.map((m) => m.modalityId).filter(Boolean)]);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t(`${k}intro`, { remaining: MAX_ACTIVE - activeCount })}</p>
      {errors.modalities && (
        <Banner tone="danger">
          {errors.modalities}
        </Banner>
      )}
      <ul className="flex flex-col gap-3">
        {modalities.map((m, i) => (
          <ModalityCard
            key={m.key}
            studentId={studentId}
            index={i}
            draft={m}
            units={units.data!.units}
            taken={new Set([...taken].filter((id) => id !== m.modalityId))}
            errors={errors}
            onChange={(next) => onChange(modalities.map((x) => (x.key === m.key ? next : x)))}
            onRemove={() => onChange(modalities.filter((x) => x.key !== m.key))}
          />
        ))}
      </ul>
      <Button type="button" variant="outline" className="min-h-11 self-start" disabled={full} onClick={() => onChange([...modalities, newModality()])}>
        {t(`${k}add`)}
      </Button>
      {full && <p className="text-sm text-muted-foreground">{t(`${k}limit`, { max: MAX_ACTIVE })}</p>}
    </div>
  );
}
