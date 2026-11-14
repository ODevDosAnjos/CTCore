import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatMoney } from "@/components/fields/masks";
import { Modal } from "@/components/Modal";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { SummaryBox } from "@/components/ui/summary-box";
import { ApiError } from "@/lib/api";
import { deactivatePlan, type PlanRow } from "./usePlans";

// RN-PLA-06: desativar pede confirmação; nada é apagado e o plano pode ser reativado. O servidor reconfere a permissão.
export function DeactivatePlanDialog({ plan, onClose, onDone }: { plan: PlanRow | null; onClose: () => void; onDone: () => void }) {
  if (!plan) return null;
  return <Body key={plan.id} plan={plan} onClose={onClose} onDone={onDone} />;
}

function Body({ plan, onClose, onDone }: { plan: PlanRow; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setError(undefined);
    setBusy(true);
    try {
      await deactivatePlan(plan.id);
    } catch (e) {
      setBusy(false);
      setError(t(`plans.deactivateDialog.errors.${e instanceof ApiError && e.code === "FORBIDDEN" ? "FORBIDDEN" : "generic"}`));
      return;
    }
    setBusy(false);
    onClose();
    onDone();
  }

  const k = "plans.deactivateDialog.";
  return (
    <Modal
      open
      size="sm"
      onOpenChange={(o) => !o && !busy && onClose()}
      title={t(`${k}title`)}
      footer={
        <>
          <Button type="button" variant="outline" className="min-h-11" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="danger" className="min-h-11" disabled={busy} onClick={() => void confirm()}>
            {t(`${k}confirm`)}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4" aria-busy={busy}>
        <p className="-mt-2 text-sm text-muted-foreground">{t(`${k}subtitle`, { modality: plan.modality.name, plan: plan.name, value: formatMoney(plan.valueCents) })}</p>
        <p className="text-sm">
          {t(`${k}explain`)} {plan.studentsUsing > 0 && t(`${k}users`, { count: plan.studentsUsing })}
        </p>
        <SummaryBox label={t(`${k}summary`)} items={[t(`${k}items.charges`), t(`${k}items.readonly`), t(`${k}items.reactivate`)]} />
        {error && <Banner tone="danger">{error}</Banner>}
      </div>
    </Modal>
  );
}
