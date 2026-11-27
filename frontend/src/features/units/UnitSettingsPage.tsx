import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";
import { CircleAlert } from "lucide-react";
import { EditConflictDialog, type Difference } from "@/components/EditConflictDialog";
import { LastChange } from "@/components/LastChange";
import { isValidCnpj, isValidPhone, onlyDigits } from "@/components/fields/masks";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { useTabParam } from "@/components/ui/useTabParam";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useEditConflict } from "@/lib/useEditConflict";
import { hrefOf } from "@/routes";
import { ALL, useUnitScope } from "./UnitScopeProvider";
import { UnitDataTab } from "./UnitDataTab";
import { UnitLinksTab } from "./UnitLinksTab";
import { UnitPaymentsTab } from "./UnitPaymentsTab";
import { UnitRemindersTab } from "./UnitRemindersTab";
import { UnitTeacherTab } from "./UnitTeacherTab";
import { EMAIL, coordinate, toBody, toDraft, type Draft, type Problems } from "./unitDraft";
import { FEE_KEYS, TEACHER_KEYS, useUnitDetail, type UnitDetail } from "./useUnitSettings";

const TABS = ["data", "payments", "reminders", "links", "teacher"] as const;
type TabId = (typeof TABS)[number];

// Aba de cada erro do servidor; o que não é de Pagamentos, Lembretes nem Links (nome, vencimentos, taxa de matrícula...) é da aba Dados.
const tabOfServerField = (field: string): TabId =>
  field.startsWith("settings.feesCents") || field === "settings.pixKey" ? "payments" : field.startsWith("settings.reminder") ? "reminders" : field === "settings.trialLimit" ? "links" : "data";

function Form({ detail, api }: { detail: UnitDetail; api: ReturnType<typeof useUnitDetail> }) {
  const { t } = useTranslation();
  const { save, adopt } = api;
  const saveButton = useRef<HTMLButtonElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const conflict = useEditConflict(api.fetchCurrent);
  const [nonce, setNonce] = useState(0); // "Descartar" e "Recarregar" remontam os campos, que guardam o valor inicial por conta própria
  const [base, setBase] = useState(() => toDraft(detail));
  const [d, setD] = useState(base);
  const [tab, setTab] = useTabParam<TabId>(TABS);
  const [focusError, setFocusError] = useState(0);
  const wantsFocus = useRef(false); // Enter com erro: o foco vai ao primeiro campo inválido quando a aba abrir
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ ok: boolean; text: string }>();
  const set = <K extends keyof Draft>(k: K) => (v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const lat = coordinate(d.latitude);
  const lon = coordinate(d.longitude);
  const problems: Problems = {
    name: d.name.trim() === "" ? t("unitSettings.nameRequired") : d.name.trim().length > 120 ? t("unitSettings.nameTooLong") : undefined,
    cnpj: d.cnpj !== "" && !isValidCnpj(d.cnpj) ? t("unitSettings.cnpjInvalid") : undefined,
    postalCode: d.postalCode !== "" && onlyDigits(d.postalCode).length !== 8 ? t("unitSettings.postalCodeInvalid") : undefined,
    coordinates:
      (lat === null) !== (lon === null) || (lat !== null && (!Number.isFinite(lat) || Math.abs(lat) > 90)) || (lon !== null && (!Number.isFinite(lon) || Math.abs(lon) > 180))
        ? t("unitSettings.coordinatesInvalid")
        : undefined,
    phone: d.phone !== "" && !isValidPhone(d.phone) ? t("fields.phoneInvalid") : undefined,
    whatsapp: d.whatsapp !== "" && !isValidPhone(d.whatsapp) ? t("fields.phoneInvalid") : undefined,
    email: d.email.trim() !== "" && !EMAIL.test(d.email.trim()) ? t("unitSettings.emailInvalid") : undefined,
    dueDays: d.dueDays.length === 0 ? t("unitSettings.dueDaysRequired") : undefined,
  };
  const dirty = JSON.stringify(d) !== JSON.stringify(base);
  const blocked = Object.values(problems).some(Boolean);
  // Abas com erro: o que foi digitado (todos os problemas locais são da aba Dados) e o que o servidor recusou.
  const withError = new Set<TabId>([...(blocked ? (["data"] as const) : []), ...Object.keys(errors).map(tabOfServerField)]);

  // Depois de abrir a aba com o erro, o foco vai ao primeiro campo inválido dela.
  useEffect(() => {
    if (!wantsFocus.current || tab !== "data") return; // a troca de aba é navegação: o foco espera a aba Dados abrir
    wantsFocus.current = false;
    form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusError, tab]);

  // Devolve false quando outra pessoa salvou antes (409): a janela de conflito abre e a edição fica como está (RNF-15).
  async function submit(version?: number): Promise<boolean> {
    setBusy(true);
    setErrors({});
    setNotice(undefined);
    try {
      const saved = await save(toBody(d, base), version);
      const next = toDraft(saved);
      setBase(next);
      setD(next);
      setNotice({ ok: true, text: t("unitSettings.saved") });
    } catch (e) {
      if (e instanceof ApiError && e.code === "EDIT_CONFLICT") {
        conflict.open();
        return false;
      }
      const fields = e instanceof ApiError ? e.fields : [];
      setErrors(Object.fromEntries(fields.map((f) => [f.field, f.message])));
      const first = fields.map((f) => tabOfServerField(f.field)).sort((a, b) => TABS.indexOf(a) - TABS.indexOf(b))[0];
      if (first) setTab(first);
      setNotice({ ok: false, text: t("unitSettings.saveError") });
    } finally {
      setBusy(false);
    }
    return true;
  }

  function discard() {
    setD(base);
    setErrors({});
    setNotice(undefined);
    setNonce((n) => n + 1);
  }

  function differences(current: UnitDetail): Difference[] {
    const c = toDraft(current);
    const text = (v: unknown) =>
      typeof v === "boolean" ? t(v ? "editConflict.yes" : "editConflict.no") : Array.isArray(v) ? v.join(", ") : v === null || v === "" ? t("editConflict.empty") : String(v);
    const money = (v: unknown) => (typeof v === "number" ? formatCurrency(v) : text(v));
    const fields: [string, unknown, unknown, (v: unknown) => string][] = [
      [t("unitSettings.name"), d.name.trim(), c.name, text],
      [t("unitSettings.cnpj"), d.cnpj, c.cnpj, text],
      [t("unitSettings.postalCode"), d.postalCode, c.postalCode, text],
      [t("unitSettings.address"), d.address, c.address, text],
      [t("unitSettings.city"), d.city, c.city, text],
      [t("unitSettings.latitude"), d.latitude, c.latitude, text],
      [t("unitSettings.longitude"), d.longitude, c.longitude, text],
      [t("unitSettings.phone"), d.phone, c.phone, text],
      [t("unitSettings.whatsapp"), d.whatsapp, c.whatsapp, text],
      [t("unitSettings.email"), d.email.trim(), c.email, text],
      [t("unitSettings.dueDays"), d.dueDays, c.dueDays, text],
      [t("unitSettings.enrollmentFee"), d.enrollmentFeeEnabled, c.enrollmentFeeEnabled, text],
      [t("unitSettings.enrollmentFeeValue"), d.enrollmentFeeCents, c.enrollmentFeeCents, money],
      ...FEE_KEYS.map((k): [string, unknown, unknown, (v: unknown) => string] => [t(`unitSettings.fees.${k}`), d.fees[k], c.fees[k], money]),
      [t("unitSettings.pixKey"), d.pixKey, c.pixKey, text],
      [t("unitSettings.remindersEnabledField"), d.remindersEnabled, c.remindersEnabled, text],
      [t("unitSettings.remindersHour"), d.remindersHour, c.remindersHour, text],
      [t("unitSettings.reminders"), d.reminderDays, c.reminderDays, text],
      ...TEACHER_KEYS.map((k): [string, unknown, unknown, (v: unknown) => string] => [t(`unitSettings.teacher.${k}`), d.teacher[k], c.teacher[k], text]),
      [t("unitSettings.directory"), d.directoryEnabled, c.directoryEnabled, text],
      [t("unitSettings.trialLink"), d.trialLinkEnabled, c.trialLinkEnabled, text],
      [t("unitSettings.selfRegistrationLink"), d.selfRegistrationLinkEnabled, c.selfRegistrationLinkEnabled, text],
      [t("unitSettings.links.trialLimit"), d.trialLimit, c.trialLimit, text],
    ];
    return fields
      .filter(([, mine, now]) => JSON.stringify(mine) !== JSON.stringify(now))
      .map(([label, mine, now, show]) => ({ label, mine: show(mine), current: show(now) }));
  }

  function reload(current: UnitDetail) {
    const next = toDraft(current);
    setBase(next);
    setD(next);
    setErrors({});
    setNotice(undefined);
    adopt(current);
    setNonce((n) => n + 1);
    conflict.close();
  }

  const shared = { d, set, problems, errors };
  const flag = (id: TabId) =>
    withError.has(id) ? <CircleAlert role="img" aria-label={t("unitSettings.tabError")} className="ml-1 inline size-4 align-text-bottom text-danger-foreground" /> : undefined;
  const tabs = [
    { id: "data", content: <UnitDataTab {...shared} unitId={detail.id} unitName={detail.name} shortName={detail.shortName} timezone={detail.timezone} /> },
    { id: "payments", content: <UnitPaymentsTab {...shared} connected={detail.settings.paymentAccount === "CONNECTED"} /> },
    { id: "reminders", content: <UnitRemindersTab {...shared} /> },
    { id: "links", content: <UnitLinksTab d={d} set={set} errors={errors} /> },
    { id: "teacher", content: <UnitTeacherTab d={d} set={set} unitId={detail.id} unitName={detail.name} /> },
  ].map((item) => ({ ...item, label: t(`unitSettings.tabs.${item.id}`), badge: flag(item.id as TabId) }));

  return (
    <>
      <form
        key={nonce}
        ref={form}
        className="flex flex-col gap-4"
        noValidate
        // Com o botão desabilitado o Enter não envia: abre a aba com erro e leva o foco ao primeiro campo inválido (CA5).
        onKeyDown={(e) => {
          if (e.key !== "Enter" || !blocked || !(e.target instanceof HTMLInputElement)) return;
          e.preventDefault();
          wantsFocus.current = true;
          setTab("data");
          setFocusError((n) => n + 1);
        }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!blocked && dirty && !busy) void submit();
        }}
      >
        <Tabs label={t("unitSettings.tabsLabel")} tabs={tabs} value={tab} onValueChange={setTab} />
        <div className="sticky bottom-14 z-20 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t bg-background px-4 py-3 md:bottom-0">
          {notice && (
            <p role={notice.ok ? "status" : "alert"} className={notice.ok ? "mr-auto text-sm text-ok-foreground" : "mr-auto text-sm text-danger-foreground"}>
              {notice.text}
            </p>
          )}
          <Button type="button" variant="ghost" disabled={!dirty || busy} onClick={discard}>
            {t("unitSettings.discard")}
          </Button>
          <Button ref={saveButton} type="submit" disabled={blocked || !dirty || busy}>
            {busy ? t("unitSettings.saving") : t("unitSettings.save")}
          </Button>
        </div>
      </form>
      <EditConflictDialog
        state={conflict.state}
        differences={conflict.state?.status === "ready" ? differences(conflict.state.current) : []}
        busy={busy}
        returnFocusRef={saveButton}
        onRetry={conflict.open}
        onClose={conflict.close}
        onReload={() => conflict.state?.status === "ready" && reload(conflict.state.current)}
        onOverwrite={() => {
          if (conflict.state?.status !== "ready") return;
          void submit(conflict.state.current.version).then((done) => done && conflict.close());
        }}
      />
    </>
  );
}

// "Unidade Tijuca"; se o nome já começa com "Unidade", a palavra não se repete.
const heading = (name: string, word: string) => (name.toLowerCase().startsWith(word.toLowerCase()) ? name : `${word} ${name}`);

function Detail({ id }: { id: string }) {
  const { t } = useTranslation();
  const api = useUnitDetail(id);
  const d = api.detail;
  return (
    <>
      <PageHeader
        title={d ? heading(d.name, t("unitSettings.unitWord")) : t("unitSettings.generalTitle")}
        actions={d && <LastChange value={d.lastChange} />}
      />
      {api.status === "loading" && <LoadingState />}
      {api.status === "forbidden" && <ForbiddenState />}
      {api.status === "error" && <ErrorState onRetry={api.retry} />}
      {d && <Form key={d.id} detail={d} api={api} />}
    </>
  );
}

// D3 (item 746): o endereço define a unidade. Abrir uma unidade ativa a escolhe no topo; trocar o seletor depois leva à outra
// unidade (na mesma aba) e "Todas as unidades" volta à lista. Unidade desativada não está no seletor e não sincroniza.
function useScopeSync(id: string) {
  const scope = useUnitScope();
  const navigate = useNavigate();
  const { search } = useLocation();
  // Só uma *mudança* do seletor navega; repetir o efeito (StrictMode) sem mudança não faz nada.
  const seen = useRef<{ id: string; selected: string | null }>(undefined);
  const inReach = scope.units.some((u) => u.id === id);
  useEffect(() => {
    if (scope.status !== "ready") return;
    if (seen.current?.id !== id) {
      seen.current = inReach ? { id, selected: scope.selected } : undefined;
      if (inReach) scope.select(id);
    } else if (scope.selected !== seen.current.selected) {
      seen.current.selected = scope.selected;
      if (scope.selected === ALL) void navigate(hrefOf("units"));
      else if (scope.selected && scope.selected !== id) void navigate({ pathname: hrefOf("unitSettings", { id: scope.selected }), search }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `select` e `navigate` mudam a cada render
  }, [id, inReach, scope.status, scope.selected]);
  return scope;
}

function Content() {
  const { id = "" } = useParams();
  const scope = useScopeSync(id);
  if (scope.status === "loading") return <LoadingState />;
  if (scope.status === "forbidden") return <ForbiddenState />;
  if (scope.status === "error") return <ErrorState onRetry={scope.retry} />;
  return (
    <div className="flex flex-col gap-4">
      <Detail id={id} />
    </div>
  );
}

// RF-ORG-04: Coordenador e Administrador (a rota já nega os demais; a barreira de dados é o servidor).
export function UnitSettingsPage() {
  return <Content />;
}
