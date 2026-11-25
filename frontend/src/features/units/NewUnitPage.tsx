import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Card } from "@/components/Card";
import { isValidPhone, onlyDigits } from "@/components/fields/masks";
import { PhoneField } from "@/components/fields/fields";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { WindowSteps } from "@/components/ui/window-steps";
import { ApiError, api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { SwitchRow } from "./SwitchRow";
import { Text } from "./Text";
import { createUnit, type NewUnit, type NewUnitResult } from "./useUnits";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Form = {
  name: string;
  postalCode: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  phone: string;
  whatsapp: string;
  email: string;
  adminName: string;
  adminEmail: string;
};
const empty: Form = {
  name: "",
  postalCode: "",
  address: "",
  city: "",
  latitude: "",
  longitude: "",
  phone: "",
  whatsapp: "",
  email: "",
  adminName: "",
  adminEmail: "",
};

// Mesmo nome curto que o servidor gera (ShortName.generate), para mostrar já na etapa 1; o servidor decide o definitivo.
const shortNameOf = (name: string) =>
  name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 55)
    .replace(/-$/, "");

// Latitude e longitude vazias valem como "usar o CEP"; preenchidas, as duas e dentro das faixas.
const coordinate = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
function coordinatesOk(f: Form) {
  const lat = coordinate(f.latitude);
  const lon = coordinate(f.longitude);
  if (lat === null && lon === null) return true;
  return lat !== null && lon !== null && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

function body(f: Form): NewUnit {
  const opt = (v: string) => (v.trim() === "" ? undefined : v.trim());
  return {
    name: f.name.trim(),
    postalCode: opt(f.postalCode),
    address: opt(f.address),
    city: opt(f.city),
    latitude: coordinate(f.latitude) ?? undefined,
    longitude: coordinate(f.longitude) ?? undefined,
    phone: opt(f.phone),
    whatsapp: opt(f.whatsapp),
    email: opt(f.email),
    administrator: opt(f.adminName) ? { name: f.adminName.trim(), email: f.adminEmail.trim() } : undefined,
  };
}

const STEP_KEYS = ["unit", "contact", "modalities", "admin"] as const;
// Campo do servidor -> etapa: contato (1) e administrador (3); o resto é da primeira etapa.
const stepOf = (field: string) => (/^(phone|whatsapp|email)$/.test(field) ? 1 : field.startsWith("administrator") ? 3 : 0);

type Modality = { id: string; name: string; active: boolean };
type Catalog = { status: "loading" | "ready" | "error"; items: Modality[] };
type Done = { result: NewUnitResult; modalitiesFailed: boolean };

// RF-ORG-03 (D6): as modalidades escolhidas são ligadas logo depois de criar a unidade, uma a uma.
function Wizard({ onDone, onForbidden }: { onDone: (d: Done) => void; onForbidden: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(empty);
  const [chosen, setChosen] = useState<string[]>([]);
  // RF-ORG-03 / D7: o valor da vaga é só informação do convite; se não carregar, o resumo aparece sem ele.
  const [seatPrice, setSeatPrice] = useState<number>();
  useEffect(() => {
    api<{ adminSeatCents: number }>("/organization/admin-seat-price").then((r) => setSeatPrice(r.adminSeatCents), () => undefined);
  }, []);
  const [catalog, setCatalog] = useState<Catalog>({
    status: "loading",
    items: [],
  });
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();
  const set = (k: keyof Form) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let alive = true;
    api<Modality[]>("/modalities").then(
      (items) => alive && setCatalog({ status: "ready", items: items.filter((m) => m.active) }),
      () => alive && setCatalog({ status: "error", items: [] }),
    );
    return () => {
      alive = false;
    };
  }, [tick]);

  const nameError = f.name.trim() === "" ? t("units.new.nameRequired") : f.name.trim().length > 120 ? t("units.new.nameTooLong") : undefined;
  const cepBad = f.postalCode.trim() !== "" && onlyDigits(f.postalCode).length !== 8;
  const coordsBad = !coordinatesOk(f);
  const phoneBad = f.phone !== "" && !isValidPhone(f.phone);
  const whatsappBad = f.whatsapp !== "" && !isValidPhone(f.whatsapp);
  const emailBad = f.email.trim() !== "" && !EMAIL.test(f.email.trim());
  const hasName = f.adminName.trim() !== "";
  const hasMail = f.adminEmail.trim() !== "";
  const inviteIncomplete = hasName !== hasMail;
  const inviteMailBad = hasMail && !EMAIL.test(f.adminEmail.trim());
  const valid = [!nameError && !cepBad && !coordsBad, !phoneBad && !whatsappBad && !emailBad, true, !inviteIncomplete && !inviteMailBad];
  const last = step === STEP_KEYS.length - 1;

  async function finish() {
    if (busy) return;
    setBusy(true);
    setFailure(undefined);
    let result: NewUnitResult;
    try {
      result = await createUnit(body(f));
    } catch (e) {
      setBusy(false);
      if (e instanceof ApiError && e.status === 403) return onForbidden();
      if (e instanceof ApiError && e.code === "UNIT_LIMIT_REACHED") return setFailure(t("units.new.limitReached"));
      const field = e instanceof ApiError && e.status === 400 ? e.fields[0]?.field : undefined;
      if (field) {
        const target = stepOf(field);
        setStep(target);
        return setFailure(
          t("units.new.fieldError", {
            field,
            step: t(`units.new.steps.${STEP_KEYS[target]}`),
          }),
        );
      }
      return setFailure(t("units.new.error"));
    }
    const settled = await Promise.allSettled(
      chosen.map((id) =>
        api(`/units/${result.unit.id}/modalities/${id}`, {
          method: "PUT",
          body: { offered: true },
        }),
      ),
    );
    onDone({
      result,
      modalitiesFailed: settled.some((s) => s.status === "rejected"),
    });
  }

  const contents: ReactNode[] = [
    <div key="unit" className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Text label={t("units.new.name")} value={f.name} onChange={set("name")} required error={f.name !== "" ? nameError : undefined} autoComplete="off" />
        <Field label={t("units.new.shortName")} hint={t("units.new.shortNameHelp")}>
          {(c) => <Input {...c} readOnly value={shortNameOf(f.name)} />}
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <Text
          label={t("units.new.postalCode")}
          value={f.postalCode}
          onChange={set("postalCode")}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={9}
          error={cepBad ? t("units.new.postalCodeInvalid") : undefined}
        />
        <Text label={t("units.new.address")} value={f.address} onChange={set("address")} autoComplete="street-address" />
      </div>
      <div className="flex flex-col items-start gap-2 rounded-md border border-dashed bg-surface-soft p-4">
        <p className="text-sm font-medium">{t("units.new.mapTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("units.new.mapHint")}</p>
        <ComingSoon variant="button" label={t("units.new.mapSoon")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Text label={t("units.new.city")} value={f.city} onChange={set("city")} autoComplete="address-level2" />
        <Text label={t("units.new.latitude")} value={f.latitude} onChange={set("latitude")} inputMode="decimal" />
        <Text label={t("units.new.longitude")} value={f.longitude} onChange={set("longitude")} inputMode="decimal" error={coordsBad ? t("units.new.coordinatesInvalid") : undefined} />
      </div>
    </div>,
    <div key="contact" className="grid gap-3 sm:grid-cols-2">
      <PhoneField label={t("units.new.phone")} initial={f.phone} onChange={set("phone")} />
      <PhoneField label={t("units.new.whatsapp")} initial={f.whatsapp} onChange={set("whatsapp")} />
      <div className="sm:col-span-2">
        <Text label={t("units.new.email")} value={f.email} onChange={set("email")} type="email" autoComplete="off" error={emailBad ? t("units.new.emailInvalid") : undefined} />
      </div>
    </div>,
    <div key="modalities" className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">{t("units.new.modalitiesHelp")}</p>
      {catalog.status === "loading" ? (
        <LoadingState />
      ) : catalog.status === "error" ? (
        <ErrorState
          onRetry={() => {
            setCatalog({ status: "loading", items: [] });
            setTick((n) => n + 1);
          }}
        />
      ) : catalog.items.length === 0 ? (
        <p className="text-sm">{t("units.new.modalitiesEmpty")}</p>
      ) : (
        catalog.items.map((m) => <SwitchRow key={m.id} label={m.name} checked={chosen.includes(m.id)} onChange={(on) => setChosen((c) => (on ? [...c, m.id] : c.filter((x) => x !== m.id)))} />)
      )}
    </div>,
    <div key="admin" className="flex flex-col gap-3">
      <p className="text-sm font-medium">{t("units.new.inviteTitle")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Text label={t("units.new.inviteName")} value={f.adminName} onChange={set("adminName")} autoComplete="off" />
        <Text
          label={t("units.new.inviteEmail")}
          value={f.adminEmail}
          onChange={set("adminEmail")}
          type="email"
          autoComplete="off"
          error={inviteIncomplete ? t("units.new.inviteIncomplete") : inviteMailBad ? t("units.new.emailInvalid") : undefined}
        />
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {hasName && hasMail && !inviteMailBad
          ? t("units.new.inviteSummary", {
              name: f.adminName.trim(),
              email: f.adminEmail.trim(),
            }) + (seatPrice === undefined ? "" : " " + t("units.new.inviteCost", { price: formatCurrency(seatPrice) }))
          : t("units.new.noInvite")}
      </p>
    </div>,
  ];

  return (
    <Card className="flex flex-col gap-5">
      <WindowSteps steps={STEP_KEYS.map((k) => t(`units.new.steps.${k}`))} current={step + 1} />
      {busy && <LoadingState />}
      {failure && <Banner tone="danger">{failure}</Banner>}
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid[step]) return;
          if (last) void finish();
          else setStep(step + 1);
        }}
      >
        {contents[step]}
        <div className="flex flex-wrap justify-end gap-2 border-t border-divider pt-4">
          <Button asChild variant="ghost">
            <Link to="/configuracoes/unidades">{t("common.cancel")}</Link>
          </Button>
          {step > 0 && (
            <Button type="button" variant="secondary" onClick={() => setStep(step - 1)}>
              {t("common.back")}
            </Button>
          )}
          <Button type="submit" disabled={!valid[step] || busy}>
            {last ? t("units.new.finish") : t("units.new.continue")}
            {!last && <ArrowRight aria-hidden />}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Created({ done }: { done: Done }) {
  const { t } = useTranslation();
  const { result } = done;
  return (
    <Card heading="h2" title={t("units.new.created", { name: result.unit.name })}>
      <p role="status">
        {result.invite === "FAILED" ? t("units.new.inviteFailed") : result.invite === "SENT" ? t("units.new.inviteSent") : null} {done.modalitiesFailed ? t("units.new.modalitiesFailed") : null}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {done.modalitiesFailed && (
          <Button asChild>
            <Link to={`/configuracoes/unidade?unidade=${result.unit.id}`}>{t("units.new.toUnit")}</Link>
          </Button>
        )}
        <Button asChild variant={done.modalitiesFailed ? "secondary" : "primary"}>
          <Link to="/configuracoes/unidades">{t("units.new.toList")}</Link>
        </Button>
      </div>
    </Card>
  );
}

function Content({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("units.new.title")} subtitle={t("units.new.subtitle")} />
      {children}
    </div>
  );
}

// RF-ORG-03: assistente de nova unidade. Só o Coordenador (a rota já nega os demais; a barreira de dados é o servidor).
export function NewUnitPage() {
  const navigate = useNavigate();
  const [forbidden, setForbidden] = useState(false);
  const [done, setDone] = useState<Done>();
  function finished(d: Done) {
    // Convite ou modalidade que falhou fica na tela com o aviso; nos demais casos volta à lista, que já traz a unidade nova.
    if (d.result.invite === "FAILED" || d.modalitiesFailed) setDone(d);
    else
      void navigate("/configuracoes/unidades", {
        state: { created: d.result.unit.name },
      });
  }
  return (
    <Content>{forbidden ? <ForbiddenState /> : done ? <Created done={done} /> : <Wizard onDone={finished} onForbidden={() => setForbidden(true)} />}</Content>
  );
}
