import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { MoneyField, PhoneField } from "@/components/fields/fields";
import { formatCep, formatCpfCnpj } from "@/components/fields/masks";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Field, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { ShortNameDialog } from "./ShortNameDialog";
import { Err, Text } from "./Text";
import { SwitchRow } from "./SwitchRow";
import { UnitModalitiesSection } from "./UnitModalitiesSection";
import type { TabProps } from "./unitDraft";

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

// Aba Dados (R3): os campos da unidade, a cobrança, as modalidades (gravam na hora) e o diretório ("Em breve").
export function UnitDataTab({ d, set, problems, errors, unitId, shortName, timezone }: TabProps & { unitId: string; shortName: string; timezone: string }) {
  const { t } = useTranslation();
  // D3 (item 484): o ajuste único do nome curto (RN-ORG-15) sai da lista e fica aqui; o servidor recusa o segundo (409).
  const [adjusting, setAdjusting] = useState(false);
  const [adjusted, setAdjusted] = useState<string>();
  const shown = (field: string, problem?: string) => errors[field] ?? problem;
  const toggleDay = (day: number) => set("dueDays")(d.dueDays.includes(day) ? d.dueDays.filter((x) => x !== day) : [...d.dueDays, day].sort((a, b) => a - b));
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card heading="h2" title={t("unitSettings.sections.data")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Text label={t("unitSettings.name")} value={d.name} onChange={set("name")} maxLength={120} autoComplete="off" error={shown("name", problems.name)} />
            <Text label={t("unitSettings.cnpj")} value={d.cnpj} onChange={(v) => set("cnpj")(formatCpfCnpj(v))} inputMode="numeric" autoComplete="off" help={t("unitSettings.cnpjHelp")} error={shown("cnpj", problems.cnpj)} />
            <div className="sm:col-span-2">
              <Text label={t("unitSettings.address")} value={d.address} onChange={set("address")} autoComplete="street-address" error={errors.address} />
            </div>
            <Text label={t("unitSettings.postalCode")} value={d.postalCode} onChange={(v) => set("postalCode")(formatCep(v))} inputMode="numeric" autoComplete="postal-code" error={shown("postalCode", problems.postalCode)} />
            <Text label={t("unitSettings.city")} value={d.city} onChange={set("city")} autoComplete="address-level2" error={errors.city} />
            <div>
              <PhoneField label={t("unitSettings.phone")} initial={d.phone} onChange={set("phone")} />
              <Err text={errors.phone} />
            </div>
            <div>
              <PhoneField label={t("unitSettings.whatsapp")} initial={d.whatsapp} onChange={set("whatsapp")} />
              <Err text={errors.whatsapp} />
            </div>
            <div className="sm:col-span-2">
              <Text label={t("unitSettings.email")} value={d.email} onChange={set("email")} type="email" autoComplete="off" error={shown("email", problems.email)} />
            </div>
            <Field label={t("unitSettings.timezone")}>
              {(c) => (
                <Select {...c} disabled value={timezone}>
                  <option value={timezone}>{t(`unitSettings.timezones.${timezone}`, { defaultValue: timezone })}</option>
                </Select>
              )}
            </Field>
            <div className="flex flex-col items-start gap-1">
              <Text label={t("unitSettings.shortName")} value={adjusted ?? shortName} onChange={() => undefined} readOnly help={t("unitSettings.shortNameHelp")} />
              {adjusted === undefined && (
                <Button type="button" variant="secondary" size="sm" onClick={() => setAdjusting(true)}>
                  {t("units.adjust")}
                </Button>
              )}
            </div>
            <details className="sm:col-span-2">
              <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">{t("unitSettings.coordinatesToggle")}</summary>
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{t("unitSettings.coordinatesHelp")}</p>
                <Text label={t("unitSettings.latitude")} value={d.latitude} onChange={set("latitude")} inputMode="decimal" error={errors.latitude} />
                <Text label={t("unitSettings.longitude")} value={d.longitude} onChange={set("longitude")} inputMode="decimal" error={shown("longitude", problems.coordinates)} />
              </div>
            </details>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card heading="h2" title={t("unitSettings.sections.billing")}>
            <div className="flex flex-col gap-3">
              <fieldset>
                <legend className="text-xs font-semibold text-muted-foreground">{t("unitSettings.dueDays")}</legend>
                <div className="mt-1 flex flex-wrap gap-1">
                  {DAYS.map((day) => {
                    const on = d.dueDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleDay(day)}
                        className={cn(
                          "min-h-11 rounded-full px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          on ? "bg-foreground text-background" : "bg-surface-soft text-muted-foreground",
                        )}
                      >
                        {t("unitSettings.dueDay", { day })}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t("unitSettings.dueDaysHelp")}</p>
                <Err text={shown("settings.dueDays", problems.dueDays)} />
              </fieldset>
              <SwitchRow label={t("unitSettings.enrollmentFee")} description={t("unitSettings.enrollmentFeeHelp")} checked={d.enrollmentFeeEnabled} onChange={set("enrollmentFeeEnabled")} />
              <div>
                <MoneyField label={t("unitSettings.enrollmentFeeValue")} initial={d.enrollmentFeeCents} onChange={set("enrollmentFeeCents")} disabled={!d.enrollmentFeeEnabled} />
                <Err text={errors["settings.enrollmentFeeCents"]} />
              </div>
            </div>
          </Card>
          <UnitModalitiesSection unitId={unitId} />
        </div>
      </div>

      <Card heading="h2" title={t("unitSettings.sections.directory")}>
        <ComingSoon variant="switch" label={t("unitSettings.directory")} />
        <p className="text-sm text-muted-foreground">{t("unitSettings.directoryHelp")}</p>
      </Card>
      <ShortNameDialog
        unit={adjusting ? { id: unitId, name: d.name, shortName: adjusted ?? shortName } : null}
        onClose={() => setAdjusting(false)}
        onSave={async (id, value) => {
          await api(`/units/${id}/short-name`, { method: "PATCH", body: { shortName: value } });
          setAdjusted(value);
        }}
      />
    </div>
  );
}
