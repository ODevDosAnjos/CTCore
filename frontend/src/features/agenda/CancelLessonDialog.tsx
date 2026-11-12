import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { Checkbox } from "@/components/ui/checkbox";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Text } from "@/features/units/Text";
import { ApiError } from "@/lib/api";
import { br, weekday } from "./agendaDates";
import { LessonSummaryCard } from "./LessonSummaryCard";
import type { LessonDetail } from "./useLesson";
import { lessonName } from "./LessonCard";
import { cancelLesson, type CancelCode } from "./useLessonActions";

const CODES: CancelCode[] = ["TEACHER_UNAVAILABLE", "HOLIDAY", "ACADEMY_EVENT", "OTHER"];

// RF-AGE-03: cancelar com motivo e canais do comunicado. Cancelar não envia comunicado (RN-AGE-05); o aviso sai por "Avisar turma". O servidor reconfere.
export function CancelLessonDialog({ lesson, onClose, onSaved }: { lesson: LessonDetail | null; onClose: () => void; onSaved: () => void }) {
  if (!lesson) return null;
  return <Body key={lesson.id} lesson={lesson} onClose={onClose} onSaved={onSaved} />;
}

function Body({ lesson, onClose, onSaved }: { lesson: LessonDetail; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const formId = useId();
  const [reason, setReason] = useState<CancelCode | "">("");
  const [text, setText] = useState("");
  const [email, setEmail] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const hasGroup = !!lesson.groupLink;
  const day = t(`agenda.weekdaysLong.${weekday(lesson.date)}`).split("-")[0];
  const summary = [
    t("agenda.cancel.summary", { name: lessonName(lesson), day, date: br(lesson.date), from: lesson.startsAt, to: lesson.endsAt, teacher: lesson.teacher.name }),
    ...(lesson.class ? [t("agenda.cancel.students", { count: lesson.activeStudents })] : []),
  ].join(" · ");

  async function submit() {
    const found: Record<string, string> = {};
    if (!reason) found.reason = t("agenda.cancel.reasonRequired");
    if (reason === "OTHER" && !text.trim()) found.reasonText = t("agenda.cancel.textRequired");
    setErrors(found);
    if (Object.keys(found).length || !reason) return;
    setBusy(true);
    try {
      // D4: a decisão das experimentais fica "Em breve" até a Sprint 18; hoje trialClasses vale 0.
      await cancelLesson(lesson.id, {
        reason,
        ...(reason === "OTHER" ? { reasonText: text.trim() } : {}),
        channels: [...(email ? (["EMAIL"] as const) : []), ...(whatsapp && hasGroup ? (["WHATSAPP"] as const) : [])],
      });
      onClose();
      onSaved();
    } catch (e) {
      const next: Record<string, string> = {};
      if (e instanceof ApiError && e.fields.length) for (const f of e.fields) next[f.field] = f.message;
      else next.form = t(`agenda.cancel.errors.${e instanceof ApiError && [403, 404, 409, 422].includes(e.status) ? e.status : "generic"}`);
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
      title={t("agenda.cancel.title")}
      footer={
        <>
          <Button type="button" variant="outline" className="min-h-11" onClick={onClose} disabled={busy}>
            {t("agenda.cancel.keep")}
          </Button>
          <Button type="submit" form={formId} variant="danger" className="min-h-11" disabled={busy}>
            {busy ? t("agenda.cancel.sending") : t("agenda.cancel.confirm")}
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
        <LessonSummaryCard label={t("agenda.cancel.cardLabel")} text={summary} />
        {lesson.trialClasses > 0 && (
          <>
            <Banner tone="warn">{t("agenda.cancel.trials", { count: lesson.trialClasses })}</Banner>
            <div className="flex flex-wrap gap-2">
              <ComingSoon variant="button" label={t("agenda.cancel.trialRebook")} />
              <ComingSoon variant="button" label={t("agenda.cancel.trialCancel")} />
              <ComingSoon variant="button" label={t("agenda.cancel.trialTo")} />
            </div>
          </>
        )}
        <div className="flex flex-col gap-1">
          <ChoiceCards
            legend={t("agenda.cancel.reason")}
            required
            columns={1}
            value={reason}
            onChange={(v) => setReason(v as CancelCode)}
            options={CODES.map((c) => ({ value: c, label: t(`agenda.cancelReasons.${c}`) }))}
          />
          {errors.reason && <p className="text-sm text-danger-foreground">{errors.reason}</p>}
        </div>
        {reason === "OTHER" && <Text label={t("agenda.cancel.text")} value={text} onChange={setText} error={errors.reasonText} maxLength={200} autoComplete="off" required />}
        <fieldset className="flex flex-col">
          <legend className="mb-1 text-sm font-medium">{t("agenda.cancel.channels")}</legend>
          <div className="flex flex-wrap gap-x-4">
            <Checkbox label={t("agenda.cancel.portal")} checked disabled readOnly />
            <Checkbox label={t("agenda.cancel.email")} checked={email} onChange={(e) => setEmail(e.target.checked)} />
            {hasGroup && <Checkbox label={t("agenda.cancel.whatsapp")} checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} />}
            <ComingSoon variant="switch" label={t("agenda.cancel.push")} />
          </div>
          <p className="text-sm text-muted-foreground">{t("agenda.cancel.channelsHelp")}</p>
          {errors.channels && <p className="text-sm text-danger-foreground">{errors.channels}</p>}
        </fieldset>
        {errors.form && <Banner tone="danger">{errors.form}</Banner>}
      </form>
    </Modal>
  );
}
