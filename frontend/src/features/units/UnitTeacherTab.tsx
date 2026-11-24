import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Card } from "@/components/Card";
import { hrefOf } from "@/routes";
import { SwitchRow } from "./SwitchRow";
import type { Draft, SetDraft } from "./unitDraft";
import { TEACHER_KEYS } from "./useUnitSettings";

// Aba Permissões do Professor (R6, RF-ORG-04): cinco interruptores; a faixa lembra o que o Professor nunca vê.
export function UnitTeacherTab({ d, set, unitName }: { d: Draft; set: SetDraft; unitName: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <Card heading="h2" title={t("unitSettings.teacherTitle", { unit: unitName })}>
        <div className="flex flex-col gap-3">
          {TEACHER_KEYS.map((key) => (
            <SwitchRow
              key={key}
              label={t(`unitSettings.teacher.${key}`)}
              description={t(`unitSettings.teacherHelp.${key}`)}
              checked={d.teacher[key]}
              onChange={(v) => set("teacher")({ ...d.teacher, [key]: v })}
            />
          ))}
        </div>
      </Card>
      <div className="flex items-start gap-3 rounded-md border bg-surface-soft px-4 py-3 text-sm">
        <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
        <p>{t("unitSettings.teacherLock")}</p>
      </div>
      <Link className="w-fit text-sm font-medium underline underline-offset-2" to={hrefOf("permissionsTable")}>
        {t("unitSettings.permissionsLink")}
      </Link>
    </div>
  );
}
