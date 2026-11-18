import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Select } from "@/components/ui/field";
import { ANNOUNCEMENT_TYPES, type AnnouncementType } from "./types";

// RN-COM-04: o tipo em chips (formulário) ou em lista (celular e janela da organização); cada um começa com um texto pronto (quem troca o texto é o chamador).
export function TypeChips({ value, onChange, hint = true, select, error, describedBy }: { value: AnnouncementType; onChange: (t: AnnouncementType) => void; hint?: boolean; select?: boolean; error?: string; describedBy?: string }) {
  const { t } = useTranslation();
  const name = useId();
  if (select)
    return (
      <div>
        <label htmlFor="ann-type" className="block text-sm font-medium">
          {t("announcements.new.type")}
        </label>
        <Select id="ann-type" value={value} aria-invalid={error ? true : undefined} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value as AnnouncementType)}>
          {ANNOUNCEMENT_TYPES.map((v) => (
            <option key={v} value={v}>
              {t(`announcements.types.${v}`)}
            </option>
          ))}
        </Select>
        {error && (
          <p id="ann-type-erro" className="text-sm text-danger-foreground">
            {error}
          </p>
        )}
      </div>
    );
  return (
    <fieldset id="ann-type" tabIndex={-1} className="flex flex-col gap-2" aria-describedby={describedBy}>
      <legend className="mb-1 text-sm font-medium">{t("announcements.new.type")}</legend>
      <div className="flex flex-wrap gap-2">
        {ANNOUNCEMENT_TYPES.map((v) => (
          <label
            key={v}
            className="relative flex h-8 cursor-pointer items-center rounded-full bg-surface-soft px-3 text-xs font-medium after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
          >
            <input type="radio" name={name} className="sr-only" checked={value === v} onChange={() => onChange(v)} />
            {t(`announcements.types.${v}`)}
          </label>
        ))}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{t("announcements.new.typeHint")}</p>}
      {error && (
        <p id="ann-type-erro" className="text-sm text-danger-foreground">
          {error}
        </p>
      )}
    </fieldset>
  );
}
