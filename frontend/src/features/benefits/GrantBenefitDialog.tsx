import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MoneyField } from "@/components/fields/fields";
import { formatMoney } from "@/components/fields/masks";
import { ReasonField } from "@/components/ReasonField";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { DateField } from "@/components/ui/date-field";
import { Field, Input, Select } from "@/components/ui/field";
import { SummaryBox } from "@/components/ui/summary-box";
import { StudentSearch } from "@/features/charges/StudentSearch";
import { todayIso } from "@/features/charges/ChangeDueDialog";
import { useSession } from "@/features/auth/SessionProvider";
import { ModalityDialog, ReadOnlyField } from "@/features/students/ModalityPickers";
import { useResource } from "@/features/students/useStudentRecord";
import type { Enrollment, StudentList } from "@/features/students/types";
import { monthLabel, previousMonthLabel } from "./benefitFormat";
import { ReplaceBenefitDialog } from "./ReplaceBenefitDialog";
import { grantBenefit, useBenefitPreview, type BenefitType } from "./useGrantBenefit";

export interface GrantTarget {
  studentId: string;
  studentName: string;
  modalityRowId: string;
  modalityName: string;
}

// Aluno por busca de nome (sem rota nova) e as modalidades ativas que a pessoa pode alterar, quando a janela não vem da ficha.
export function useStudentModalities(query: string, studentId: string) {
  const students = useResource<StudentList>(query.trim().length >= 2 ? `/students?q=${encodeURIComponent(query.trim())}&size=25&sort=name` : null);
  const enrollment = useResource<Enrollment>(studentId ? `/students/${studentId}/enrollment` : null);
  return { students, enrollment };
}

// RF-BEN-02: conceder benefício a uma modalidade da matrícula. O resumo (mensalidade, mês, aviso de substituição) vem do servidor; a barreira é dele.
// RN-BEN-08: com benefício ativo na modalidade, "Conceder" abre antes a confirmação "Substituir benefício?" (atual e novo).
export function GrantBenefitDialog({ fixed, onClose, onDone }: { fixed?: GrantTarget; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const k = "benefits.grant.";
  const { state } = useSession();
  const account = state.status === "ready" ? (state.session.account.name ?? "") : "";
  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState(fixed?.studentId ?? "");
  const [rowId, setRowId] = useState(fixed?.modalityRowId ?? "");
  const [type, setType] = useState<BenefitType>("PERCENT");
  const [percent, setPercent] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [decidedBy, setDecidedBy] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const teachers = useResource<{ items: { id: string; name: string }[] }>("/teachers?status=ACTIVE&size=100&sort=name,asc");
  const { students, enrollment } = useStudentModalities(query, fixed ? "" : studentId);

  const value = type === "PERCENT" ? (/^\d{1,3}$/.test(percent) && Number(percent) >= 1 && Number(percent) <= 100 ? Number(percent) : null) : amount;
  const preview = useBenefitPreview(studentId, rowId, type, value);
  // O aviso de substituição aparece ao escolher a modalidade, antes de digitar o valor (a prévia com 1% só diz se há benefício ativo).
  const check = useBenefitPreview(studentId, rowId, "PERCENT", rowId ? 1 : null);
  const modalities = (enrollment.data?.modalities ?? []).filter((m) => m.status === "ACTIVE" && m.canEdit);
  const canSubmit = preview.status === "ready" && reason.trim().length >= 2 && decidedBy.trim().length >= 2;
  const who = [account, ...(teachers.data?.items ?? []).map((x) => x.name)].filter((n, i, all) => n && all.indexOf(n) === i);
  const studentName = fixed?.studentName ?? students.data?.items.find((s) => s.id === studentId)?.name ?? "";
  const modalityRow = modalities.find((m) => m.id === rowId);
  const modalityName = fixed?.modalityName ?? modalityRow?.modality.name ?? "";
  const body = () => ({
    studentId,
    modalityRowId: rowId,
    type,
    value: value!,
    reason: reason.trim(),
    decidedBy: decidedBy.trim(),
    validUntil: validUntil || null,
    ...(teacherId ? { teacherId } : {}),
  });
  const current = check.status === "ready" ? check.data.current : null;
  const currentText = current ? (current.type === "PERCENT" ? t(`${k}currentPercent`, { value: current.value }) : t(`${k}currentAmount`, { value: formatMoney(current.value) })) : "";

  return (
    <>
      <ModalityDialog
        title={fixed ? t(`${k}titleFor`, { modality: fixed.modalityName }) : t(`${k}title`)}
        state="ready"
        size="md"
        scrim="canvas"
        cancelLabel={t(`${k}cancel`)}
        submitLabel={t(`${k}submit`)}
        canSubmit={canSubmit}
        errorPrefix={`${k}errors.`}
        footerNote={account ? t(`${k}by`, { name: account }) : undefined}
        beforeSubmit={() => {
          if (!preview.data?.replaces) return false;
          setConfirming(true);
          return true;
        }}
        work={() => grantBenefit({ ...body(), replaceExisting: false })}
        onClose={onClose}
        onDone={onDone}
      >
        {(errors) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {fixed ? (
                <>
                  <ReadOnlyField label={t(`${k}student`)} value={fixed.studentName} />
                  <ReadOnlyField label={t(`${k}modality`)} value={fixed.modalityName} />
                </>
              ) : (
                <>
                  <StudentSearch
                    query={query}
                    onQuery={(q) => {
                      setQuery(q);
                      setStudentId("");
                      setRowId("");
                    }}
                    students={students}
                    studentId={studentId}
                    onPick={(v) => {
                      setStudentId(v);
                      setRowId("");
                    }}
                    error={errors.studentId}
                  />
                  <Field label={t(`${k}modality`)} error={errors.modalityRowId}>
                    {(c) => (
                      <Select {...c} disabled={!studentId || modalities.length === 0} value={rowId} onChange={(e) => setRowId(e.target.value)}>
                        <option value="">{studentId ? t("students.record.enrollment.choose") : t(`${k}modalityChoose`)}</option>
                        {modalities.map((m) => (
                          <option key={m.id} value={m.id}>
                            {t(`${k}modalityOption`, { modality: m.modality.name, unit: m.unit.name, plan: m.plan.name })}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                </>
              )}
            </div>
            {studentId && enrollment.status === "loading" && <LoadingState />}
            {studentId && enrollment.status === "forbidden" && <ForbiddenState />}
            {studentId && (enrollment.status === "error" || enrollment.status === "notFound") && <ErrorState onRetry={enrollment.reload} />}
            {studentId && enrollment.status === "ready" && modalities.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t(`${k}noModalityTitle`)}. {t(`${k}noModalityText`)}
              </p>
            )}
            {current && <Banner tone="warn">{t(`${k}replaceNotice`, { student: studentName.split(" ")[0], current: currentText })}</Banner>}
            <ChoiceCards
              legend={t(`${k}type`)}
              columns={2}
              value={type}
              onChange={(v) => setType(v as BenefitType)}
              options={[
                { value: "PERCENT", label: t(`${k}typePercent`), description: t(`${k}typePercentHint`) },
                { value: "AMOUNT", label: t(`${k}typeAmount`), description: t(`${k}typeAmountHint`) },
              ]}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              {type === "PERCENT" ? (
                <Field label={t(`${k}percent`)} error={errors.value}>
                  {(c) => (
                    <span className="relative flex items-center">
                      <Input {...c} inputMode="numeric" className="pr-8" value={percent} onChange={(e) => setPercent(e.target.value.replace(/\D/g, "").slice(0, 3))} />
                      <span aria-hidden className="pointer-events-none absolute right-3 text-sm text-muted-foreground">
                        %
                      </span>
                    </span>
                  )}
                </Field>
              ) : (
                <div>
                  <MoneyField key="amount" label={t(`${k}amount`)} initial={amount ?? undefined} onChange={setAmount} />
                  {errors.value && <p className="text-xs text-danger-foreground">{errors.value}</p>}
                </div>
              )}
              <Field label={t(`${k}validUntil`)} error={errors.validUntil}>
                {(c) => <DateField {...c} iconLeft min={todayIso()} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />}
              </Field>
              <Field label={t(`${k}decidedBy`)} required error={errors.decidedBy}>
                {(c) => (
                  <Select {...c} value={decidedBy} onChange={(e) => setDecidedBy(e.target.value)}>
                    <option value="">{t(`${k}decidedByChoose`)}</option>
                    {who.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
            {teachers.status === "ready" && (teachers.data?.items.length ?? 0) > 0 && (
              <Field label={t(`${k}teacher`)} error={errors.teacherId}>
                {(c) => (
                  <Select {...c} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                    <option value="">{t(`${k}noTeacher`)}</option>
                    {teachers.data!.items.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
            <ReasonField label={t(`${k}reason`)} value={reason} onChange={setReason} error={errors.reason} rows={1} />
            {preview.status === "loading" && <LoadingState />}
            {preview.status === "forbidden" && <ForbiddenState />}
            {preview.status === "error" && <ErrorState onRetry={preview.reload} />}
            {preview.status === "ready" && (
              <SummaryBox
                label={t(`${k}summary.title`)}
                items={[
                  t(`${k}summary.plan`, { plan: preview.data.plan.name, value: formatMoney(preview.data.plan.valueCents) }),
                  type === "PERCENT" ? t(`${k}summary.percent`, { value }) : t(`${k}summary.amount`, { value: formatMoney(value) }),
                  t(`${k}summary.monthly`, { value: formatMoney(preview.data.newMonthlyValueCents) }),
                  t(`${k}summary.from`, { month: monthLabel(preview.data.effectiveFrom), previous: previousMonthLabel(preview.data.effectiveFrom) }),
                  ...(preview.data.newMonthlyValueCents === 0 ? [t(`${k}summary.zero`)] : []),
                  ...(preview.data.high ? [t(`${k}summary.high`)] : []),
                ]}
              />
            )}
          </>
        )}
      </ModalityDialog>
      {confirming && preview.status === "ready" && preview.data.current && (
        <ReplaceBenefitDialog
          student={studentName}
          modality={modalityName}
          current={preview.data.current}
          next={{ type, value: value!, reason: reason.trim(), validUntil: validUntil || null }}
          newMonthlyCents={preview.data.newMonthlyValueCents}
          onConfirm={() => grantBenefit({ ...body(), replaceExisting: true })}
          onKeep={() => setConfirming(false)}
          onDone={() => {
            onDone();
            onClose();
          }}
        />
      )}
    </>
  );
}
