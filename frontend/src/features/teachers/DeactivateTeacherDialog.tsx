import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorState, LoadingState } from "@/components/states";
import { ApiError } from "@/lib/api";
import { deactivateTeacher, fetchDeactivationPreview, type DeactivationPreview, type TeacherDetail } from "./useTeachers";
import { Banner } from "@/components/ui/banner";

const KNOWN = ["FORBIDDEN", "CONFLICT"];

// RF-PRO-04: mostra as turmas que ficarão sem titular e confirma; o servidor reconfere alcance e situação.
export function DeactivateTeacherDialog({ teacher, onClose, onDone }: { teacher: TeacherDetail | null; onClose: () => void; onDone: () => void }) {
  if (!teacher) return null;
  return <Body key={teacher.id} teacher={teacher} onClose={onClose} onDone={onDone} />;
}

function Body({ teacher, onClose, onDone }: { teacher: TeacherDetail; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [tick, setTick] = useState(0);
  const [loaded, setLoaded] = useState<{ tick: number; preview?: DeactivationPreview }>();
  const [form, setForm] = useState<string>();

  useEffect(() => {
    let alive = true;
    fetchDeactivationPreview(teacher.id).then(
      (preview) => alive && setLoaded({ tick, preview }),
      () => alive && setLoaded({ tick }),
    );
    return () => {
      alive = false;
    };
  }, [teacher.id, tick]);
  const current = loaded?.tick === tick ? loaded : undefined;
  const preview = current?.preview;

  async function confirm() {
    setForm(undefined);
    try {
      await deactivateTeacher(teacher.id);
    } catch (e) {
      setForm(t(`teachers.panel.deactivateDialog.errors.${e instanceof ApiError && KNOWN.includes(e.code) ? e.code : "generic"}`));
      throw e; // a janela segue aberta
    }
    onDone();
  }

  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && onClose()}
      tone="danger"
      size="sm"
      title={t("teachers.panel.deactivateDialog.title", { name: teacher.name })}
      summary={t("teachers.panel.deactivateDialog.accessEnds")}
      confirmLabel={t("teachers.panel.deactivateDialog.confirm")}
      confirmDisabled={!preview?.canDeactivate}
      onConfirm={confirm}
    >
      <div className="flex flex-col gap-3" aria-busy={!current}>
        {!current && <LoadingState />}
        {current && !preview && <ErrorState onRetry={() => setTick((n) => n + 1)} />}
        {preview && (
          <>
            {preview.headClasses.length > 0 ? (
              <>
                <p className="text-sm">{t("teachers.panel.deactivateDialog.withoutHead")}</p>
                <ul className="list-disc pl-5 text-sm">
                  {preview.headClasses.map((c) => (
                    <li key={c.id} className="break-words">
                      {c.name}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm">{t("teachers.panel.deactivateDialog.noClasses")}</p>
            )}
            {!preview.canDeactivate && <Banner tone="danger">{t("teachers.panel.deactivateDialog.outOfReach")}</Banner>}
          </>
        )}
        {form && <Banner tone="danger">{form}</Banner>}
      </div>
    </ConfirmDialog>
  );
}
