import { useTranslation } from "react-i18next";
import { RowCard } from "@/components/query/RowCard";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatTime, relativeDay } from "@/lib/format";
import type { ProofGroup } from "./groupProofs";
import type { PaymentProof } from "./types";

export type Decision = { proof: PaymentProof; mode: "confirm" | "refuse" };
export type ProofHandlers = { onDecide: (d: Decision) => void; onReview: (g: ProofGroup) => void };

// "hoje", "ontem" ou "dd/mm".
export function useSentDay() {
  const { t } = useTranslation();
  return (sentAt: string) => {
    const days = relativeDay(sentAt);
    return days === 0 ? t("paymentProofs.today") : days === 1 ? t("paymentProofs.yesterday") : formatDate(sentAt).slice(0, 5);
  };
}

// Um comprovante de uma cobrança decide direto; o de várias abre a janela, que decide cada cobrança (RN-COB-14).
export function GroupActions({ group, onDecide, onReview, confirmLabel }: { group: ProofGroup; confirmLabel?: string } & ProofHandlers) {
  const { t } = useTranslation();
  if (group.items.length > 1)
    return (
      <Button className="min-h-11" aria-label={t("paymentProofs.actions.reviewFor", { student: group.studentName })} onClick={() => onReview(group)}>
        {t("paymentProofs.actions.review")}
      </Button>
    );
  const proof = group.items[0];
  return (
    <span className="flex flex-wrap gap-2">
      <Button className="min-h-11" aria-label={t("paymentProofs.actions.confirmFor", { student: group.studentName })} onClick={() => onDecide({ proof, mode: "confirm" })}>
        {confirmLabel ?? t("paymentProofs.actions.confirm")}
      </Button>
      <Button variant="outline" className="min-h-11" aria-label={t("paymentProofs.actions.refuseFor", { student: group.studentName })} onClick={() => onDecide({ proof, mode: "refuse" })}>
        {t("paymentProofs.actions.refuse")}
      </Button>
    </span>
  );
}

// Cartão do celular (canvas): avatar, aluno, "Modalidade · mês · enviado hoje HHhMM", valor, "Comprovante" e as ações.
export function ProofCard({ group, onDecide, onReview }: { group: ProofGroup } & ProofHandlers) {
  const { t } = useTranslation();
  const day = useSentDay();
  const first = group.items[0];
  return (
    <RowCard
      lead={<Avatar name={group.studentName} decorative />}
      title={group.studentName}
      meta={
        <>
          <span>{t("paymentProofs.mobileLine", { reference: group.label, day: day(group.sentAt), time: formatTime(group.sentAt) })}</span>
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-medium tabular-nums text-foreground">{formatCurrency(group.totalCents)}</span>
            {first.imageUrl ? (
              <a className="inline-flex min-h-11 items-center underline" href={first.imageUrl} target="_blank" rel="noreferrer">
                {t("paymentProofs.mobileProof")}
                <span className="sr-only"> {t("paymentProofs.image.alt", { student: group.studentName })}</span>
              </a>
            ) : (
              <span>{t("paymentProofs.image.unavailable")}</span>
            )}
          </span>
          <span className="mt-1">
            <GroupActions group={group} onDecide={onDecide} onReview={onReview} />
          </span>
        </>
      }
    />
  );
}

