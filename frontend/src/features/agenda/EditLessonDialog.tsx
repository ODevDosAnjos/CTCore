import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { ComingSoon } from "@/components/ui/coming-soon";
import { DateField } from "@/components/ui/date-field";
import { Field, Input, Select } from "@/components/ui/field";
import { SummaryBox } from "@/components/ui/summary-box";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api";
import { br, weekday } from "./agendaDates";
import { LessonSummaryCard } from "./LessonSummaryCard";
import type { LessonDetail } from "./useLesson";
import { lessonName } from "./LessonCard";
import { editLesson, useUnitTeachers } from "./useLessonActions";

/** O que a edição mudou, para o comunicado pronto (R10): "Troca de professor" ou "Alteração de horário". */
export interface EditSaved {
  teacherChanged: boolean;
  timeChanged: boolean;
  notify: boolean;
  /** Data e horário gravados, para o texto do comunicado. */
  date: string;
  startsAt: string;
}

// RF-AGE-03: editar data, horário e professor; esta aula ou esta e as seguintes. O servidor reconfere tudo (RN-AGE-04, RN-AGE-08). Aula concluída tem janela própria (CorrectTeacherDialog).
export function EditLessonDialog({ lesson, onClose, onSaved }: { lesson: LessonDetail | null; onClose: () => void; onSaved: (info: EditSaved) => void }) {
  if (!lesson) return null;
  return <Body key={lesson.id} lesson={lesson} onClose={onClose} onSaved={onSaved} />;
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

function Body({ lesson, onClose, onSaved }: { lesson: LessonDetail; onClose: () => void; onSaved: (info: EditSaved) => void }) {
  const { t } = useTranslation();
  const formId = useId();
  const options = useUnitTeachers(lesson.unit.id, lesson.date);
  const [scope, setScope] = useState<"THIS" | "FOLLOWING">("THIS");
  const [date, setDate] = useState(lesson.date);
  const [from, setFrom] = useState(lesson.startsAt);
  const [to, setTo] = useState(lesson.endsAt);
  const [teacherId, setTeacherId] = useState(lesson.teacher.id);
  const [notify, setNotify] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const teachers = options.teachers.some((x) => x.id === lesson.teacher.id) ? options.teachers : [lesson.teacher, ...options.teachers];
  const following = scope === "FOLLOWING";
  const shift = date ? Math.abs(daysBetween(lesson.date, date)) : 0;
  const day = t(`agenda.weekdaysLong.${weekday(lesson.date)}`).split("-")[0];
  const card = t("agenda.edit.summary", { modality: lesson.modality.name, name: lessonName(lesson), day, from: lesson.startsAt, to: lesson.endsAt, unit: lesson.unit.name });
  const summary = [
    shift > 0 ? t("agenda.edit.shift", { count: shift }) : t("agenda.edit.shiftNone"),
    t("agenda.edit.reach", { count: lesson.followingCount, until: lesson.followingUntil ? br(lesson.followingUntil).slice(0, 5) : "" }),
    ...(teacherId !== lesson.teacher.id ? [t("agenda.edit.substitution")] : []),
  ];

  async function submit() {
    const found: Record<string, string> = {};
    if (!date) found.date = t("agenda.edit.dateRequired");
    if (!from || !to || to <= from) found.endsAt = t("agenda.edit.timeOrder");
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await editLesson(lesson.id, { scope, date, startsAt: from, endsAt: to, teacherId });
      onClose();
      onSaved({ teacherChanged: teacherId !== lesson.teacher.id, timeChanged: date !== lesson.date || from !== lesson.startsAt || to !== lesson.endsAt, notify, date, startsAt: from });
    } catch (e) {
      const next: Record<string, string> = {};
      if (e instanceof ApiError && e.fields.length) for (const f of e.fields) next[f.field] = f.message;
      else next.form = t(`agenda.edit.errors.${e instanceof ApiError && [403, 404, 409, 422].includes(e.status) ? e.status : "generic"}`);
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
      title={t("agenda.edit.title")}
      footer={
        options.status === "ready" && (
          <>
            <Button type="button" variant="outline" className="min-h-11" onClick={onClose} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={formId} className="min-h-11" disabled={busy}>
              {busy ? t("agenda.edit.saving") : following && lesson.followingCount > 1 ? t("agenda.edit.saveFollowing", { count: lesson.followingCount }) : t("agenda.edit.save")}
            </Button>
          </>
        )
      }
    >
      {options.status === "loading" && <LoadingState />}
      {options.status === "forbidden" && <ForbiddenState />}
      {options.status === "error" && <ErrorState onRetry={options.retry} />}
      {options.status === "ready" && (
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
          <LessonSummaryCard label={t("agenda.edit.cardLabel")} text={card} />
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
          <Field label={t("agenda.edit.teacher")} hint={t("agenda.edit.teacherHelp", { modality: lesson.modality.name })} error={errors.teacherId}>
            {(c) => (
              <Select {...c} className="min-h-11" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                {teachers.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <ChoiceCards
            legend={t("agenda.edit.scope")}
            value={scope}
            onChange={(v) => setScope(v as "THIS" | "FOLLOWING")}
            options={(lesson.class ? (["THIS", "FOLLOWING"] as const) : (["THIS"] as const)).map((s) => ({ value: s, label: t(`agenda.edit.scopes.${s}.label`), description: t(`agenda.edit.scopes.${s}.description`) }))}
          />
          {errors.scope && <p className="text-sm text-danger-foreground">{errors.scope}</p>}
          {following && lesson.followingEdited > 0 && (
            <Banner tone="warn">
              <span className="font-medium">{t("agenda.edit.followingEdited", { count: lesson.followingEdited })}</span> {t("agenda.edit.followingEditedNote")}
            </Banner>
          )}
          {following && <SummaryBox label={t("agenda.edit.summaryLabel")} items={summary} />}
          <div>
            <ComingSoon variant="button" label={t("agenda.edit.note")} />
          </div>
          <Switch checked={notify} onCheckedChange={setNotify} label={t("agenda.edit.notify")} description={t("agenda.edit.notifyHelp")} />
          {errors.form && <Banner tone="danger">{errors.form}</Banner>}
        </form>
      )}
    </Modal>
  );
}
