import { useTranslation } from "react-i18next";
import { Person } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
import { StatusBadge } from "@/features/charges/ChargeCards";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import type { ProofGroup } from "./groupProofs";
import { ProofImage } from "./ProofImage";
import { GroupActions, type ProofHandlers } from "./ProofRows";

// R9: o primeiro comprovante da fila em destaque, com tudo o que a pessoa confere antes de confirmar. A imagem é a que o aluno enviou (D8).
export function ProofFeatured({ group, onDecide, onReview }: { group: ProofGroup } & ProofHandlers) {
  const { t } = useTranslation();
  const first = group.items[0];
  const rows: [string, string][] = [
    [t("paymentProofs.featured.amount"), formatCurrency(group.totalCents)],
    [t("paymentProofs.featured.sentAt"), t("paymentProofs.featured.sentValue", { date: formatDate(group.sentAt), time: formatTime(group.sentAt) })],
    [t("paymentProofs.featured.key"), first.unitPixKey ?? t("format.empty")],
    [t("paymentProofs.featured.block"), t("paymentProofs.featured.blockPaused")],
  ];
  return (
    <section aria-label={t("paymentProofs.featured.label", { student: group.studentName })} className="grid gap-6 rounded-card border bg-card p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:p-6">
      <div className="flex min-h-48 items-center justify-center rounded-md border bg-surface-soft p-2">
        <ProofImage proof={first} large />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <Person name={group.studentName} />
            <p className="mt-1 break-words text-sm text-muted-foreground">{t("paymentProofs.featured.line", { unit: group.unit, reference: group.label })}</p>
          </div>
          <StatusBadge status="IN_REVIEW" />
        </div>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="break-words">{v}</dd>
            </div>
          ))}
        </dl>
        <Banner tone="info">{t("paymentProofs.featured.check", { unit: group.unit })}</Banner>
        <GroupActions group={group} onDecide={onDecide} onReview={onReview} confirmLabel={t("paymentProofs.featured.confirm")} />
      </div>
    </section>
  );
}
