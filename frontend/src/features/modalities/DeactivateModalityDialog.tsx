import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { BlockedNotice } from "@/components/ui/blocked-notice";
import { Button } from "@/components/ui/button";

const list = (items: string[]) => new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" }).format(items);

// "turma (unidade)" do servidor vira "A (Tijuca), B e C (Barra)", como no canvas.
function byUnit(classes: string[]): string {
  const groups = new Map<string, string[]>();
  for (const c of classes) {
    const m = /^(.*) \((.*)\)$/.exec(c);
    const unit = m?.[2] ?? "";
    groups.set(unit, [...(groups.get(unit) ?? []), m?.[1] ?? c]);
  }
  return [...groups].map(([unit, names]) => (unit ? `${list(names)} (${unit})` : list(names))).join(", ");
}

export type Blocker = { name: string; classes: string[]; students: number };

// RN-MOD-06: a recusa de desativar mostra as turmas ativas por unidade e os alunos; só "Entendi" fecha, nada muda.
export function DeactivateModalityDialog({ blocker, onClose }: { blocker: Blocker | null; onClose: () => void }) {
  const { t } = useTranslation();
  const name = blocker?.name ?? "";
  const lines = blocker
    ? [
        ...(blocker.classes.length > 0 ? [t("modalities.deactivateDialog.classes", { count: blocker.classes.length, list: byUnit(blocker.classes) })] : []),
        ...(blocker.students > 0 ? [t("modalities.deactivateDialog.students", { count: blocker.students, name })] : []),
      ]
    : [];
  return (
    <Modal
      open={blocker !== null}
      onOpenChange={(o) => !o && onClose()}
      size="md"
      scrim="canvas"
      title={t("modalities.deactivateDialog.title")}
      footer={
        <Button type="button" className="min-h-11" onClick={onClose}>
          {t("modalities.deactivateDialog.understood")}
        </Button>
      }
    >
      <div className="flex flex-col gap-3.5">
        <BlockedNotice title={t("modalities.deactivateDialog.head", { name })} lines={lines} />
        <p className="text-[13px] leading-normal text-muted-foreground">{t("modalities.deactivateDialog.guidance", { name })}</p>
      </div>
    </Modal>
  );
}
