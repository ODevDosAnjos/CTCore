import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { todayIso } from "./agendaDates";
import { createLesson, useActiveClasses } from "./useLessonActions";
import { Banner } from "@/components/ui/banner";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { ComingSoon } from "@/components/ui/coming-soon";
import { DateField } from "@/components/ui/date-field";
import { Field, Input, Select } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import type { LessonDetail } from "./useLesson";

interface Choice {
  id: string;
  name: string;
}

// RF-AGE-04: aula avulsa (sem turma). Modalidades e professores vêm da Agenda; o servidor reconfere tudo (RN-PRO-06, RN-AGE-07, RN-AGE-12).
export function NewLessonDialog({ unit, modalities, teachers, onClose, onSaved }: { unit: Choice; modalities: Choice[]; teachers: Choice[]; onClose: () => void; onSaved: (created: LessonDetail, notify: boolean) => void }) {
  const { t } = useTranslation();
  const classes = useActiveClasses(unit.id);
  const [title, setTitle] = useState("");
  const [modalityId, setModalityId] = useState("");
  const [date, setDate] = useState(todayIso);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [onlyClass, setOnlyClass] = useState(false);
  const [classId, setClassId] = useState("");
  const [notify, setNotify] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const formId = useId();
  const empty = modalities.length === 0 || teachers.length === 0;

  async function submit() {
    const found: Record<string, string> = {};
    if (!title.trim()) found.title = t("agenda.new.titleRequired");
    if (!modalityId) found.modalityId = t("agenda.new.modalityRequired");
    if (!teacherId) found.teacherId = t("agenda.new.teacherRequired");
    if (!date) found.date = t("agenda.edit.dateRequired");
    if (!from || !to || to <= from) found.endsAt = t("agenda.edit.timeOrder");
    if (onlyClass && !classId) found.visibilityClassId = t("agenda.new.classRequired");
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const created = await createLesson({ unitId: unit.id, title: title.trim(), modalityId, date, startsAt: from, endsAt: to, teacherId, ...(onlyClass ? { visibilityClassId: classId } : {}) });
      onClose();
      onSaved(created, notify);
    } catch (e) {
      const next: Record<string, string> = {};
      if (e instanceof ApiError && e.fields.length) for (const f of e.fields) next[f.field] = f.message;
      else next.form = t(`agenda.new.errors.${e instanceof ApiError && [403, 404, 422].includes(e.status) ? e.status : "generic"}`);
      setErrors(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      size="md"
      fullOnMobile
      onOpenChange={(o) => !o && !busy && onClose()}
      title={t("agenda.new.title")}
      footer={
        !empty && classes.status === "ready" ? (
          <>
            <Button type="button" variant="outline" className="min-h-11" onClick={onClose} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={formId} className="min-h-11" disabled={busy}>
              {busy ? t("agenda.new.saving") : t("agenda.new.save")}
            </Button>
          </>
        ) : undefined
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">{unit.name}</p>
      {empty && <EmptyState title={t("agenda.new.emptyTitle")} text={t("agenda.new.emptyText")} />}
      {!empty && classes.status === "loading" && <LoadingState />}
      {!empty && classes.status === "error" && <ErrorState onRetry={classes.retry} />}
      {!empty && classes.status === "ready" && (
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
          <Field label={t("agenda.new.lessonTitle")} required error={errors.title}>
            {(c) => <Input {...c} className="min-h-11" value={title} maxLength={80} autoComplete="off" onChange={(e) => setTitle(e.target.value)} />}
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Pick label={t("agenda.new.modality")} value={modalityId} onChange={setModalityId} options={modalities} error={errors.modalityId} />
            <Pick label={t("agenda.new.teacher")} value={teacherId} onChange={setTeacherId} options={teachers} error={errors.teacherId} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label={t("agenda.edit.date")} error={errors.date}>
              {(c) => <DateField {...c} value={date} onChange={(e) => setDate(e.target.value)} className="min-h-11" />}
            </Field>
            <Field label={t("agenda.edit.startsAt")} error={errors.startsAt}>
              {(c) => <Input {...c} type="time" value={from} onChange={(e) => setFrom(e.target.value)} className="min-h-11" />}
            </Field>
            <Field label={t("agenda.edit.endsAt")} error={errors.endsAt}>
              {(c) => <Input {...c} type="time" value={to} onChange={(e) => setTo(e.target.value)} className="min-h-11" />}
            </Field>
          </div>
          <ChoiceCards
            legend={t("agenda.new.visibility")}
            value={onlyClass ? "CLASS" : "ALL"}
            onChange={(v) => setOnlyClass(v === "CLASS")}
            options={[
              ...(classes.classes.length > 0 ? [{ value: "CLASS", label: t("agenda.new.visibilityClass") }] : []),
              { value: "ALL", label: t("agenda.new.visibilityAll"), description: t("agenda.new.visibilityAllHelp", { unit: unit.name }) },
            ]}
          />
          {onlyClass && <Pick label={t("agenda.new.classPick")} value={classId} onChange={setClassId} options={classes.classes} error={errors.visibilityClassId} />}
          <div>
            <ComingSoon variant="button" label={t("agenda.new.note")} />
          </div>
          <Switch checked={notify} onCheckedChange={setNotify} label={t("agenda.new.notify")} description={t("agenda.new.notifyHelp")} />
          {errors.form && <Banner tone="danger">{errors.form}</Banner>}
        </form>
      )}
    </Modal>
  );
}

function Pick({ label, value, onChange, options, error }: { label: string; value: string; onChange: (v: string) => void; options: Choice[]; error?: string }) {
  const { t } = useTranslation();
  return (
    <Field label={label} error={error}>
      {(c) => (
        <Select {...c} className="min-h-11" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{t("agenda.new.choose")}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}
