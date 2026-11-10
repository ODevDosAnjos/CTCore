import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { GrantBenefitDialog } from "@/features/benefits/GrantBenefitDialog";
import { usePortalRequest } from "@/features/portal-requests/usePortalRequests";
import { ChangeClassDialog } from "./ChangeClassDialog";
import { ChangePlanDialog } from "./ChangePlanDialog";
import { EndModalityDialog } from "./EndModalityDialog";
import { NewEnrollmentLink } from "./NewEnrollmentLink";
import { TransferDialog } from "./TransferDialog";
import type { useEnrollment } from "./useStudentRecord";
import type { Enrollment, EnrollmentModality } from "./types";

const MAX_ACTIVE = 10;
const SITUATION = ["inactivate", "reactivate", "cancelCharges"] as const;
type Action = { kind: "class" | "plan" | "transfer" | "end" | "benefit"; row: EnrollmentModality; initial?: string };

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}

function ModalityCard({ row, onAction, canGrant }: { row: EnrollmentModality; onAction: (a: Action) => void; canGrant: boolean }) {
  const { t } = useTranslation();
  const k = "students.record.enrollment.";
  const active = row.status === "ACTIVE";
  return (
    <li className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">{row.modality.name}</p>
        <StatusBadge status={active ? "ACTIVE" : "ENDED"} label={t(active ? `${k}active` : `${k}ended`)} />
        {active && row.closureRequestedAt && <StatusBadge status="PENDING" label={t(`${k}closureRequested`)} />}
      </div>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <Line label={t(`${k}unit`)} value={row.unit.name} />
        <Line label={t(`${k}primaryClass`)} value={row.primaryClass.name} />
        <Line label={t(`${k}otherClasses`)} value={row.otherClasses.map((c) => c.name).join(", ") || "—"} />
        <Line label={t(`${k}planLabel`)} value={row.plan.name} />
        <Line label={t(`${k}dueDay`)} value={t(`${k}dueDayValue`, { day: row.dueDay })} />
      </dl>
      {row.nextPlan && <p className="text-sm">{t(`${k}nextPlan`, { plan: row.nextPlan.name })}</p>}
      {active && !row.canEdit && <p className="text-sm text-muted-foreground">{t(`${k}readOnly`)}</p>}
      {active && (
        <div className="flex flex-wrap gap-2">
          {row.canEdit && (
            <>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => onAction({ kind: "class", row })}>
{t(`${k}actions.class`)}
</Button>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => onAction({ kind: "plan", row })}>
{t(`${k}actions.plan`)}
</Button>
              {canGrant && (
                <Button type="button" variant="outline" className="min-h-11" onClick={() => onAction({ kind: "benefit", row })}>
{t(`${k}actions.benefit`)}
</Button>
              )}
              <Button type="button" variant="outline" className="min-h-11" onClick={() => onAction({ kind: "transfer", row })}>
{t(`${k}actions.transfer`)}
</Button>
              <Button type="button" variant="danger" className="min-h-11" onClick={() => onAction({ kind: "end", row })}>
{t(`${k}actions.end`)}
</Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

// RF-ALU-03 (R23): matrícula e modalidades do aluno, com as trocas por modalidade (só nas que a pessoa pode alterar). O servidor decide `canEdit`; a barreira é dele.
export function RecordEnrollment({ studentId, studentName, enrollment, canGrant = false, onChanged }: { studentId: string; studentName: string; enrollment: ReturnType<typeof useEnrollment>; canGrant?: boolean; onChanged: () => void }) {
  const { t } = useTranslation();
  const [picked, setAction] = useState<Action>();
  const [dismissed, setDismissed] = useState(false);
  const { status, data, reload } = enrollment;
  // R18 (D4): a ficha chega com `?pedido=<id>` depois do Aprovar; a troca pedida abre já preenchida, uma só vez.
  const pedido = useSearchParams()[0].get("pedido");
  const asked = usePortalRequest(pedido).request;
  const fromRequest = useMemo<Action | undefined>(() => {
    const row = data?.modalities.find((m) => m.id === asked?.modalityRowId && m.status === "ACTIVE" && m.canEdit);
    if (!asked || asked.studentId !== studentId || !row) return undefined;
    if (asked.kind === "CLASS_CHANGE" && asked.targetClassId) return { kind: "class", row, initial: asked.targetClassId };
    if (asked.kind === "PLAN_CHANGE" && asked.targetPlanId) return { kind: "plan", row, initial: asked.targetPlanId };
    return undefined;
  }, [asked, data, studentId]);
  const action = picked ?? (dismissed ? undefined : fromRequest);
  if (status === "loading" || status === "idle") return <LoadingState />;
  if (status === "forbidden") return <ForbiddenState />;
  if (status === "error" || status === "notFound" || !data) return <ErrorState onRetry={reload} />;
  if (data.modalities.length === 0) return <EmptyState title={t("students.record.enrollment.emptyTitle")} text={t("students.record.enrollment.emptyText")} action={<NewEnrollmentLink studentId={studentId} />} />;
  const activeCount = data.modalities.filter((m) => m.status === "ACTIVE").length;
  // D6: "Adicionar modalidade" some para quem só lê; ex-aluno sempre pode recomeçar pelo assistente.
  const canAdd = data.status === "FORMER" || data.modalities.some((m) => m.status === "ACTIVE" && m.canEdit);
  const done = () => {
    reload();
    onChanged();
  };
  const props = {
    studentId,
    onClose: () => {
      setAction(undefined);
      setDismissed(true);
    },
    onDone: done,
  };
  return (
    <>
      {canAdd && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">{t("students.record.enrollment.limitLine")}</p>
          <NewEnrollmentLink studentId={studentId} label={t("students.record.enrollment.add")} disabled={activeCount >= MAX_ACTIVE} />
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {data.modalities.map((row) => (
          <ModalityCard key={row.id} row={row} onAction={setAction} canGrant={canGrant} />
        ))}
      </ul>
      <section aria-labelledby="record-situation" className="flex flex-col gap-3 rounded-md border p-3">
        <h2 id="record-situation" className="font-medium">{t("students.record.enrollment.situation.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("students.record.enrollment.situation.text")}</p>
        <div className="flex flex-wrap gap-2">
          {SITUATION.map((x) => (
            <ComingSoon key={x} variant="button" label={t(`students.record.enrollment.situation.${x}`)} />
          ))}
        </div>
      </section>
      {action?.kind === "class" && <ChangeClassDialog {...props} row={action.row} initial={action.initial} />}
      {action?.kind === "plan" && <ChangePlanDialog {...props} row={action.row} initial={action.initial} />}
      {action?.kind === "benefit" && (
        <GrantBenefitDialog
          fixed={{ studentId, studentName, modalityRowId: action.row.id, modalityName: action.row.modality.name }}
          onClose={props.onClose}
          onDone={done}
        />
      )}
      {action?.kind === "transfer" && <TransferDialog {...props} enrollment={data as Enrollment} row={action.row} />}
      {action?.kind === "end" && <EndModalityDialog {...props} studentName={studentName} row={action.row} others={data.modalities.filter((m) => m.status === "ACTIVE" && m.id !== action.row.id).map((m) => m.modality.name)} />}
    </>
  );
}
