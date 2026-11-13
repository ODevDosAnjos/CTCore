import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { SegmentedChoice } from "@/components/ui/segmented-choice";
import { useStudentModalities } from "@/features/benefits/GrantBenefitDialog";
import { ModalityDialog, PickSelect } from "@/features/students/ModalityPickers";
import { formatCurrency, formatDate } from "@/lib/format";
import { StudentSearch } from "./StudentSearch";
import type { ChargeCreated } from "./types";
import { advanceCharges, useAdvancePreview } from "./useChargeCreation";

const COUNTS = [1, 2, 3, 6];
const TH = "px-3 py-2 text-left text-xs font-semibold text-muted-foreground";
const TD = "px-3 py-2.5";
const month = (iso: string) => `${new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "")}/${iso.slice(0, 4)}`;

// Prévia vinda do servidor (benefício, vencimento e meses já gerados): referência, vencimento, valor e total.
function Preview({ studentId, rowId, count }: { studentId: string; rowId: string; count: number }) {
  const { t } = useTranslation();
  const k = "charges.advance.";
  const preview = useAdvancePreview(studentId, rowId, count);
  if (preview.status === "loading") return <LoadingState />;
  if (preview.status === "forbidden") return <ForbiddenState />;
  if (preview.status === "error" || preview.status === "notFound") return <ErrorState onRetry={preview.reload} />;
  if (preview.status !== "ready" || !preview.data) return null;
  return (
    <>
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-sm" aria-label={t(`${k}preview`)}>
          <thead className="bg-surface-soft">
            <tr>
              <th scope="col" className={TH}>
                {t(`${k}reference`)}
              </th>
              <th scope="col" className={TH}>
                {t(`${k}dueOn`)}
              </th>
              <th scope="col" className={`${TH} text-right`}>
                {t(`${k}value`)}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {preview.data.items.map((i) => (
              <tr key={i.referenceMonth}>
                <td className={TD}>{month(i.referenceMonth)}</td>
                <td className={TD}>{formatDate(i.dueOn)}</td>
                <td className={`${TD} text-right tabular-nums`}>{formatCurrency(i.amountCents)}</td>
              </tr>
            ))}
            <tr className="bg-surface-soft font-semibold">
              <td className={TD} colSpan={2}>
                {t(`${k}total`)}
              </td>
              <td className={`${TD} text-right tabular-nums`}>{formatCurrency(preview.data.totalCents)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{t(`${k}note`)}</p>
    </>
  );
}

// RN-COB-06: gera adiantado as próximas N mensalidades de uma modalidade ativa; mostra quantas nasceram e de que meses.
export function AdvanceChargesDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const k = "charges.advance.";
  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState("");
  const [rowId, setRowId] = useState("");
  const [count, setCount] = useState(3);
  const [result, setResult] = useState<ChargeCreated[] | null>(null);
  // O ModalityDialog fecha logo depois de concluir; a ref guarda o resultado para trocar a janela pelo resumo em vez de fechar.
  const created = useRef<ChargeCreated[] | null>(null);
  const { students, enrollment } = useStudentModalities(query, studentId);
  const modalities = (enrollment.data?.modalities ?? []).filter((m) => m.status === "ACTIVE" && m.canEdit);

  if (result) {
    const months = result.map((c) => c.referenceMonth).sort();
    return (
      <Modal
        open
        size="sm"
        onOpenChange={(o) => !o && onClose()}
        title={t(`${k}doneTitle`)}
        footer={
          <Button type="button" className="min-h-11" onClick={onClose}>
            {t(`${k}close`)}
          </Button>
        }
      >
        <p role="status">{result.length === 0 ? t(`${k}doneNone`) : t(`${k}done`, { count: result.length, from: month(months[0]), to: month(months[months.length - 1]) })}</p>
      </Modal>
    );
  }

  return (
    <ModalityDialog
      title={t(`${k}title`)}
      effect={t(`${k}effect`)}
      state="ready"
      size="sm"
      cancelLabel={t("common.cancel")}
      submitLabel={t(`${k}submit`, { count })}
      canSubmit={!!studentId && !!rowId}
      errorPrefix={`${k}errors.`}
      work={async () => {
        created.current = await advanceCharges(studentId, rowId, count);
      }}
      onClose={() => (created.current ? setResult(created.current) : onClose())}
      onDone={onDone}
    >
      {(errors) => (
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
          {studentId && enrollment.status === "loading" && <LoadingState />}
          {studentId && enrollment.status === "forbidden" && <ForbiddenState />}
          {studentId && (enrollment.status === "error" || enrollment.status === "notFound") && <ErrorState onRetry={enrollment.reload} />}
          {studentId && enrollment.status === "ready" && modalities.length === 0 && <EmptyState title={t(`${k}noModalityTitle`)} text={t(`${k}noModalityText`)} />}
          {studentId && enrollment.status === "ready" && modalities.length > 0 && (
            <PickSelect label={t(`${k}modality`)} value={rowId} onChange={setRowId} options={modalities.map((m) => ({ id: m.id, name: `${m.modality.name} · ${m.plan.name}` }))} error={errors.modalityRowId} />
          )}
          <div className="flex flex-col gap-1">
            <span aria-hidden className="text-sm font-medium">
              {t(`${k}count`)}
            </span>
            <SegmentedChoice label={t(`${k}count`)} className="self-start" value={String(count)} onChange={(v) => setCount(Number(v))} options={COUNTS.map((n) => ({ value: String(n), label: String(n) }))} />
            {errors.count && <p className="text-sm text-danger-foreground">{errors.count}</p>}
          </div>
          {studentId && rowId && <Preview studentId={studentId} rowId={rowId} count={count} />}
        </>
      )}
    </ModalityDialog>
  );
}
