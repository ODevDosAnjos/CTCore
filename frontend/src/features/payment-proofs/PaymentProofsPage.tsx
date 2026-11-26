import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { DataTable, type Column } from "@/components/query/DataTable";
import { useBelowSm } from "@/components/query/useBelowSm";
import { Person } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SupportLink } from "@/features/auth/SupportContact";
import { ALL, useUnitScope } from "@/features/units/UnitScopeProvider";
import { formatCurrency } from "@/lib/format";
import { groupProofs, type ProofGroup } from "./groupProofs";
import { ConfirmProofDialog, RefuseProofDialog } from "./ProofDialogs";
import { ProofFeatured } from "./ProofFeatured";
import { ProofCard, useSentDay, type Decision } from "./ProofRows";
import { ProofReviewDialog } from "./ProofReviewDialog";
import type { PaymentProof } from "./types";
import { fetchPendingProofs } from "./usePaymentProofs";

type Load = { state: "loading" } | { state: "error" } | { state: "forbidden" } | { state: "ok"; proofs: PaymentProof[] };

function Content() {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  const day = useSentDay();
  const scope = useUnitScope();
  const unitId = scope.selected && scope.selected !== ALL ? scope.selected : undefined;
  const [version, setVersion] = useState(0);
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [decision, setDecision] = useState<Decision>();
  const [reviewing, setReviewing] = useState<ProofGroup>();
  const reload = () => {
    setLoad({ state: "loading" });
    setVersion((n) => n + 1);
  };

  useEffect(() => {
    if (scope.status === "loading") return;
    let alive = true;
    fetchPendingProofs(unitId).then(
      (proofs) => alive && setLoad({ state: "ok", proofs }),
      (e: { status?: number }) => alive && setLoad({ state: e?.status === 403 ? "forbidden" : "error" }),
    );
    return () => {
      alive = false;
    };
  }, [version, unitId, scope.status]);

  const groups = useMemo(() => (load.state === "ok" ? groupProofs(load.proofs) : []), [load]);
  const handlers = { onDecide: setDecision, onReview: setReviewing };
  const [featured, ...others] = groups;

  const columns: Column<ProofGroup>[] = [
    { key: "student", label: t("paymentProofs.columns.student"), render: (g) => <Person name={g.studentName} size="sm" /> },
    { key: "reference", label: t("paymentProofs.columns.reference"), render: (g) => <span className="break-words">{g.label}</span> },
    { key: "amount", label: t("paymentProofs.columns.amount"), numeric: true, render: (g) => <span className="whitespace-nowrap tabular-nums">{formatCurrency(g.totalCents)}</span> },
    { key: "sentAt", label: t("paymentProofs.columns.sentAt"), render: (g) => day(g.sentAt) },
    {
      key: "actions",
      label: t("paymentProofs.columns.actions"),
      hideLabel: true,
      render: (g) => (
        <span className="flex justify-end">
          <Button variant="outline" className="min-h-11" aria-label={t("paymentProofs.actions.reviewFor", { student: g.studentName })} onClick={() => setReviewing(g)}>
            {t("paymentProofs.actions.review")}
          </Button>
        </span>
      ),
    },
  ];

  let body;
  if (load.state === "loading") body = <LoadingState variant="card" />;
  else if (load.state === "error") body = <ErrorState variant="card" title={t("charges.errorTitle")} text={t("charges.errorText")} secondary={<SupportLink />} onRetry={reload} />;
  else if (load.state === "forbidden") body = <ForbiddenState variant="card" />;
  else if (groups.length === 0) body = <EmptyState variant="card" title={t("paymentProofs.emptyTitle")} text={t("paymentProofs.emptyText")} />;
  else if (narrow)
    body = (
      <ul className="flex flex-col gap-3">
        {groups.map((g) => (
          <li key={g.key} className="rounded-md border p-3">
            <ProofCard group={g} {...handlers} />
          </li>
        ))}
      </ul>
    );
  else
    body = (
      <>
        <ProofFeatured group={featured} {...handlers} />
        {others.length > 0 && (
          <section aria-labelledby="proofs-waiting" className="flex flex-col gap-3">
            <h2 id="proofs-waiting" className="font-heading text-2xl font-semibold uppercase">
              {t("paymentProofs.waiting")}
            </h2>
            <div className="overflow-hidden rounded-card border bg-card">
              <DataTable columns={columns} rows={others} rowKey={(g) => g.key} order="" onOrder={() => {}} />
            </div>
          </section>
        )}
      </>
    );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("paymentProofs.title")} />
      {!narrow && <p className="text-muted-foreground">{t("paymentProofs.intro")}</p>}
      {body}
      {decision?.mode === "confirm" && <ConfirmProofDialog proof={decision.proof} onClose={() => setDecision(undefined)} onDone={reload} />}
      {decision?.mode === "refuse" && <RefuseProofDialog proof={decision.proof} onClose={() => setDecision(undefined)} onDone={reload} />}
      {reviewing && <ProofReviewDialog group={reviewing} onClose={() => setReviewing(undefined)} onDone={reload} />}
    </div>
  );
}

// RF-COB-05: comprovantes de Pix na chave em conferência; a barreira de dados é o servidor (403 vira "sem permissão" na própria tela).
export function PaymentProofsPage() {
  return <Content />;
}
