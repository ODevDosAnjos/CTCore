import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/states";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

// Espelha ModalityConfirmationItem do OpenAPI.
interface Item {
  modalityRowId: string;
  studentId: string;
  studentName: string;
  modality: string;
  unit: string;
  plan: string;
  planValueCents: number;
}

// RN-MAT-13: confirmação curta (plano e valor) da modalidade nova. Não bloqueia nada: janela que abre sozinha, "Depois" fecha até recarregar; sem pendência, não aparece.
export function ModalityConfirmations() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [failed, setFailed] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [agreed, setAgreed] = useState(false);
  useEffect(() => {
    let alive = true;
    api<Item[]>("/portal/modality-confirmations").then(
      (data) => {
        if (!alive) return;
        setLoadFailed(false);
        setItems(data);
      },
      () => alive && setLoadFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [tick]);
  const confirm = async (item: Item) => {
    setFailed(false);
    try {
      await api(`/portal/modality-confirmations/${item.modalityRowId}`, { method: "POST" });
      setAgreed(false);
      setItems((all) => all.filter((i) => i.modalityRowId !== item.modalityRowId));
    } catch {
      setFailed(true);
    }
  };
  if (loadFailed)
    return (
      <Card heading="h2" title={t("portalConfirm.title")} className="mt-6">
        <ErrorState onRetry={() => setTick((n) => n + 1)} />
      </Card>
    );
  const item = items[0];
  if (!item || dismissed) return null;
  return (
    <Modal
      open
      onOpenChange={(o) => !o && setDismissed(true)}
      title={t("portalConfirm.title")}
      size="sm"
      scrim="canvas"
      className="max-sm:bottom-0 max-sm:left-0 max-sm:top-auto max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none"
      footer={
        <>
          <Button variant="outline" className="min-h-11" onClick={() => setDismissed(true)}>
            {t("portalConfirm.later")}
          </Button>
          <Button className="min-h-11" disabled={!agreed} onClick={() => confirm(item)}>
            {t("portalConfirm.confirm")}
          </Button>
        </>
      }
    >
      <p className="mb-3 break-words text-sm">{t("portalConfirm.student", { student: item.studentName })}</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th scope="col" className="py-1 font-medium">{t("portalConfirm.modality")}</th>
            <th scope="col" className="py-1 font-medium">{t("portalConfirm.plan")}</th>
            <th scope="col" className="py-1 text-right font-medium">{t("portalConfirm.value")}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="py-2 break-words">{item.modality} · {item.unit}</td>
            <td className="py-2 break-words">{item.plan}</td>
            <td className="py-2 text-right">{formatCurrency(item.planValueCents)}</td>
          </tr>
        </tbody>
      </table>
      <Checkbox className="mt-3" label={t("portalConfirm.agree")} checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
      {failed && (
        <p role="alert" className="mt-2 text-sm text-danger-foreground">
          {t("portalConfirm.error")}
        </p>
      )}
    </Modal>
  );
}
