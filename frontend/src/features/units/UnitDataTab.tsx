import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { PhoneField } from "@/components/fields/fields";
import { formatCep, formatCpfCnpj } from "@/components/fields/masks";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { api } from "@/lib/api";
import { ShortNameDialog } from "./ShortNameDialog";
import { Err, Text } from "./Text";
import { UnitModalitiesSection } from "./UnitModalitiesSection";
import type { TabProps } from "./unitDraft";

// Aba Dados (R3): as modalidades oferecidas (primeiro bloco, gravam na hora) e os campos da unidade.
export function UnitDataTab({ d, set, problems, errors, unitId, unitName, shortName, timezone }: TabProps & { unitId: string; unitName: string; shortName: string; timezone: string }) {
  const { t } = useTranslation();
  // D3 (item 484): o ajuste único do nome curto (RN-ORG-15) sai da lista e fica aqui; o servidor recusa o segundo (409).
  const [adjusting, setAdjusting] = useState(false);
  const [adjusted, setAdjusted] = useState<string>();
  const shown = (field: string, problem?: string) => errors[field] ?? problem;
  return (
    <div className="flex flex-col gap-4">
      <UnitModalitiesSection unitId={unitId} unitName={unitName} />
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
