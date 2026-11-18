import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Field } from "@/components/ui/field";

// Janela de data e hora do envio (celular e janela da organização): só confirma com um instante futuro; o servidor confere de novo.
export function ScheduleDialog({ error, busy, onConfirm, onClose }: { error?: string; busy?: boolean; onConfirm: (sendAt: string) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [local, setLocal] = useState("");
  function confirm() {
    if (!value || new Date(value).getTime() <= Date.now()) {
      setLocal(t("announcements.new.fields.sendAt"));
      return;
    }
    setLocal("");
    onConfirm(new Date(value).toISOString());
  }
  return (
    <Modal
      open
      size="sm"
      scrim="canvas"
      title={t("announcements.new.scheduleTitle")}
      onOpenChange={(o) => !o && !busy && onClose()}
      footer={
        <>
          <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>
            {t("announcements.new.scheduleBack")}
          </Button>
          <Button type="button" className="min-h-11" disabled={busy} onClick={confirm}>
            {t("announcements.new.scheduleConfirm")}
          </Button>
        </>
      }
    >
      <Field label={t("announcements.new.sendAt")} error={local || error} hint={t("announcements.new.scheduleHint")}>
        {(c) => <DateField {...c} type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} />}
      </Field>
    </Modal>
  );
}
