import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { br, brShort, todayIso } from "@/features/agenda/agendaDates";
import { useActiveClasses } from "@/features/agenda/useLessonActions";
import { ApiError } from "@/lib/api";
import { createDay, updateDay, usePreview, type Choice, type NoClassDayItem, type NoticeMode, type Suggestion } from "./useNoClassDays";
import { Banner } from "@/components/ui/banner";
import { Checkbox } from "@/components/ui/checkbox";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { DateField } from "@/components/ui/date-field";
import { Field } from "@/components/ui/field";
import { ReasonField } from "@/components/ReasonField";

const MODES: NoticeMode[] = ["NOW", "SCHEDULED", "NONE"];
const FIELDS = ["unitIds", "startsOn", "endsOn", "reason", "classIds", "notice"];

// ISO do servidor (UTC) para o valor de <Input type="datetime-local"> no fuso do navegador.
const localInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// RF-AGE-05: novo dia sem aula (ou sugestão confirmada) e edição. Só o Coordenador escolhe várias unidades; turmas só com uma unidade. O servidor reconfere tudo.
export function NoClassDayDialog({
  units,
  unit,
  multi,
  item,
  suggestion,
  onClose,
  onSaved,
}: {
  units: Choice[];
  unit: Choice;
  multi: boolean;
  item?: NoClassDayItem;
  suggestion?: Suggestion;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [unitIds, setUnitIds] = useState<string[]>([item?.unit.id ?? unit.id]);
  const [startsOn, setStartsOn] = useState(item?.startsOn ?? suggestion?.date ?? todayIso());
  const [endsOn, setEndsOn] = useState(item && item.endsOn !== item.startsOn ? item.endsOn : "");
  const [reason, setReason] = useState(item?.reason ?? (suggestion ? t(`noClassDays.holidays.${suggestion.code}`) : ""));
  const [onlySome, setOnlySome] = useState(!!item && !item.allClasses);
  const [classIds, setClassIds] = useState<string[]>(item?.classes.map((c) => c.id) ?? []);
  const [mode, setMode] = useState<NoticeMode>(item?.notice.mode ?? "NONE");
  const [sendAt, setSendAt] = useState(localInput(item?.notice.sendAt ?? null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const formId = useId();
  const endDate = endsOn || startsOn;
  const single = unitIds.length === 1;
  const classes = useActiveClasses(unitIds[0] ?? unit.id);
  const chosenClasses = single && onlySome ? classIds : [];
  const preview = usePreview(unitIds, startsOn, endDate, chosenClasses);

  function toggleUnit(id: string, on: boolean) {
    const next = on ? [...unitIds, id] : unitIds.filter((u) => u !== id);
    setUnitIds(next);
    if (next.length !== 1) {
      setOnlySome(false);
      setClassIds([]);
    }
  }

  async function submit() {
    const found: Record<string, string> = {};
    if (unitIds.length === 0) found.unitIds = t("noClassDays.dialog.unitsRequired");
    if (!startsOn) found.startsOn = t("noClassDays.dialog.dateRequired");
    if (endsOn && endsOn < startsOn) found.endsOn = t("noClassDays.dialog.endRequired");
    if (!reason.trim() || reason.trim().length > 120) found.reason = t("noClassDays.dialog.reasonRequired");
    if (single && onlySome && classIds.length === 0) found.classIds = t("noClassDays.dialog.classesRequired");
    if (mode === "SCHEDULED" && (!sendAt || Number.isNaN(new Date(sendAt).getTime()))) found.notice = t("noClassDays.dialog.sendAtRequired");
    setErrors(found);
    if (Object.keys(found).length) return;
    const body = {
      unitIds,
      startsOn,
      endsOn: endDate,
      reason: reason.trim(),
      ...(suggestion || item?.origin === "HOLIDAY" ? { holiday: true } : {}),
      classIds: chosenClasses,
      notice: { mode, ...(mode === "SCHEDULED" ? { sendAt: new Date(sendAt).toISOString() } : {}) },
    };
    setBusy(true);
    try {
      if (item) await updateDay(item.id, body);
      else await createDay(body);
      onClose();
      onSaved();
    } catch (e) {
      const next: Record<string, string> = {};
      if (e instanceof ApiError) for (const f of e.fields) next[f.field] = f.message;
      if (!Object.keys(next).some((k) => FIELDS.includes(k))) next.form = t(`noClassDays.dialog.errors.${e instanceof ApiError && [400, 403, 404, 409, 422].includes(e.status) ? e.status : "generic"}`);
      setErrors(next);
    } finally {
      setBusy(false);
    }
  }

  const submitLabel = busy ? t("noClassDays.dialog.saving") : t(item ? "noClassDays.dialog.saveEdit" : "noClassDays.dialog.save");
  const lessonCount = preview.data?.units.reduce((n, u) => n + u.lessons.length, 0) ?? 0;
  const [h = "", m = ""] = sendAt.slice(11).split(":");
  const scheduledText = sendAt ? t("noClassDays.dialog.scheduledAt", { date: br(sendAt.slice(0, 10)), time: m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}` }) : undefined;

  const showUnits = multi && !item && units.length > 1;

  return (
    <Modal
      open
      size="md"
      scrim="canvas"
      fullOnMobile
      onOpenChange={(o) => !o && !busy && onClose()}
      title={t(item ? "noClassDays.dialog.titleEdit" : "noClassDays.dialog.titleNew")}
      footer={
        <>
          <Button type="button" variant="secondary" className="min-h-11" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={formId} className="min-h-11" disabled={busy}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        className="flex flex-col gap-4"
        aria-busy={busy}
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void submit();
        }}
      >
        {!showUnits && <p className="text-sm text-muted-foreground">{t("noClassDays.dialog.unit", { name: item?.unit.name ?? unit.name })}</p>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("noClassDays.dialog.startsOn")} required error={errors.startsOn}>
            {(c) => <DateField {...c} className="min-h-11" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />}
          </Field>
          <Field label={t("noClassDays.dialog.endsOn")} error={errors.endsOn}>
            {(c) => <DateField {...c} className="min-h-11" value={endsOn} min={startsOn || undefined} onChange={(e) => setEndsOn(e.target.value)} />}
          </Field>
        </div>
        <ReasonField rows={1} label={t("noClassDays.dialog.reason")} value={reason} onChange={setReason} max={120} error={errors.reason} />
        <div className="flex flex-col gap-2">
          {single ? (
            <>
              <ChoiceCards
                legend={t("noClassDays.dialog.classes")}
                columns={2}
                value={onlySome ? "SOME" : "ALL"}
                onChange={(v) => setOnlySome(v === "SOME")}
                options={[
                  { value: "ALL", label: t("noClassDays.dialog.classesAll") },
                  ...(classes.classes.length > 0 ? [{ value: "SOME", label: t("noClassDays.dialog.classesSome") }] : []),
                ]}
              />
              {onlySome &&
                classes.classes.map((c) => (
                  <Checkbox
                    key={c.id}
                    label={c.name}
                    className="ml-2"
                    checked={classIds.includes(c.id)}
                    onChange={(e) => setClassIds(e.target.checked ? [...classIds, c.id] : classIds.filter((x) => x !== c.id))}
                  />
                ))}
            </>
          ) : (
            <>
              <span className="text-sm font-medium">{t("noClassDays.dialog.classes")}</span>
              <p className="text-sm text-muted-foreground">{t("noClassDays.dialog.classesOneUnit")}</p>
            </>
          )}
          <Err text={errors.classIds} />
        </div>
        {showUnits && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">{t("noClassDays.dialog.units")}</legend>
            <div className="flex flex-wrap gap-2">
              {units.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  aria-pressed={unitIds.includes(u.id)}
                  onClick={() => toggleUnit(u.id, !unitIds.includes(u.id))}
                  className="min-h-11 rounded-full border border-input bg-card px-4 text-sm aria-pressed:border-brand aria-pressed:bg-acc focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {u.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t("noClassDays.dialog.unitsHelp")}</p>
            <Err text={errors.unitIds} />
          </fieldset>
        )}
        <section aria-live="polite" aria-labelledby={`${formId}-previa`} className="flex flex-col gap-1 rounded-md bg-surface-soft p-3 text-sm">
          <h3 id={`${formId}-previa`} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("noClassDays.dialog.preview")}
          </h3>
          {preview.status === "loading" && <p className="text-muted-foreground">{t("noClassDays.dialog.previewLoading")}</p>}
          {preview.status === "error" && (
            <Banner tone="danger">
              {t("noClassDays.dialog.previewError")}{" "}
              <button type="button" className="min-h-11 underline" onClick={preview.retry}>
                {t("noClassDays.dialog.previewRetry")}
              </button>
            </Banner>
          )}
          {preview.status === "ready" && (
            <>
              <p>{t("noClassDays.dialog.previewCount", { count: lessonCount, from: brShort(startsOn), to: brShort(endDate) })}</p>
              <p>{t("noClassDays.dialog.previewTrials")}</p>
              <p>{t("noClassDays.dialog.fee")}</p>
            </>
          )}
        </section>
        <div className="flex flex-col gap-2">
          <ChoiceCards
            legend={t("noClassDays.dialog.noticeLegend")}
            value={mode}
            onChange={(v) => setMode(v as NoticeMode)}
            options={MODES.map((m) => ({ value: m, label: t(`noClassDays.dialog.notices.${m}`), ...(m === "SCHEDULED" && scheduledText ? { description: scheduledText } : {}) }))}
          />
          {mode === "SCHEDULED" && (
            <Field label={t("noClassDays.dialog.sendAt")} error={errors.notice}>
              {(c) => <DateField {...c} type="datetime-local" className="min-h-11" value={sendAt} onChange={(e) => setSendAt(e.target.value)} />}
            </Field>
          )}
          {mode !== "SCHEDULED" && <Err text={errors.notice} />}
          <p className="text-xs text-muted-foreground">{t("noClassDays.dialog.noticeHelp")}</p>
        </div>
        <Err text={errors.form} />
      </form>
    </Modal>
  );
}

function Err({ text }: { text?: string }) {
  return text ? (
    <Banner tone="danger">
      {text}
    </Banner>
  ) : null;
}
