import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { EditConflictDialog, type Difference } from "@/components/EditConflictDialog";
import { LastChange } from "@/components/LastChange";
import { formatCpfCnpj, isValidCpfOrCnpj, onlyDigits } from "@/components/fields/masks";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { useTabParam } from "@/components/ui/useTabParam";
import { AgeRangesTab } from "@/features/age-ranges/AgeRangesTab";
import { useSession } from "@/features/auth/SessionProvider";
import { ModalitiesTab } from "@/features/modalities/ModalitiesTab";
import { TermsTab } from "@/features/terms/TermsTab";
import { TextsTab } from "@/features/texts/TextsTab";
import { ApiError } from "@/lib/api";
import { useEditConflict } from "@/lib/useEditConflict";
import { BrandCard } from "./BrandCard";
import { isHexColor, passesContrast } from "./contrastRatio";
import { CoordinationCard } from "./CoordinationCard";
import { RANGES, invalidRules, sameRules, toDraft, toRules, type NumericRule, type RulesDraft } from "./rulesDraft";
import { RulesCard } from "./RulesCard";
import { useOrganization, type OrganizationView } from "./useOrganization";

type Notice = { kind: "ok" | "error"; text: string };
type Api = ReturnType<typeof useOrganization>;

function NoticeText({ notice }: { notice?: Notice }) {
  if (!notice) return null;
  return <Banner tone={notice.kind === "ok" ? "ok" : "danger"}>{notice.text}</Banner>;
}

const holderText = (view: OrganizationView) => (view.holderDocument ? formatCpfCnpj(view.holderDocument) : "");

// Um só formulário (D5): nome, titular, cor e regras salvam juntos pelo rodapé; a logo envia e remove na hora.
function OrganizationForm({ view, api, canEdit, onTransferred }: { view: OrganizationView; api: Api; canEdit: boolean; onTransferred: () => void }) {
  const { t } = useTranslation();
  const { save, adopt } = api;
  // Depois da janela de conflito o foco volta ao primeiro campo: Salvar já está desabilitado (a tela não tem mais o que salvar).
  const nameInput = useRef<HTMLInputElement>(null);
  const conflict = useEditConflict(api.fetchCurrent);
  const [name, setName] = useState(view.name);
  const [color, setColor] = useState(view.color ?? "");
  const [holder, setHolder] = useState(holderText(view));
  const [holderTouched, setHolderTouched] = useState(false);
  const [rules, setRules] = useState<RulesDraft>(toDraft(view.rules));
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice>();

  const nameError = name.trim() === "" ? t("organization.nameRequired") : name.trim().length > 120 ? t("organization.nameTooLong") : undefined;
  const colorBad = color !== "" && (!isHexColor(color) || !passesContrast(color));
  const holderBad = holder !== "" && !isValidCpfOrCnpj(holder);
  const badRules = invalidRules(rules);
  const blocked = !!nameError || colorBad || holderBad || badRules.length > 0 || busy;
  const dirty =
    name.trim() !== view.name ||
    color.toLowerCase() !== (view.color ?? "") ||
    onlyDigits(holder) !== (view.holderDocument ?? "") ||
    !sameRules(rules, toDraft(view.rules));
  const holderShown = errors.holderDocument ?? (holderTouched && holderBad ? t("organization.holderInvalid") : undefined);
  const ruleErrors: Partial<Record<NumericRule | "crossUnitTraining", string>> = {};
  for (const key of badRules) ruleErrors[key] = t("organization.rules.range", { min: RANGES[key][0], max: RANGES[key][1] });
  for (const key of [...(Object.keys(RANGES) as NumericRule[]), "crossUnitTraining" as const]) {
    if (errors[`rules.${key}`]) ruleErrors[key] ??= errors[`rules.${key}`];
  }

  function discard() {
    setName(view.name);
    setColor(view.color ?? "");
    setHolder(holderText(view));
    setHolderTouched(false);
    setRules(toDraft(view.rules));
    setErrors({});
    setNotice(undefined);
  }

  // Devolve false quando outra pessoa salvou antes (409): a janela de conflito abre e a edição fica como está (RNF-15).
  async function submit(version?: number): Promise<boolean> {
    setBusy(true);
    setErrors({});
    setNotice(undefined);
    try {
      await save(
        { name: name.trim(), color: color === "" ? null : color.toLowerCase(), holderDocument: holder === "" ? null : onlyDigits(holder), rules: toRules(rules) },
        version,
      );
      setNotice({ kind: "ok", text: t("organization.saved") });
    } catch (e) {
      if (e instanceof ApiError && e.code === "EDIT_CONFLICT") {
        conflict.open();
        return false;
      }
      const fields = e instanceof ApiError ? e.fields : [];
      setErrors(Object.fromEntries(fields.map((f) => [f.field, f.message])));
      setNotice({ kind: "error", text: t("organization.saveError") });
    } finally {
      setBusy(false);
    }
    return true;
  }

  const shownValue = (v: string) => (v === "" ? t("editConflict.empty") : v);
  function differences(current: OrganizationView): Difference[] {
    const cross = (v: string) => t(`organization.rules.crossUnit.${v}`);
    const mine = toRules(rules);
    const fields: [string, string, string, (v: string) => string][] = [
      [t("organization.name"), name.trim(), current.name, (v) => v],
      [t("organization.color"), color.toLowerCase(), current.color ?? "", (v) => v],
      [t("organization.holder"), onlyDigits(holder), current.holderDocument ?? "", formatCpfCnpj],
      ...(Object.keys(RANGES) as NumericRule[]).map((key): [string, string, string, (v: string) => string] => [
        t(`organization.rules.${key}`),
        String(mine[key]),
        String(current.rules[key]),
        (v) => v,
      ]),
      [t("organization.rules.crossUnitTraining"), mine.crossUnitTraining, current.rules.crossUnitTraining, cross],
    ];
    return fields
      .filter(([, a, b]) => a !== b)
      .map(([label, a, b, show]) => ({ label, mine: shownValue(show(a)), current: shownValue(show(b)) }));
  }
  function reload(current: OrganizationView) {
    setName(current.name);
    setColor(current.color ?? "");
    setHolder(holderText(current));
    setHolderTouched(false);
    setRules(toDraft(current.rules));
    setErrors({});
    setNotice(undefined);
    adopt(current);
    conflict.close();
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (canEdit && dirty && !blocked) void submit();
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <BrandCard
          view={view}
          canEdit={canEdit}
          name={name}
          onName={setName}
          nameError={canEdit ? (errors.name ?? nameError) : undefined}
          holder={holder}
          onHolder={(v) => setHolder(formatCpfCnpj(v))}
          onHolderBlur={() => setHolderTouched(true)}
          holderError={holderShown}
          color={color}
          onColor={setColor}
          colorError={errors.color}
          nameRef={nameInput}
          uploadLogo={api.uploadLogo}
          removeLogo={api.removeLogo}
        />
        <RulesCard draft={rules} onChange={setRules} canEdit={canEdit} errors={ruleErrors} />
      </div>
      <CoordinationCard coordinator={view.coordinator} canTransfer={canEdit} onDone={onTransferred} />
      <NoticeText notice={notice} />
      {canEdit && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" disabled={!dirty || busy} onClick={discard}>
            {t("organization.discard")}
          </Button>
          <Button type="submit" disabled={!dirty || blocked}>
            {busy ? t("organization.saving") : t("organization.save")}
          </Button>
        </div>
      )}
      <EditConflictDialog
        state={conflict.state}
        differences={conflict.state?.status === "ready" ? differences(conflict.state.current) : []}
        busy={busy}
        returnFocusRef={nameInput}
        onRetry={conflict.open}
        onClose={conflict.close}
        onReload={() => conflict.state?.status === "ready" && reload(conflict.state.current)}
        onOverwrite={() => {
          if (conflict.state?.status !== "ready") return;
          void submit(conflict.state.current.version).then((done) => done && conflict.close());
        }}
      />
    </form>
  );
}

function GeneralTab({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation();
  const api = useOrganization();
  const [notice, setNotice] = useState<Notice>();
  if (api.status === "loading") return <LoadingState />;
  if (api.status === "forbidden") return <ForbiddenState />;
  if (!api.view) return <ErrorState onRetry={api.retry} />;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <LastChange value={api.view.lastChange} />
      </div>
      {!canEdit && <Banner tone="info">{t("organization.readOnly")}</Banner>}
      <OrganizationForm view={api.view} api={api} canEdit={canEdit} onTransferred={() => setNotice({ kind: "ok", text: t("organization.transfer.done") })} />
      <NoticeText notice={notice} />
    </div>
  );
}

const TABS = ["geral", "modalidades", "faixas-etarias", "termos", "textos"] as const;

// RF-ORG-01: o Coordenador edita; o Administrador só vê (D8). A barreira é o servidor; aqui só se esconde o que não funciona.
export function OrganizationSettingsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useTabParam(TABS);
  const { state } = useSession();
  const session = state.status === "ready" ? state.session : undefined;
  const role = session?.links.find((l) => l.id === session.activeLinkId)?.role;
  const content = {
    geral: <GeneralTab canEdit={role === "COORDINATOR"} />,
    modalidades: <ModalitiesTab />,
    "faixas-etarias": <AgeRangesTab />,
    termos: <TermsTab />,
    textos: <TextsTab />,
  };
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("organization.title")} />
      <Tabs label={t("organization.tabs.label")} value={tab} onValueChange={setTab} tabs={TABS.map((id) => ({ id, label: t(`organization.tabs.${id}`), content: content[id] }))} />
    </div>
  );
}
