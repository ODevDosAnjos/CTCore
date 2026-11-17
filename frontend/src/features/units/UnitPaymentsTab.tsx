import { useState } from "react";
import { CreditCard, Eye, OctagonAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { MoneyField } from "@/components/fields/fields";
import { formatCpfCnpj, onlyDigits } from "@/components/fields/masks";
import { Badge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Field, Select } from "@/components/ui/field";
import { SummaryBox } from "@/components/ui/summary-box";
import { formatCurrency } from "@/lib/format";
import { Err, Text } from "./Text";
import type { TabProps } from "./unitDraft";
import type { FeeKey } from "./useUnitSettings";

const EXAMPLE_CENTS = 18000; // mensalidade de exemplo do canvas (D3)
const ONLINE: FeeKey[] = ["pix", "creditCard", "debitCard", "bankSlip", "automaticDebit"];
const COUNTER: FeeKey[] = ["cash", "manualPix", "terminalCard", "transfer"];
const PIX_TYPES = ["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"] as const;
type PixType = (typeof PIX_TYPES)[number];

// D4: o tipo é só da interface; sai da chave salva e o servidor continua validando.
function pixTypeOf(key: string): PixType {
  if (key.includes("@")) return "EMAIL";
  if (key.startsWith("+")) return "PHONE";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return "RANDOM";
  return onlyDigits(key).length === 14 ? "CNPJ" : "CPF";
}

// Aba Pagamentos (R4, D2 a D4): conexão do Mercado Pago ("Em breve"), taxas por meio com exemplo, outros meios e chave Pix.
export function UnitPaymentsTab({ d, set, errors, connected }: TabProps & { connected: boolean }) {
  const { t } = useTranslation();
  const [type, setType] = useState<PixType>(() => pixTypeOf(d.pixKey));
  const fee = (k: FeeKey) => d.fees[k] ?? 0;
  const setFee = (k: FeeKey) => (v: number | null) => set("fees")({ ...d.fees, [k]: v });
  const money = (k: FeeKey) => (
    <div className="[&_label]:sr-only">
      <MoneyField label={t(`unitSettings.fees.${k}`)} initial={d.fees[k]} onChange={setFee(k)} />
      <Err text={errors[`settings.feesCents.${k}`]} />
    </div>
  );
  const total = (k: FeeKey) => formatCurrency(EXAMPLE_CENTS + fee(k));
  const line = (label: string, k: FeeKey) => t("unitSettings.portalLine", { label: t(`unitSettings.${label}`), value: total(k) });
  const portal = { pix: line("fees.pix", "pix"), card: line("portalCard", "creditCard"), slip: line("fees.bankSlip", "bankSlip") };
  const inputMode = type === "EMAIL" ? "email" : type === "PHONE" ? "tel" : type === "RANDOM" ? "text" : "numeric";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <span aria-hidden className={`grid size-12 shrink-0 place-items-center rounded-md ${connected ? "bg-surface-soft" : "bg-danger text-danger-foreground"}`}>
            {connected ? <CreditCard className="size-5" /> : <OctagonAlert className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">{t("unitSettings.mercadoPago")}</h2>
              <Badge tone={connected ? "ok" : "danger"}>{t(connected ? "unitSettings.connected" : "unitSettings.disconnected")}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{t(connected ? "unitSettings.connectedText" : "unitSettings.disconnectedText")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ComingSoon variant="button" label={t("unitSettings.reconnect")} />
            {connected && <ComingSoon variant="button" label={t("unitSettings.disconnect")} />}
          </div>
        </div>
      </Card>

      {!connected && (
        <Card heading="h2" title={t("unitSettings.whileDisconnected")}>
          <SummaryBox items={[1, 2, 3, 4].map((n) => t(`unitSettings.disconnectedEffects.${n}`))} />
        </Card>
      )}

      <Card heading="h2" title={t("unitSettings.feesTitle")}>
        <p className="mb-3 text-sm text-muted-foreground">{t("unitSettings.feesHelp")}</p>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-surface-soft text-left text-xs font-semibold text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2">{t("unitSettings.feeMethod")}</th>
                <th scope="col" className="px-3 py-2">{t("unitSettings.feePassed")}</th>
                <th scope="col" className="px-3 py-2 text-right">{t("unitSettings.feeExample", { value: formatCurrency(EXAMPLE_CENTS) })}</th>
              </tr>
            </thead>
            <tbody>
              {ONLINE.map((k) => (
                <tr key={k} className="border-t">
                  <th scope="row" className="px-3 py-2 text-left font-normal">{t(`unitSettings.fees.${k}`)}</th>
                  <td className="px-3 py-2">{money(k)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{total(k)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 flex items-center gap-2 rounded-md bg-surface-soft px-4 py-3 text-sm">
          <Eye aria-hidden className="size-4 shrink-0" />
          <span>
            {t("unitSettings.portalSees")}{" "}
            <strong>{portal.pix}</strong> · <strong>{portal.card}</strong> · <strong>{portal.slip}</strong>
          </span>
        </p>
      </Card>

      <Card heading="h2" title={t("unitSettings.otherMethods")}>
        <p className="mb-3 text-sm text-muted-foreground">{t("unitSettings.otherMethodsHelp")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {COUNTER.map((k) => (
            <div key={k}>
              <MoneyField label={t(`unitSettings.fees.${k}`)} initial={d.fees[k]} onChange={setFee(k)} />
              <Err text={errors[`settings.feesCents.${k}`]} />
            </div>
          ))}
        </div>
      </Card>

      <Card heading="h2" title={t("unitSettings.pixTitle")}>
        <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
          <Field label={t("unitSettings.pixType")}>
            {(c) => (
              <Select {...c} value={type} onChange={(e) => setType(e.target.value as PixType)}>
                {PIX_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {t(`unitSettings.pixTypes.${p}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Text
            label={t("unitSettings.pixKey")}
            value={d.pixKey}
            onChange={(v) => set("pixKey")(type === "CPF" || type === "CNPJ" ? formatCpfCnpj(v) : v)}
            inputMode={inputMode}
            autoComplete="off"
            error={errors["settings.pixKey"]}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("unitSettings.pixKeyHelp")}</p>
      </Card>
    </div>
  );
}
