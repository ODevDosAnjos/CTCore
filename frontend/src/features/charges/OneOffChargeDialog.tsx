import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MoneyField } from "@/components/fields/fields";
import { DateField } from "@/components/ui/date-field";
import { Field, Input } from "@/components/ui/field";
import { PersonRow } from "@/components/ui/person-row";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { useStudentModalities } from "@/features/benefits/GrantBenefitDialog";
import { ModalityDialog, PickSelect } from "@/features/students/ModalityPickers";
import { todayIso } from "./ChangeDueDialog";
import { StudentSearch } from "./StudentSearch";
import { createOneOff } from "./useChargeCreation";

const MAX_CENTS = 10_000_000;

// RN-COB-11: cobrança avulsa de uma unidade onde o aluno tem matrícula. O requestId nasce com a janela: duplo clique ou nova tentativa não duplicam (RNF-12).
// `student`: aluno já escolhido (ficha); esconde a busca.
export function OneOffChargeDialog({ onClose, onDone, student }: { onClose: () => void; onDone: () => void; student?: { id: string; name: string } }) {
  const { t } = useTranslation();
  const k = "charges.creation.";
  const requestId = useRef(crypto.randomUUID());
  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState(student?.id ?? "");
  const [chosenUnit, setChosenUnit] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [dueOn, setDueOn] = useState("");
  const { students, enrollment } = useStudentModalities(query, studentId);

  const units = [...new Map((enrollment.data?.modalities ?? []).map((m) => [m.unit.id, m.unit])).values()];
  const unitId = units.length === 1 ? units[0].id : chosenUnit;
  const canSubmit = !!studentId && !!unitId && description.trim().length >= 1 && amount !== null && amount >= 1 && amount <= MAX_CENTS && dueOn >= todayIso();

  return (
    <ModalityDialog
      title={t(`${k}title`)}
      cancelLabel={t("common.cancel")}
      state="ready"
      size="sm"
      submitLabel={t(`${k}submit`)}
      canSubmit={canSubmit}
      errorPrefix={`${k}errors.`}
      work={() => createOneOff(studentId, { requestId: requestId.current, unitId, description: description.trim(), amountCents: amount!, dueOn })}
      onClose={onClose}
      onDone={onDone}
    >
      {(errors) => (
        <>
          {student ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t(`${k}student`)}</span>
              <div className="rounded-md border border-input bg-card p-2">
                <PersonRow name={student.name} size="sm" />
              </div>
            </div>
          ) : (
            <StudentSearch
            query={query}
            onQuery={(q) => {
              setQuery(q);
              setStudentId("");
              setChosenUnit("");
            }}
            students={students}
            studentId={studentId}
            onPick={(v) => {
              setStudentId(v);
              setChosenUnit("");
            }}
            error={errors.studentId}
            />
          )}
          {studentId && enrollment.status === "loading" && <LoadingState />}
          {studentId && enrollment.status === "forbidden" && <ForbiddenState />}
          {studentId && (enrollment.status === "error" || enrollment.status === "notFound") && <ErrorState onRetry={enrollment.reload} />}
          {studentId && enrollment.status === "ready" && units.length === 0 && <p className="text-sm text-muted-foreground">{t(`${k}noUnit`)}</p>}
          {studentId && enrollment.status === "ready" && units.length > 1 && (
            <PickSelect label={t(`${k}unit`)} value={chosenUnit} onChange={setChosenUnit} options={units} error={errors.unitId} />
          )}
          {studentId && enrollment.status === "ready" && units.length === 1 && <p className="text-sm">{t(`${k}unitFixed`, { unit: units[0].name })}</p>}
          <Field label={t(`${k}description`)} required hint={t(`${k}descriptionCount`, { count: description.length, max: 80 })} error={errors.description}>
            {(c) => <Input {...c} value={description} maxLength={80} onChange={(e) => setDescription(e.target.value)} />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <MoneyField label={t(`${k}amount`)} required placeholder={t(`${k}amountPlaceholder`)} onChange={setAmount} />
              {errors.amountCents && <p className="text-xs text-danger-foreground">{errors.amountCents}</p>}
            </div>
            <Field label={t(`${k}dueOn`)} required error={errors.dueOn}>
              {(c) => <DateField {...c} iconLeft min={todayIso()} value={dueOn} onChange={(e) => setDueOn(e.target.value)} />}
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">{t(`${k}note`)}</p>
        </>
      )}
    </ModalityDialog>
  );
}
