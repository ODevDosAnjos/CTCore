import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { ReasonField } from "@/components/ReasonField";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { SummaryBox } from "@/components/ui/summary-box";
import { ApiError } from "@/lib/api";
import { br, weekday } from "./agendaDates";
import { lessonName } from "./LessonCard";
import type { LessonDetail } from "./useLesson";
import { editLesson, useUnitTeachers } from "./useLessonActions";

// RF-AGE-03, RN-AGE-08: corrigir o professor de aula concluída (até 30 dias), com motivo. Data e horário não mudam. O servidor reconfere.
export function CorrectTeacherDialog({ lesson, onClose, onSaved }: { lesson: LessonDetail | null; onClose: () => void; onSaved: () => void }) {
  if (!lesson) return null;
  return <Body key={lesson.id} lesson={lesson} onClose={onClose} onSaved={onSaved} />;
}

function Body({ lesson, onClose, onSaved }: { lesson: LessonDetail; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const formId = useId();
  const options = useUnitTeachers(lesson.unit.id, lesson.date);
  const [teacherId, setTeacherId] = useState(lesson.teacher.id);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const teachers = options.teachers.some((x) => x.id === lesson.teacher.id) ? options.teachers : [lesson.teacher, ...options.teachers];
  const day = t(`agenda.weekdaysLong.${weekday(lesson.date)}`).split("-")[0];

  async function submit() {
    const found: Record<string, string> = {};
    if (!reason.trim()) found.reason = t("agenda.correct.reasonRequired");
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await editLesson(lesson.id, { scope: "THIS", date: lesson.date, startsAt: lesson.startsAt, endsAt: lesson.endsAt, teacherId, reason: reason.trim() });
      onClose();
      onSaved();
    } catch (e) {
      const next: Record<string, string> = {};
      if (e instanceof ApiError && e.fields.length) for (const f of e.fields) next[f.field] = f.message;
      else next.form = t(`agenda.correct.errors.${e instanceof ApiError && [403, 404, 409, 422].includes(e.status) ? e.status : "generic"}`);
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
      title={t("agenda.correct.title")}
      footer={
        options.status === "ready" && (
          <>
            <Button type="button" variant="outline" className="min-h-11" onClick={onClose} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={formId} className="min-h-11" disabled={busy}>
              {busy ? t("agenda.correct.saving") : t("agenda.correct.save")}
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
          <p className="text-sm text-muted-foreground">{t("agenda.correct.subtitle", { name: lessonName(lesson), day, date: br(lesson.date) })}</p>
          <Field label={t("agenda.correct.teacher")} error={errors.teacherId}>
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
          <ReasonField label={t("agenda.correct.reason")} value={reason} onChange={setReason} error={errors.reason} />
          <SummaryBox label={t("agenda.correct.summaryLabel")} items={[t("agenda.correct.summaryDate"), t("agenda.correct.summarySubstitution"), t("agenda.correct.summaryAudit")]} />
          <p className="text-xs text-muted-foreground">{t("agenda.correct.note")}</p>
          {errors.form && <Banner tone="danger">{errors.form}</Banner>}
        </form>
      )}
    </Modal>
  );
}
