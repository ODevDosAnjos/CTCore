import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { SummaryBox } from "@/components/ui/summary-box";
import { ApiError } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";
import type { AnnouncementItem } from "./types";
import { cancelAnnouncement } from "./useAnnouncements";

// RN-COM-06: confirma o cancelamento do agendado. O erro do servidor (enviado, já apagado, sem permissão) aparece na janela;
// o 409 não tira a linha da lista, e o 404 recarrega (a linha já não existe).
export function CancelAnnouncementDialog({ announcement, onClose, onDone }: { announcement: AnnouncementItem; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await cancelAnnouncement(announcement.id);
      onDone();
      onClose();
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      if (status === 404) {
        onDone();
        onClose();
        return;
      }
      setError(t(status === 409 ? "announcements.cancel.sent" : status === 403 ? "announcements.cancel.forbidden" : "announcements.cancel.error"));
    } finally {
      setBusy(false);
    }
  }

  const target = t(`announcements.target.${announcement.target.kind}`, { name: announcement.target.name });
  const count = announcement.estimatedRecipients;
  const summary = [
    t("announcements.cancel.summaryWhen", { title: announcement.title, date: formatDate(announcement.date).slice(0, 5), time: formatTime(announcement.date) }),
    count === null ? t("announcements.cancel.summaryTargetNone", { target }) : t("announcements.cancel.summaryTarget", { target, count }),
  ];

  return (
    <Modal
      open
      size="sm"
      scrim="canvas"
      onOpenChange={(o) => !o && !busy && onClose()}
      title={t("announcements.cancel.title")}
      footer={
        <>
          <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>
            {t("announcements.cancel.keep")}
          </Button>
          <Button type="button" variant="danger" className="min-h-11" disabled={busy} onClick={confirm}>
            {t("announcements.cancel.submit")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p>{t("announcements.cancel.intro")}</p>
        <SummaryBox label={t("announcements.cancel.summaryLabel")} items={summary} />
        {error && <Banner tone="danger">{error}</Banner>}
      </div>
    </Modal>
  );
}
