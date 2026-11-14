import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Person } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { referenceLabel, type ProofGroup } from "./groupProofs";
import { ConfirmProofDialog, RefuseProofDialog } from "./ProofDialogs";
import { ProofImage } from "./ProofImage";
import type { Decision } from "./ProofRows";

// R12 (RN-COB-14): a janela "Conferir comprovante". Um comprovante de várias cobranças aparece junto, mas cada cobrança é confirmada ou recusada
// separadamente, pelas mesmas janelas de confirmação e de motivo. Ao decidir a última, a janela fecha; "Fechar" fecha sem decidir o resto.
export function ProofReviewDialog({
  group,
  onClose,
  onDone,
}: {
  group: ProofGroup;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [decided, setDecided] = useState<string[]>([]);
  const [decision, setDecision] = useState<Decision>();
  const left = group.items.filter((p) => !decided.includes(p.id));
  const close = () => {
    if (decided.length > 0) onDone();
    onClose();
  };
  const decide = (id: string) => {
    const rest = left.filter((p) => p.id !== id);
    setDecided((d) => [...d, id]);
    if (rest.length === 0) {
      onDone();
      onClose();
    }
  };
  return (
    <>
      <Modal
        open
        onOpenChange={(o) => !o && close()}
        title={t("paymentProofs.review.title")}
        size="lg"
        className="max-w-[900px]"
        footer={
          <Button variant="outline" className="min-h-11" onClick={close}>
            {t("paymentProofs.review.close")}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <Person name={group.studentName} />
              <p className="mt-1 text-sm text-muted-foreground">
                {t("paymentProofs.review.sent", {
                  unit: group.unit,
                  date: formatDate(group.sentAt).slice(0, 5),
                  time: formatTime(group.sentAt),
                })}
              </p>
            </div>
            <Badge tone="info">
              {t("paymentProofs.review.badge", { count: group.items.length })}
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border bg-surface-soft p-3">
              <p className="mb-2 text-sm font-medium">
                {t("paymentProofs.review.card", {
                  amount: formatCurrency(group.totalCents),
                })}
              </p>
              <ProofImage proof={group.items[0]} large />
            </div>
            <ul className="flex flex-col gap-3">
              {group.items.map((p) => {
                const done = decided.includes(p.id);
                return (
                  <li
                    key={p.id}
                    className="flex flex-col gap-3 rounded-card border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium">
                          {referenceLabel(p.reference)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("paymentProofs.review.dueOn", {
                            date: formatDate(p.dueOn).slice(0, 5),
                          })}
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(p.amountCents)}
                      </span>
                    </div>
                    {done ? (
                      <span className="text-sm text-muted-foreground">
                        {t("paymentProofs.review.decided")}
                      </span>
                    ) : (
                      <span className="flex gap-2">
                        <Button
                          className="min-h-11"
                          aria-label={t("paymentProofs.review.confirmFor", {
                            reference: referenceLabel(p.reference),
                          })}
                          onClick={() =>
                            setDecision({ proof: p, mode: "confirm" })
                          }
                        >
                          {t("paymentProofs.actions.confirm")}
                        </Button>
                        <Button
                          variant="ghost"
                          className="min-h-11"
                          aria-label={t("paymentProofs.review.refuseFor", {
                            reference: referenceLabel(p.reference),
                          })}
                          onClick={() =>
                            setDecision({ proof: p, mode: "refuse" })
                          }
                        >
                          {t("paymentProofs.actions.refuse")}
                        </Button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("paymentProofs.review.note")}
          </p>
        </div>
      </Modal>
      {decision?.mode === "confirm" && (
        <ConfirmProofDialog
          proof={decision.proof}
          onClose={() => setDecision(undefined)}
          onDone={() => decide(decision.proof.id)}
        />
      )}
      {decision?.mode === "refuse" && (
        <RefuseProofDialog
          proof={decision.proof}
          onClose={() => setDecision(undefined)}
          onDone={() => decide(decision.proof.id)}
        />
      )}
    </>
  );
}
