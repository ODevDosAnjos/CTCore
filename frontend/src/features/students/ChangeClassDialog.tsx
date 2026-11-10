import { useState } from "react";
import { useTranslation } from "react-i18next";
import { changeClass } from "./useStudentRecord";
import { classLabel } from "./modalityDialogSummary";
import { combine, ModalityDialog, OtherClasses, PickSelect, ReadOnlyField, useClassChoices } from "./ModalityPickers";
import type { EnrollmentModality } from "./types";

// R9 (RN-MAT-15): troca a turma principal e os outros horários; vale na hora. O servidor reconfere as regras e o erro aparece no campo.
// `initial` é a turma pedida pelo aluno (RN-MAT-16): a janela abre com ela escolhida, e a gestão confere e confirma.
export function ChangeClassDialog({ studentId, row, initial, onClose, onDone }: { studentId: string; row: EnrollmentModality; initial?: string; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const k = "students.record.enrollment.";
  const classes = useClassChoices(row.unit.id, row.modality.id);
  const [primary, setPrimary] = useState(initial ?? "");
  const [others, setOthers] = useState(row.otherClasses.map((c) => c.id).filter((id) => id !== initial));
  const [reason, setReason] = useState("");
  const { state, retry } = combine(classes);
  const options = classes.data?.items ?? [];
  const text = reason.trim();
  return (
    <ModalityDialog
      size="sm"
      title={t(`${k}class.title`)}
      state={state}
      retry={retry}
      cancelLabel={t("common.cancel")}
      submitLabel={t(`${k}class.submit`)}
      canSubmit={!!primary && primary !== row.primaryClass.id && (!text || text.length >= 3)}
      summary={[t(`${k}class.summary.now`), t(`${k}class.summary.same`)]}
      reason={{ label: t(`${k}reasonOptional`), value: reason, onChange: setReason, optional: true }}
      work={() => changeClass(studentId, row.id, { primaryClassId: primary, otherClassIds: others.filter((id) => id !== primary), ...(text ? { reason: text } : {}) })}
      onClose={onClose}
      onDone={onDone}
    >
      {(errors) => (
        <>
          <ReadOnlyField label={t(`${k}readOnlyModality`)} value={row.modality.name} />
          <ReadOnlyField label={t(`${k}class.current`)} value={row.primaryClass.name} />
          <PickSelect label={t(`${k}class.primary`)} value={primary} onChange={setPrimary} options={options.filter((c) => c.id !== row.primaryClass.id).map((c) => ({ id: c.id, name: classLabel(t, c) }))} error={errors.primaryClassId} />
          <OtherClasses options={options} primary={primary} value={others} onChange={setOthers} error={errors.otherClassIds} />
        </>
      )}
    </ModalityDialog>
  );
}
