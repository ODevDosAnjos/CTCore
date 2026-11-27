import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LastChange, type LastChangeValue } from "@/components/LastChange";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { useTabParam } from "@/components/ui/useTabParam";
import { SwitchRow } from "@/features/units/SwitchRow";
import { api, ApiError } from "@/lib/api";

/** Espelha AdminTwoFactorPolicy do OpenAPI (RN-ACE-24). */
type Policy = { required: boolean; lastChange: LastChangeValue | null };
type Loaded = { tick: number; policy?: Policy; forbidden?: boolean };
const PATH = "/organization/admin-two-factor";

// RN-ACE-24: uma opção só, gravada na hora (D6). Ligar pede confirmação, porque desconecta pessoas; desligar grava direto (D7).
function TwoFactorTab() {
  const { t } = useTranslation();
  const [tick, setTick] = useState(0);
  const [done, setDone] = useState<Loaded>();
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<"on" | "off" | "error">();

  useEffect(() => {
    let alive = true;
    api<Policy>(PATH).then(
      (policy) => alive && setDone({ tick, policy }),
      (e) => alive && setDone({ tick, forbidden: e instanceof ApiError && e.status === 403 }),
    );
    return () => {
      alive = false;
    };
  }, [tick]);

  const current = done?.tick === tick ? done : undefined;
  if (!current) return <LoadingState />;
  if (current.forbidden) return <ForbiddenState />;
  if (!current.policy) return <ErrorState onRetry={() => setTick((n) => n + 1)} />;
  const { required, lastChange } = current.policy;

  async function save(value: boolean) {
    setSaving(true);
    setNotice(undefined);
    try {
      setDone({ tick, policy: await api<Policy>(PATH, { method: "PUT", body: { required: value } }) });
      setNotice(value ? "on" : "off");
    } catch (e) {
      setNotice("error");
      throw e; // mantém a janela de confirmação aberta
    } finally {
      setSaving(false);
    }
  }
  const failure = notice === "error" && <Banner tone="danger">{t("dataSecurity.twoFactor.saveFailed")}</Banner>;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SwitchRow
          label={t("dataSecurity.twoFactor.label")}
          description={t("dataSecurity.twoFactor.effect")}
          checked={required}
          disabled={saving}
          onChange={(value) => {
            setNotice(undefined);
            if (value) setConfirming(true);
            else void save(false).catch(() => undefined);
          }}
        />
        <div className="mt-3">
          <LastChange value={lastChange} />
        </div>
      </Card>
      {!confirming && failure}
      {(notice === "on" || notice === "off") && <Banner tone="ok">{t(`dataSecurity.twoFactor.saved.${notice}`)}</Banner>}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("dataSecurity.twoFactor.confirm.title")}
        summary={t("dataSecurity.twoFactor.confirm.text")}
        confirmLabel={t("dataSecurity.twoFactor.confirm.action")}
        onConfirm={() => save(true)}
      >
        {failure}
      </ConfirmDialog>
    </div>
  );
}

// #628 / RF-ORG-09 (D5): Duas etapas é a única aba pronta; as outras três aparecem "Em breve".
export function DataSecurityPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useTabParam(["duas-etapas"]);
  const soon = (id: string, key: string) => ({ id, label: t(`dataSecurity.tabs.${key}`), soon: true, content: null });
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("dataSecurity.title")} />
      <Tabs
        label={t("dataSecurity.tabsLabel")}
        value={tab}
        onValueChange={setTab}
        tabs={[
          soon("auditoria", "audit"),
          soon("importar-exportar", "importExport"),
          soon("acesso-suporte", "support"),
          { id: "duas-etapas", label: t("dataSecurity.tabs.twoFactor"), content: <TwoFactorTab /> },
        ]}
      />
    </div>
  );
}
