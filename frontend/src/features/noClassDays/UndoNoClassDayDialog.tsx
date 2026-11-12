import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { deleteDay, type NoClassDayItem } from "./useNoClassDays";
import { Banner } from "@/components/ui/banner";
import { Checkbox } from "@/components/ui/checkbox";

// RF-AGE-05: desfazer um dia futuro. "Avisar as turmas" só vai para a auditoria até a Sprint 09; a unidade desfaz só o seu dia.
export function UndoNoClassDayDialog({ item, period, onClose, onDone }: { item: NoClassDayItem; period: string; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [notify, setNotify] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true);
    try {
      await deleteDay(item.id, notify);
      onClose();
      onDone();
    } catch (e) {
      setError(t(`noClassDays.undoDialog.errors.${e instanceof ApiError && [403, 404, 409].includes(e.status) ? e.status : "generic"}`));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      size="sm"
      onOpenChange={(o) => !o && !busy && onClose()}
      title={t("noClassDays.undoDialog.title")}
      footer={
        <>
          <Button variant="secondary" className="min-h-11" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button variant="dangerSolid" className="min-h-11" onClick={() => void confirm()} disabled={busy}>
            {t("noClassDays.undoDialog.confirm")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p>{t("noClassDays.undoDialog.summary", { period, reason: item.reason })}</p>
        <Checkbox label={t("noClassDays.undoDialog.notify")} checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        {error && <Banner tone="danger">{error}</Banner>}
      </div>
    </Modal>
  );
}
