import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { GrantBenefitDialog } from "@/features/benefits/GrantBenefitDialog";
import { Button } from "@/components/ui/button";
import { useBelowSm } from "@/components/query/useBelowSm";
import { formatCurrency } from "@/lib/format";
import { CancelNextDialog } from "./CancelNextDialog";
import { ChangeDueDialog } from "./ChangeDueDialog";
import type { GenerationPreview, PreviewDay, PreviewLine } from "./types";

type Action = { kind: "due" | "cancel" | "benefit"; line: PreviewLine; dueOn: string };

const SKIPPED_COLUMNS = ["student", "modality", "reason"] as const;
const cell = "px-3 py-3 text-left align-middle";
const num = `${cell} text-right tabular-nums`;

/** "+ R$ 360,00", "− R$ 160,00" ou "igual" (R9, R10). */
export function useSigned() {
  const { t } = useTranslation();
  return (diff: number) => (diff === 0 ? t("charges.preview.same") : `${diff > 0 ? "+" : "−"} ${formatCurrency(Math.abs(diff))}`);
}

// Linha da prévia: aluno, modalidade, plano, desconto e valor; em 360 px empilha como cartão. Ações só quando a pessoa pode ajustar e a linha é ajustável.
function Line({ line, canAdjust, onAct }: { line: PreviewLine; canAdjust: boolean; onAct: (kind: Action["kind"]) => void }) {
  const { t } = useTranslation();
  const who = { student: line.student };
  return (
    <li className="flex flex-col gap-2 rounded-md border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="break-words font-medium">{line.student}</p>
        <p className="break-words text-sm text-muted-foreground">
          {line.modality} · {line.plan}
          {line.discountCents > 0 && ` · ${t("charges.preview.discount", { amount: formatCurrency(line.discountCents) })}`}
        </p>
      </div>
      <p className="font-semibold">{formatCurrency(line.amountCents)}</p>
      {canAdjust && line.adjustable && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="min-h-11" aria-label={t("charges.preview.changeDue.open", who)} onClick={() => onAct("due")}>
            {t("charges.preview.changeDue.title")}
          </Button>
          <Button type="button" variant="outline" className="min-h-11" aria-label={t("charges.preview.cancel.open", who)} onClick={() => onAct("cancel")}>
            {t("charges.preview.cancel.title")}
          </Button>
          <Button type="button" variant="outline" className="min-h-11" aria-label={t("charges.preview.benefit.open", who)} onClick={() => onAct("benefit")}>
            {t("charges.preview.benefit.title")}
          </Button>
        </div>
      )}
    </li>
  );
}

const dayOf = (iso: string) => String(Number(iso.slice(8, 10)));
const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

// Grupos por dia de vencimento e a seção "Quem não será cobrado e por quê"; depois de cada ação `onChanged` recarrega a prévia.
export function ChargePreviewRows({ data, canAdjust, previousMonth, onChanged }: { data: GenerationPreview; canAdjust: boolean; previousMonth: string; onChanged: () => void }) {
  const { t, i18n } = useTranslation();
  const narrow = useBelowSm();
  const signed = useSigned();
  // Motivo sem texto cai em "Não será cobrado" sem pedir a chave que não existe (o modo estrito do i18n lança) (B14).
  const reasonKey = (r: string) => (i18n.exists(`charges.preview.reasons.${r}`) ? `charges.preview.reasons.${r}` : "charges.preview.reasons.OTHER");
  const [action, setAction] = useState<Action | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const close = () => setAction(null);
  const toggle = (dueOn: string) =>
    setOpen((o) => {
      const next = new Set(o);
      if (!next.delete(dueOn)) next.add(dueOn);
      return next;
    });
  const lines = (day: PreviewDay) => (
    <ul id={`lines-${day.dueOn}`} className="flex flex-col gap-2">
      {day.lines.map((l) => (
        <Line key={l.modalityRowId + l.referenceMonth} line={l} canAdjust={canAdjust} onAct={(kind) => setAction({ kind, line: l, dueOn: day.dueOn })} />
      ))}
    </ul>
  );
  const view = (day: PreviewDay) => (
    <Button
      type="button"
      variant="ghost"
      className="min-h-11"
      aria-expanded={open.has(day.dueOn)}
      aria-controls={`lines-${day.dueOn}`}
      aria-label={t("charges.preview.viewStudentsDay", { day: dayOf(day.dueOn) })}
      onClick={() => toggle(day.dueOn)}
    >
      {t("charges.preview.viewStudents")}
    </Button>
  );
  const label = (day: PreviewDay) => t("charges.preview.dayLabel", { day: dayOf(day.dueOn), date: shortDate(day.generatesOn) });
  const diff = (day: PreviewDay) => signed(day.totalCents - day.previousTotalCents);
  const head = ["due", "count", "total"].map((k) => t(`charges.preview.columns.${k}`));
  return (
    <>
      {data.days.length > 0 && (
        <section aria-labelledby="by-day" className="flex flex-col gap-3">
          <h2 id="by-day" className="font-heading text-2xl font-semibold uppercase">
            {t("charges.preview.byDay")}
          </h2>
          {narrow ? (
            <ul className="flex flex-col gap-3">
              {data.days.map((day) => (
                <li key={day.dueOn} className="flex flex-col gap-2 rounded-md border p-3 text-sm">
                  <p className="font-medium">{label(day)}</p>
                  <p className="text-muted-foreground">
                    {t("charges.preview.cardLine", { count: day.count, total: formatCurrency(day.totalCents) })}
                  </p>
                  <p>{t("charges.preview.diffFor", { month: previousMonth, diff: diff(day) })}</p>
                  {view(day)}
                  {open.has(day.dueOn) && lines(day)}
                </li>
              ))}
            </ul>
          ) : (
            <table className="w-full overflow-hidden rounded-card border bg-card text-sm">
              <thead className="bg-surface-soft text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className={`${cell} font-semibold`}>
                    {head[0]}
                  </th>
                  <th scope="col" className={`${num} font-semibold`}>
                    {head[1]}
                  </th>
                  <th scope="col" className={`${num} font-semibold`}>
                    {head[2]}
                  </th>
                  <th scope="col" className={`${num} font-semibold`}>
                    {t("charges.preview.columns.diff", { month: previousMonth })}
                  </th>
                  <th scope="col" className={cell}>
                    <span className="sr-only">{t("charges.preview.columns.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.days.map((day) => (
                  <Fragment key={day.dueOn}>
                    <tr>
                      <td className={`${cell} font-medium`}>{label(day)}</td>
                      <td className={num}>{day.count}</td>
                      <td className={num}>{formatCurrency(day.totalCents)}</td>
                      <td className={num}>{diff(day)}</td>
                      <td className={`${cell} text-right`}>{view(day)}</td>
                    </tr>
                    {open.has(day.dueOn) && (
                      <tr>
                        <td colSpan={5} className="bg-surface-soft p-3">
                          {lines(day)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
      {data.skipped.length > 0 && (
        <section aria-labelledby="skipped" className="flex flex-col gap-3">
          <h2 id="skipped" className="font-heading text-2xl font-semibold uppercase">
            {t("charges.preview.skipped")}
          </h2>
          {narrow ? (
            <ul className="flex flex-col gap-2">
              {data.skipped.map((s) => (
                <li key={s.studentId + s.modality + s.referenceMonth} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{s.student}</p>
                  <p className="text-muted-foreground">{s.modality}</p>
                  <p>{t(reasonKey(s.reason))}</p>
                </li>
              ))}
            </ul>
          ) : (
            <table className="w-full overflow-hidden rounded-card border bg-card text-sm">
              <thead className="bg-surface-soft text-xs text-muted-foreground">
                <tr>
                  {SKIPPED_COLUMNS.map((k) => (
                    <th key={k} scope="col" className={`${cell} font-semibold`}>
                      {t(`charges.preview.skippedColumns.${k}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.skipped.map((s) => (
                  <tr key={s.studentId + s.modality + s.referenceMonth}>
                    <td className={`${cell} font-medium`}>{s.student}</td>
                    <td className={cell}>{s.modality}</td>
                    <td className={cell}>{t(reasonKey(s.reason))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
      <p className="text-sm text-muted-foreground">{t("charges.preview.note")}</p>
      {action?.kind === "due" && <ChangeDueDialog line={action.line} dueOn={action.dueOn} onClose={close} onDone={onChanged} />}
      {action?.kind === "cancel" && <CancelNextDialog line={action.line} onClose={close} onDone={onChanged} />}
      {action?.kind === "benefit" && (
        <GrantBenefitDialog
          fixed={{ studentId: action.line.studentId, studentName: action.line.student, modalityRowId: action.line.modalityRowId, modalityName: action.line.modality }}
          onClose={close}
          onDone={onChanged}
        />
      )}
    </>
  );
}
