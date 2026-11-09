import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { ReasonField } from "@/components/ReasonField";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { Textarea } from "@/components/ui/field";
import { SegmentedChoice } from "@/components/ui/segmented-choice";
import { SummaryBox } from "@/components/ui/summary-box";
import { formatCurrency, formatDate } from "@/lib/format";
import { combine, ModalityDialog } from "./ModalityPickers";
import type { ChargeDecision, EndReason, EnrollmentModality } from "./types";
import { endModality, useEndPreview } from "./useStudentRecord";

const REASONS: EndReason[] = ["CITY_CHANGE", "FINANCIAL", "SCHEDULE", "INJURY", "DISSATISFACTION", "OTHER"];

type Props = {
  studentId: string;
  studentName: string;
  row: EnrollmentModality;
  /** Nomes das outras modalidades ativas do aluno, para o Resumo. */
  others?: string[];
  onClose: () => void;
  onDone: () => void;
};

// RF-MAT-03 (RN-MAT-17): encerra a modalidade com motivo e observação opcional; as cobranças em aberto vêm do servidor e cada uma é mantida ou cancelada, com um só motivo de cancelamento (copiado a cada cobrança cancelada no envio).
export function EndModalityDialog({ studentId, studentName, row, others = [], onClose, onDone }: Props) {
  const { t } = useTranslation();
  const k = "students.record.enrollment.end.";
  const noteId = useId();
  const preview = useEndPreview(studentId, row.id);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [canceled, setCanceled] = useState<Record<string, boolean>>({});
  const [cancelReason, setCancelReason] = useState("");
  const { state, retry } = combine(preview);
  const all = preview.data?.openCharges ?? [];
  // RN-MAT-18 (D6): com pedido de encerramento aberto, o servidor cancela as cobranças com vencimento depois dele; a janela só as mostra.
  const automatic = all.filter((c) => c.afterRequest);
  const charges = all.filter((c) => !c.afterRequest);
  const anyCancel = charges.some((c) => canceled[c.id]);
  const decisions: ChargeDecision[] = charges.map((c) => (canceled[c.id] ? { chargeId: c.id, action: "CANCEL", reason: cancelReason.trim() } : { chargeId: c.id, action: "KEEP" }));
  const first = studentName.split(" ")[0];
  const describe = (list: typeof all) => list.map((c) => `${formatDate(c.dueOn)} (${formatCurrency(c.amountCents)})`).join(", ");
  const kept = charges.filter((c) => !canceled[c.id]);
  const gone = [...charges.filter((c) => canceled[c.id]), ...automatic];
  const chargeSummary = [kept.length > 0 && t(`${k}summary.kept`, { list: describe(kept) }), gone.length > 0 && t(`${k}summary.canceled`, { list: describe(gone) })].filter(Boolean).join(" ");
  const summary = [
    t(`${k}summary.ended`, { modality: row.modality.name, date: formatDate(new Date()) }),
    chargeSummary,
    ...others.map((name) => t(`${k}summary.other`, { modality: name, student: first })),
    t(`${k}summary.email`, { student: first }),
  ].filter(Boolean);
  return (
    <ModalityDialog
      size="md"
      title={t(`${k}title`, { modality: row.modality.name })}
      effect={t(`${k}effect`)}
      state={state}
      retry={retry}
      submitLabel={t(`${k}submit`)}
      canSubmit={!!reason && (!anyCancel || !!cancelReason.trim())}
      work={() => endModality(studentId, row.id, { reason, note: note.trim() || undefined, ...(decisions.length ? { charges: decisions } : {}) })}
      onClose={onClose}
      onDone={onDone}
    >
      {(errors) => (
        <>
          <div>
            <ChoiceCards legend={t(`${k}reason`)} required columns={2} value={reason} onChange={setReason} options={REASONS.map((r) => ({ value: r, label: t(`${k}reasons.${r}`) }))} />
            {errors.reason && <p className="text-sm text-danger-foreground">{errors.reason}</p>}
          </div>
          <div>
            <label htmlFor={noteId} className="block text-sm font-medium">
              {t(`${k}note`)}
            </label>
            <Textarea
              id={noteId}
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-invalid={errors.note ? true : undefined}
              aria-describedby={errors.note ? `${noteId}-erro` : undefined}
            />
            {errors.note && (
              <p id={`${noteId}-erro`} className="text-sm text-danger-foreground">
                {errors.note}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t(`${k}charges`)}</p>
            {all.length === 0 && <p className="text-sm text-muted-foreground">{t(`${k}noCharges`)}</p>}
            {automatic.length > 0 && (
              <>
                <p className="text-sm text-muted-foreground">{t(`${k}afterRequest`)}</p>
                <ul className="flex flex-col gap-1 text-sm">
                  {automatic.map((c) => (
                    <li key={c.id} className="rounded-md border p-2">
                      {t(`${k}chargeLine`, { due: formatDate(c.dueOn), amount: formatCurrency(c.amountCents), status: t(`${k}autoCanceled`) })}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {charges.length > 0 && (
              <ul className="flex flex-col gap-2 text-sm">
                {charges.map((c) => {
                  const line = t(`${k}chargeLine`, { due: formatDate(c.dueOn), amount: formatCurrency(c.amountCents), status: t(`charges.status.${c.status}`) });
                  return (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2">
                      <span>{line}</span>
                      <SegmentedChoice
                        label={line}
                        value={canceled[c.id] ? "cancel" : "keep"}
                        onChange={(v) => setCanceled((s) => ({ ...s, [c.id]: v === "cancel" }))}
                        options={[
                          { value: "keep", label: t(`${k}keep`) },
                          { value: "cancel", label: t(`${k}cancel`) },
                        ]}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {anyCancel && <ReasonField label={t(`${k}cancelReason`)} value={cancelReason} onChange={setCancelReason} />}
          <SummaryBox label={t(`${k}summary.label`)} items={summary} />
        </>
      )}
    </ModalityDialog>
  );
}
