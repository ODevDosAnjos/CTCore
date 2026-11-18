import { useTranslation } from "react-i18next";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { Select } from "@/components/ui/field";
import type { AnnouncementDraft, AnnouncementTargets } from "./types";

// Valor do campo de destino: CLASS:<turma>, MODALITY:<modalidade>:<unidade>, UNIT:<unidade> ou ORGANIZATION.
export function draftTarget(value: string): Pick<AnnouncementDraft, "targetKind" | "classId" | "modalityId" | "unitId"> | null {
  const [kind, a, b] = value.split(":");
  if (kind === "CLASS" && a) return { targetKind: "CLASS", classId: a };
  if (kind === "MODALITY" && a && b) return { targetKind: "MODALITY", modalityId: a, unitId: b };
  if (kind === "UNIT" && a) return { targetKind: "UNIT", unitId: a };
  return kind === "ORGANIZATION" ? { targetKind: "ORGANIZATION" } : null;
}

export function targetName(targets: AnnouncementTargets, value: string): string {
  const [kind, a] = value.split(":");
  if (kind === "CLASS") return targets.classes.find((c) => c.id === a)?.name ?? "";
  if (kind === "MODALITY") return targets.modalities.find((m) => m.id === a)?.name ?? "";
  if (kind === "UNIT") return targets.units.find((u) => u.id === a)?.name ?? "";
  return "";
}

export type TargetKind = "CLASS" | "MODALITY" | "UNIT" | "ORGANIZATION";

export const kindOf = (value: string): TargetKind | null => {
  const k = value.split(":")[0];
  return k === "CLASS" || k === "MODALITY" || k === "UNIT" || k === "ORGANIZATION" ? k : null;
};

// RN-COM-01: só aparece o que o servidor liberou para o perfil (o servidor confere de novo ao enviar).
export function availableKinds(targets: AnnouncementTargets): TargetKind[] {
  return [targets.classes.length > 0 && "CLASS", targets.modalities.length > 0 && "MODALITY", targets.units.length > 0 && "UNIT", targets.organization && "ORGANIZATION"].filter(Boolean) as TargetKind[];
}

// Destino em cartões (turma, modalidade, unidade, todas as unidades) e, abaixo, o seletor do alvo do cartão escolhido.
export function AnnouncementTargetPicker({ targets, kind, value, compact, onKind, onChange }: { targets: AnnouncementTargets; kind: TargetKind | null; value: string; compact?: boolean; onKind: (k: TargetKind) => void; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const unitName = (id: string) => targets.units.find((u) => u.id === id)?.name ?? "";
  // Celular (canvas): um seletor só, "Turma · nome", "Modalidade · nome · unidade", "Unidade · nome" e "Todas as unidades".
  if (compact)
    return (
      <div>
        <label htmlFor="ann-target" className="block text-sm font-medium">
          {t("announcements.new.target")}
        </label>
        <Select id="ann-target" value={value} onChange={(e) => (e.target.value === "ORGANIZATION" ? onKind("ORGANIZATION") : onChange(e.target.value))}>
          <option value="">{t("announcements.new.targetPlaceholder")}</option>
          {targets.organization && <option value="ORGANIZATION">{t("announcements.new.targetKind.ORGANIZATION")}</option>}
          {targets.units.map((u) => (
            <option key={u.id} value={`UNIT:${u.id}`}>
              {t("announcements.new.targetKind.UNIT")} · {u.name}
            </option>
          ))}
          {targets.modalities.map((m) => (
            <option key={`${m.id}:${m.unitId}`} value={`MODALITY:${m.id}:${m.unitId}`}>
              {t("announcements.new.targetKind.MODALITY")} · {t("announcements.new.modalityOption", { modality: m.name, unit: unitName(m.unitId) })}
            </option>
          ))}
          {targets.classes.map((c) => (
            <option key={c.id} value={`CLASS:${c.id}`}>
              {t("announcements.new.targetKind.CLASS")} · {c.name}
            </option>
          ))}
        </Select>
      </div>
    );
  const options = availableKinds(targets).map((k) => ({ value: k, label: t(`announcements.new.targetKind.${k}`), description: k === "ORGANIZATION" ? t("announcements.new.organizationHint") : undefined }));
  return (
    <div className="flex flex-col gap-3">
      <ChoiceCards legend={t("announcements.new.target")} options={options} value={kind ?? ""} onChange={(k) => onKind(k as TargetKind)} columns={4} />
      {kind && kind !== "ORGANIZATION" && (
        <div>
          <label htmlFor="ann-target" className="block text-sm font-medium">
            {t(`announcements.new.targetKind.${kind}`)}
          </label>
          <Select id="ann-target" value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">{t("announcements.new.targetPlaceholder")}</option>
            {kind === "UNIT" &&
              targets.units.map((u) => (
                <option key={u.id} value={`UNIT:${u.id}`}>
                  {u.name}
                </option>
              ))}
            {kind === "MODALITY" &&
              targets.modalities.map((m) => (
                <option key={`${m.id}:${m.unitId}`} value={`MODALITY:${m.id}:${m.unitId}`}>
                  {t("announcements.new.modalityOption", { modality: m.name, unit: unitName(m.unitId) })}
                </option>
              ))}
            {kind === "CLASS" &&
              targets.classes.map((c) => (
                <option key={c.id} value={`CLASS:${c.id}`}>
                  {c.name}
                </option>
              ))}
          </Select>
        </div>
      )}
    </div>
  );
}
