import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { ApiError } from "@/lib/api";
import { fetchAccessRemoval, removeTeacherAccess, type AccessRemoval, type TeacherDetail } from "./useTeachers";

const KNOWN = ["FORBIDDEN", "CONFLICT", "NOT_FOUND"];

// RN-PRO-02: tira o acesso sem inativar o cadastro; o resumo vem do servidor, que também reconfere alcance e situação.
export function RemoveTeacherAccessDialog({ teacher, onClose, onDone }: { teacher: TeacherDetail | null; onClose: () => void; onDone: () => void }) {
  if (!teacher) return null;
  return <Body key={teacher.id} teacher={teacher} onClose={onClose} onDone={onDone} />;
}

type Loaded = { tick: number; summary?: AccessRemoval; forbidden?: boolean };

function Body({ teacher, onClose, onDone }: { teacher: TeacherDetail; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [tick, setTick] = useState(0);
  const [loaded, setLoaded] = useState<Loaded>();
  const [form, setForm] = useState<string>();

  useEffect(() => {
    let alive = true;
    fetchAccessRemoval(teacher.id).then(
      (summary) => alive && setLoaded({ tick, summary }),
      (e) => alive && setLoaded({ tick, forbidden: e instanceof ApiError && e.status === 403 }),
    );
    return () => {
      alive = false;
    };
  }, [teacher.id, tick]);
  const current = loaded?.tick === tick ? loaded : undefined;
  const summary = current?.summary;
  const names = (list: { name: string }[]) => list.map((u) => u.name).join(", ");

  async function confirm() {
    setForm(undefined);
    try {
      await removeTeacherAccess(teacher.id);
    } catch (e) {
      setForm(t(`teachers.panel.removeAccess.errors.${e instanceof ApiError && KNOWN.includes(e.code) ? e.code : "generic"}`));
      throw e; // a janela segue aberta
    }
    onDone();
  }

  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && onClose()}
      tone="danger"
      scrim="canvas"
      size="md"
      title={t("teachers.panel.removeAccess.title", { name: teacher.name })}
      summary={t("teachers.panel.removeAccess.summary")}
      summaryItems={summary?.endsAccess === false ? [t("teachers.panel.removeAccess.keeps")] : [t("teachers.panel.removeAccess.keeps"), t("teachers.panel.removeAccess.sessions")]}
      confirmLabel={t("teachers.panel.removeAccess.confirm")}
      confirmDisabled={!summary}
      onConfirm={confirm}
    >
      <div className="flex flex-col gap-3" aria-busy={!current}>
        {!current && <LoadingState />}
        {current?.forbidden && <ForbiddenState />}
        {current && !summary && !current.forbidden && <ErrorState onRetry={() => setTick((n) => n + 1)} />}
        {summary && (
          <>
            <p>{t("teachers.panel.removeAccess.losing", { units: names(summary.removed) })}</p>
            {summary.kept.length > 0 && <Banner tone="warn">{t("teachers.panel.removeAccess.stillHas", { units: names(summary.kept) })}</Banner>}
          </>
        )}
        {form && <Banner tone="danger">{form}</Banner>}
      </div>
    </ConfirmDialog>
  );
}
