import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorState, LoadingState } from "@/components/states";
import { ApiError } from "@/lib/api";
import { deactivateTeacher, fetchDeactivationPreview, type DeactivationPreview, type TeacherDetail } from "./useTeachers";
import { Banner } from "@/components/ui/banner";
import { Select } from "@/components/ui/field";

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
  // Novo titular escolhido por turma (classId -> teacherId); sem escolha a turma fica sem titular (RN-PRO-05).
  const [heads, setHeads] = useState<Record<string, string>>({});

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

  async function confirm(reason: string) {
    setForm(undefined);
    if (reason.length < 3 || reason.length > 200) {
      setForm(t("teachers.panel.deactivateDialog.reasonInvalid"));
      throw new Error("reason");
    }
    const replacements = Object.entries(heads)
      .filter(([, teacherId]) => teacherId)
      .map(([classId, teacherId]) => ({ classId, teacherId }));
    try {
      await deactivateTeacher(teacher.id, { reason, replacements });
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
      scrim="canvas"
      reason="required"
      size="md"
      reasonLabel={t("teachers.panel.deactivateDialog.reason")}
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
            {preview.headClasses.length > 0 && (
              <Banner tone="warn">
                <p className="font-semibold">{t("teachers.panel.deactivateDialog.withoutHead", { count: preview.headClasses.length })}</p>
                <p>{t("teachers.panel.deactivateDialog.withoutHeadHelp")}</p>
              </Banner>
            )}
            {preview.headClasses.length + preview.assistantClasses.length > 0 && (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th scope="col" className="py-1 pr-2 font-medium">
                      {t("teachers.panel.deactivateDialog.columnClass")}
                    </th>
                    <th scope="col" className="py-1 pr-2 font-medium">
                      {t("teachers.panel.deactivateDialog.columnRole")}
                    </th>
                    <th scope="col" className="py-1 font-medium">
                      {t("teachers.panel.deactivateDialog.columnNewHead")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.headClasses.map((c) => (
                    <tr key={c.id} className="border-t border-divider align-middle">
                      <td className="break-words py-2 pr-2">{t("teachers.panel.classWithUnit", { name: c.name, unit: c.unitName })}</td>
                      <td className="py-2 pr-2">{t("teachers.panel.classRoles.HEAD")}</td>
                      <td className="py-2">
                        <Select
                          className="min-h-11"
                          aria-label={t("teachers.panel.deactivateDialog.newHeadFor", { name: c.name })}
                          value={heads[c.id] ?? ""}
                          onChange={(e) => setHeads((h) => ({ ...h, [c.id]: e.target.value }))}
                        >
                          <option value="">{t("teachers.panel.deactivateDialog.chooseLater")}</option>
                          {c.candidates.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </Select>
                      </td>
                    </tr>
                  ))}
                  {preview.assistantClasses.map((c) => (
                    <tr key={c.id} className="border-t border-divider align-middle">
                      <td className="break-words py-2 pr-2">{t("teachers.panel.classWithUnit", { name: c.name, unit: c.unitName })}</td>
                      <td className="py-2 pr-2">{t("teachers.panel.classRoles.ASSISTANT")}</td>
                      <td className="py-2 text-muted-foreground">{t("teachers.panel.deactivateDialog.leavesClass")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!preview.canDeactivate && <Banner tone="danger">{t("teachers.panel.deactivateDialog.outOfReach")}</Banner>}
          </>
        )}
        {form && <Banner tone="danger">{form}</Banner>}
      </div>
    </ConfirmDialog>
  );
}
