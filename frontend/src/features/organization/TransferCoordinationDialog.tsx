import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input, Select } from "@/components/ui/field";
import { SummaryBox } from "@/components/ui/summary-box";
import { CodeField } from "@/features/auth/CodeField";
import { useSession, type SessionView } from "@/features/auth/SessionProvider";
import type { UnitSummary } from "@/features/units/useUnits";
import type { StaffUser } from "@/features/users/useUsers";
import { ApiError, api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

type Phase = "form" | "sending" | "failed" | "forbidden";
type Errors = { email?: string; confirmation?: string; password?: string; code?: string; form?: string };
type Admins = { status: "loading" } | { status: "error" } | { status: "forbidden" } | { status: "ready"; list: StaffUser[]; units: UnitSummary[]; seatCents: number };

const FORM_ID = "transfer-coordination-form";

// RF-ORG-06 / RN-ACE-21 / RNF-26: escolhe o Administrador, digita a palavra, a senha e (com duas etapas) o código; a confirmação
// de identidade e a transferência saem no mesmo clique (D4). Senha e código só vão ao servidor e saem da memória ao fechar.
export function TransferCoordinationDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const { state, setSession, clear } = useSession();
  const withCode = state.status === "ready" && state.session.twoFactor.enabled;
  const [admins, setAdmins] = useState<Admins>({ status: "loading" });
  const [reload, setReload] = useState(0);
  const [linkId, setLinkId] = useState("");
  const [keep, setKeep] = useState<string[]>([]);
  const [word, setWord] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!open) return;
    let alive = true;
    Promise.all([api<StaffUser[]>("/users?status=ACTIVE"), api<UnitSummary[]>("/units"), api<{ adminSeatCents: number }>("/organization/admin-seat-price")]).then(
      ([list, all, price]) =>
        alive &&
        setAdmins({ status: "ready", list: list.filter((u) => u.role === "ADMINISTRATOR" && u.status === "ACTIVE"), units: all.filter((u) => u.active), seatCents: price.adminSeatCents }),
      (e) => alive && setAdmins({ status: e instanceof ApiError && e.status === 403 ? "forbidden" : "error" }),
    );
    return () => {
      alive = false;
    };
  }, [open, reload]);

  const list = admins.status === "ready" ? admins.list : [];
  const units = admins.status === "ready" ? admins.units : [];
  const seatCents = admins.status === "ready" ? admins.seatCents : 0;
  const chosen = list.find((u) => u.linkId === linkId);
  // R10: unidade que o escolhido administra sozinho; sem marcar, ela ficaria sem Administrador.
  const alone = new Set(
    (chosen?.units ?? []).filter((x) => units.some((u) => u.id === x.id) && !list.some((o) => o !== chosen && o.units.some((y) => y.id === x.id))).map((x) => x.id),
  );
  const keptNames = units.filter((u) => keep.includes(u.id)).map((u) => u.name);
  const ready = !!chosen && word.trim().toUpperCase() === t("organization.transfer.word") && password !== "" && (!withCode || code !== "");
  const sending = phase === "sending";

  function close() {
    setAdmins({ status: "loading" });
    setLinkId("");
    setKeep([]);
    setWord("");
    setPassword("");
    setCode("");
    setErrors({});
    setPhase("form");
    onClose();
  }

  // Passo 1: confirmação de identidade (senha e código); passo 2: a transferência com o token de uso único.
  async function submit() {
    if (!chosen || sending) return;
    setErrors({});
    setPhase("sending");
    let token: string;
    try {
      token = (await api<{ reauthToken: string }>("/auth/reauth", { method: "POST", body: { action: "TRANSFER_COORDINATION", password, ...(withCode ? { code } : {}) } })).reauthToken;
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      const apiCode = e instanceof ApiError ? e.code : "";
      if (apiCode === "INVALID_CREDENTIALS") return fail("form", { password: t("organization.transfer.invalidPassword") });
      if (apiCode === "INVALID_TWO_FACTOR_CODE") return fail("form", { code: t("organization.transfer.invalidCode") });
      if (status === 429) return fail("form", { form: t("organization.transfer.tooMany") });
      return fail(status === 403 ? "forbidden" : "failed");
    }
    try {
      await api("/organization/coordination-transfer", { method: "POST", body: { email: chosen.email, confirmation: word.trim(), keepUnitIds: keep }, headers: { "X-Reauth-Token": token } });
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      if (e instanceof ApiError && status === 400) {
        const has = (field: string) => e.fields.some((f) => f.field === field);
        return fail("form", {
          email: has("email") ? t("organization.transfer.emailInvalid") : undefined,
          confirmation: has("confirmation") ? t("organization.transfer.confirmationInvalid") : undefined,
          form: has("keepUnitIds") ? t("organization.transfer.keepInvalid") : undefined,
        });
      }
      if (e instanceof ApiError && status === 409 && e.code === "LAST_UNIT_ADMINISTRATOR") {
        const ids = (e.fields.find((f) => f.field === "unitIds")?.message ?? "").split(",");
        const names = units.filter((u) => ids.includes(u.id)).map((u) => u.name);
        return fail("form", { form: t("organization.transfer.lastAdmin", { units: names.join(t("organization.transfer.unitsJoin")) }) });
      }
      if (status === 429) return fail("form", { form: t("organization.transfer.tooMany") });
      return fail(status === 403 ? "forbidden" : "failed");
    }
    // R11 / RN-ACE-20: sem unidade marcada a sessão de gestão acabou; vai ao login com o aviso.
    if (keep.length === 0) {
      close();
      return clear(true);
    }
    // A sessão é recarregada sem passar por "carregando", para a tela e o aviso não serem refeitos.
    try {
      setSession(await api<SessionView>("/auth/session"));
    } catch {
      // o perfil novo aparece na próxima leitura da sessão
    }
    close();
    onDone();
  }

  function fail(next: Phase, found: Errors = {}) {
    setErrors(found);
    setPhase(next);
  }

  const unitNames = (u: StaffUser) => u.units.map((x) => x.name).join(t("organization.transfer.unitsJoin"));
  const toggle = (id: string) => setKeep((now) => (now.includes(id) ? now.filter((x) => x !== id) : [...now, id]));
  const first = chosen?.name.split(" ")[0] ?? t("organization.transfer.summary.generic");
  const body =
    admins.status === "loading" ? (
      <LoadingState />
    ) : admins.status === "forbidden" || phase === "forbidden" ? (
      <ForbiddenState />
    ) : admins.status === "error" ? (
      <ErrorState onRetry={() => (setAdmins({ status: "loading" }), setReload((n) => n + 1))} />
    ) : phase === "failed" ? (
      <ErrorState onRetry={() => void submit()} />
    ) : (
      <form
        id={FORM_ID}
        noValidate
        className="flex flex-col gap-3"
        aria-busy={sending}
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) void submit();
        }}
      >
        <p className="text-sm">{t("organization.transfer.intro")}</p>
        {errors.form && <Banner tone="danger">{errors.form}</Banner>}
        <Field label={t("organization.transfer.newCoordinator")} error={errors.email} alertError>
          {(c) => (
            <Select {...c} disabled={sending || list.length === 0} value={linkId} onChange={(e) => setLinkId(e.target.value)}>
              <option value="">{list.length === 0 ? t("organization.transfer.noneActive") : t("organization.transfer.choose")}</option>
              {list.map((u) => (
                <option key={u.linkId} value={u.linkId}>
                  {t("organization.transfer.option", { name: u.name, units: unitNames(u) })}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <fieldset className="flex flex-col gap-1" disabled={sending}>
          <legend className="text-sm font-medium">{t("organization.transfer.keepLegend")}</legend>
          <p className="text-xs text-muted-foreground">{t("organization.transfer.keepHint", { price: formatCurrency(seatCents) })}</p>
          {units.map((u) => (
            <div key={u.id}>
              <Checkbox label={u.name} checked={keep.includes(u.id)} onChange={() => toggle(u.id)} />
              {alone.has(u.id) && !keep.includes(u.id) && <Banner tone="warn" className="ml-6">{t("organization.transfer.aloneWarning", { name: first })}</Banner>}
            </div>
          ))}
          <p className="text-sm font-medium" aria-live="polite">
            {keep.length === 0 ? t("organization.transfer.noCost") : t("organization.transfer.total", { total: formatCurrency(seatCents * keep.length) })}
          </p>
        </fieldset>
        <SummaryBox
          label={t("organization.transfer.summaryLabel")}
          items={[
            t("organization.transfer.summary.mail", { name: first }),
            t("organization.transfer.summary.assets", { name: first }),
            keep.length === 0 ? t("organization.transfer.summary.lose") : t("organization.transfer.summary.stay", { units: keptNames.join(t("organization.transfer.unitsJoin")) }),
          ]}
        />
        <p className="text-sm">
          {t("organization.transfer.confirmBefore")}
          <strong>{t("organization.transfer.word")}</strong>
          {t("organization.transfer.confirmAfter")}
        </p>
        <Field label={t("organization.transfer.typeLabel")} error={errors.confirmation} alertError>
          {(c) => <Input {...c} autoComplete="off" disabled={sending} placeholder={t("organization.transfer.word")} value={word} onChange={(e) => setWord(e.target.value)} />}
        </Field>
        <div className={withCode ? "grid gap-3 sm:grid-cols-2" : undefined}>
          <Field label={t("organization.transfer.password")} error={errors.password} alertError>
            {(c) => <Input {...c} type="password" autoComplete="current-password" disabled={sending} value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
          {withCode && <CodeField kind="any" label={t("organization.transfer.code")} value={code} onChange={setCode} error={errors.code} />}
        </div>
      </form>
    );

  const showFooter = admins.status === "ready" && phase !== "forbidden" && phase !== "failed";
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && !sending && close()}
      title={t("organization.transfer.title")}
      size="md"
      scrim="canvas"
      footer={
        showFooter ? (
          <>
            <Button type="button" variant="ghost" onClick={close} disabled={sending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={FORM_ID} variant="dangerSolid" disabled={!ready || sending}>
              {sending ? t("organization.transfer.sending") : t("organization.transfer.submit")}
            </Button>
          </>
        ) : undefined
      }
    >
      {body}
    </Modal>
  );
}
