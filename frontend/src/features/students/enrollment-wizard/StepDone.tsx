import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Banknote, CheckCircle2, Smartphone } from "lucide-react";
import { formatMoney } from "@/components/fields/masks";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/features/permissions/usePermissions";
import { RegisterPaymentDialog } from "@/features/payments/RegisterPaymentDialog";
import { formatDate } from "@/lib/format";
import type { StudentDetail } from "../types";
import type { EnrollmentCharge, EnrollmentConcluded } from "./types";

// Etapa 5 (RF-MAT-01, RN-MAT-06, RN-MAT-08, D9): aluno Ativo, convite e dois caminhos de pagamento da primeira cobrança em aberto.
export function StepDone({
  name,
  detail,
  result,
  payNow,
  onBack,
  onRecord,
}: {
  name: string;
  detail?: StudentDetail;
  result: EnrollmentConcluded;
  payNow: boolean;
  onBack: () => void;
  onRecord: () => void;
}) {
  const { t } = useTranslation();
  const k = "enrollmentWizard.done.";
  const { status, permissions, retry } = usePermissions();
  const [paying, setPaying] = useState<EnrollmentCharge>();
  const [paid, setPaid] = useState<Record<string, number>>({});
  const canPay = permissions?.COLLECTIONS === "FULL";
  const label = (c: EnrollmentCharge) => (c.type === "ENROLLMENT_FEE" ? t(`${k}fee`) : t(`${k}monthly`));
  const open = result.charges.filter((c) => paid[c.id] === undefined);
  const next = open[0];
  const lastReceipt = Object.values(paid).at(-1);
  const turma = result.enrollment.modalities[0]?.primaryClass.name ?? "";
  const invite =
    result.inviteStatus === "SENT"
      ? detail?.email
        ? t(`${k}inviteSentTo`, { email: detail.email })
        : t(`${k}invite.SENT`)
      : t(`${k}invite.${result.inviteStatus}`);
  const autoOpened = useRef(false);
  useEffect(() => {
    // D9: a intenção marcada na etapa 4 abre a janela da primeira cobrança, uma vez.
    if (payNow && canPay && next && !autoOpened.current) {
      autoOpened.current = true;
      setPaying(next);
    }
  }, [payNow, canPay, next]);
  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <CheckCircle2 aria-hidden="true" className="size-12 text-ok-foreground" />
      <h2 className="text-xl font-semibold uppercase">{t(`${k}title`, { name })}</h2>
      <p role="status" className="max-w-xl text-sm text-muted-foreground">
        {t(`${k}active`, { turma })} {invite}
      </p>
      {status === "loading" && result.charges.length > 0 && <LoadingState />}
      {status === "error" && <ErrorState onRetry={retry} />}
      <div className="grid w-full gap-4 text-left sm:grid-cols-2">
        <section aria-label={t(`${k}payNow`)} className="flex flex-col gap-2 rounded-lg border p-4">
          <h3 className="flex items-center gap-2 font-medium">
            <Banknote aria-hidden="true" />
            {t(`${k}payNow`)}
          </h3>
          <p className="text-sm text-muted-foreground">{t(`${k}payNowText`)}</p>
          {lastReceipt !== undefined && <p className="text-sm font-medium">{t(`${k}receipt`, { number: lastReceipt })}</p>}
          {status === "ready" && !canPay && result.charges.length > 0 && <p className="text-sm text-muted-foreground">{t(`${k}forbidden`)}</p>}
          {result.charges.length === 0 && <p className="text-sm text-muted-foreground">{t(`${k}noCharges`)}</p>}
          {next && (
            <>
              <p className="text-sm text-muted-foreground">{t(`${k}chargeLine`, { label: label(next), value: formatMoney(next.amountCents), date: formatDate(next.dueOn), days: next.toleranceDays })}</p>
              {canPay && (
                <Button type="button" className="min-h-11" onClick={() => setPaying(next)}>
                  {t(`${k}register`)}
                </Button>
              )}
            </>
          )}
          {!next && result.charges.length > 0 && <p className="text-sm text-muted-foreground">{t(`${k}allPaid`)}</p>}
        </section>
        <section aria-label={t(`${k}portal`)} className="flex flex-col gap-2 rounded-lg border p-4">
          <h3 className="flex items-center gap-2 font-medium">
            <Smartphone aria-hidden="true" />
            {t(`${k}portal`)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {result.charges.length === 0 ? t(`${k}noCharges`) : t(`${k}portalText`, { value: formatMoney(open.reduce((s, c) => s + c.amountCents, 0)) })}
          </p>
          <Button type="button" variant="secondary" className="min-h-11" onClick={onBack}>
            {t(`${k}back`)}
          </Button>
        </section>
      </div>
      <Button type="button" variant="ghost" className="self-end" onClick={onRecord}>
        <ArrowRight aria-hidden="true" />
        {t(`${k}record`, { name })}
      </Button>
      {paying && (
        <RegisterPaymentDialog
          chargeId={paying.id}
          label={label(paying)}
          amountCents={paying.amountCents}
          onClose={() => setPaying(undefined)}
          onPaid={(p) => setPaid((old) => ({ ...old, [paying.id]: p.receipt.number }))}
        />
      )}
    </section>
  );
}
