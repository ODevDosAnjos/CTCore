import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { deactivateClass, type ClassDetail } from "./useClasses";
import { Banner } from "@/components/ui/banner";

type Blocker = { name: string; modality: string };
const MAX_LISTED = 5;

// RN-TUR-03: com aluno que tem a turma como principal, a janela abre bloqueada com a lista (do painel ou do 409) e não oferece confirmar; o servidor reconfere.
export function DeactivateClassDialog({ klass, onClose, onDone }: { klass: ClassDetail | null; onClose: () => void; onDone: () => void }) {
  if (!klass) return null;
  return <Body key={klass.id} klass={klass} onClose={onClose} onDone={onDone} />;
}

function Body({ klass, onClose, onDone }: { klass: ClassDetail; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [blocked, setBlocked] = useState<{ count: number; list: Blocker[] }>({ count: klass.deactivation.blockingStudents, list: klass.deactivation.blockingList });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setError(undefined);
    setBusy(true);
    try {
      await deactivateClass(klass.id);
    } catch (e) {
      setBusy(false);
      if (e instanceof ApiError && e.code === "HAS_PRIMARY_STUDENTS") {
        // A lista vem no próprio 409: "Nome · Modalidade" por aluno, sem segunda chamada.
        const list = e.fields
          .filter((f) => f.field === "student")
          .map((f) => {
            const [name, modality = ""] = f.message.split(" · ");
            return { name, modality };
          });
        setBlocked({ count: Number(e.fields.find((f) => f.field === "primaryStudents")?.message) || list.length || 1, list });
      } else setError(t(`classes.panel.deactivateDialog.errors.${e instanceof ApiError && ["FORBIDDEN", "CONFLICT"].includes(e.code) ? e.code : "generic"}`));
      return;
    }
    setBusy(false);
    onClose();
    onDone();
  }

  const k = "classes.panel.deactivateDialog";
  const listed = blocked.list.slice(0, MAX_LISTED);
  const more = blocked.count - listed.length;
  return (
    <Modal
      open
      size="sm"
      scrim="canvas"
      onOpenChange={(o) => !o && !busy && onClose()}
      title={t(`${k}.title`)}
      footer={
        blocked.count > 0 ? (
          <Button type="button" className="min-h-11" onClick={onClose}>
            {t("common.close")}
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" className="min-h-11" onClick={onClose} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button type="button" variant="dangerSolid" className="min-h-11" disabled={busy} onClick={() => void confirm()}>
              {t(`${k}.confirm`)}
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-3" aria-busy={busy}>
        <p className="text-sm text-muted-foreground">{t(`${k}.subtitle`, { name: klass.name, unit: klass.unit.name })}</p>
        <p className="text-sm">{t(`${k}.explain`)}</p>
        {blocked.count > 0 && (
          <Banner tone="danger">
            <p className="font-semibold">{t(`${k}.blockedHead`)}</p>
            <ul className="mt-1 flex flex-col gap-0.5">
              {listed.map((s) => (
                <li key={`${s.name}-${s.modality}`}>{`${s.name} · ${s.modality}`}</li>
              ))}
              {more > 0 && <li>{t(`${k}.more`, { count: more })}</li>}
            </ul>
            <p className="mt-2">{t(`${k}.blockedHelp`)}</p>
          </Banner>
        )}
        {error && <Banner tone="danger">{error}</Banner>}
      </div>
    </Modal>
  );
}
