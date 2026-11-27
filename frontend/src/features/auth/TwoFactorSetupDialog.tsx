import { useEffect, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { WindowSteps } from "@/components/ui/window-steps";
import { ApiError, api } from "@/lib/api";
import { BackupCodesBody, BackupCodesFooter } from "./BackupCodesDialog";
import { CodeField } from "./CodeField";

type Setup = { secret: string; otpauthUri: string };
type Phase =
  | { name: "password"; expired?: boolean }
  | { name: "loading" }
  | { name: "failed" }
  | { name: "forbidden" }
  | { name: "form"; setup: Setup; qr: string }
  | { name: "codes"; codes: string[] };

/** Chave em grupos de 4 ("JBSW Y3DP EHPK 3PXP"), mais fácil de digitar no app. */
const groupKey = (secret: string) => secret.replace(/\s/g, "").match(/.{1,4}/g)?.join(" ") ?? secret;

const withQr = async (setup: Setup): Promise<Phase> => ({ name: "form", setup, qr: await QRCode.toDataURL(setup.otpauthUri, { margin: 1, width: 192 }) });

/**
 * Janela "Ativar duas etapas" (canvas DuasEtapas): passos 1 e 2 na mesma tela (QR, chave e código) e o 3 nos códigos de reserva (D4).
 * `required`: quem é obrigado (Coordenador) não tem "Agora não" (RN-ACE-17).
 * `replace` (RF-ACE-04, issue 764): troca de aparelho. Começa pela senha e o código atual, não gera códigos de reserva e conclui no código do app novo.
 */
export function TwoFactorSetupDialog({ open, onClose, onEnabled, required = false, replace = false }: { open: boolean; onClose: () => void; onEnabled: () => void; required?: boolean; replace?: boolean }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>(replace ? { name: "password" } : { name: "loading" });
  const [password, setPassword] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const [errors, setErrors] = useState<{ password?: string; code?: string; form?: string }>({});
  const [attempt, setAttempt] = useState(0);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);

  // Só com a janela aberta: cada abertura gera um segredo novo (o servidor substitui o pendente).
  useEffect(() => {
    if (!open || replace) return;
    let live = true;
    api<Setup>("/auth/two-factor/setup", { method: "POST" })
      .then(async (setup) => {
        const next = await withQr(setup);
        if (live) setPhase(next);
      })
      .catch((err) => {
        if (live) setPhase(err instanceof ApiError && err.status === 403 ? { name: "forbidden" } : { name: "failed" });
      });
    return () => {
      live = false;
    };
  }, [open, replace, attempt]);

  async function requestReplace(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (!password || !currentCode) {
      setErrors({ form: t("twoFactor.codes.required") });
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const setup = await api<Setup>("/auth/two-factor/replace", { method: "POST", body: { password, code: currentCode } });
      setCode("");
      setError(null);
      setPhase(await withQr(setup));
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const apiCode = err instanceof ApiError ? err.code : "";
      if (apiCode === "INVALID_CREDENTIALS") setErrors({ password: t("reauth.invalidPassword") });
      else if (apiCode === "INVALID_TWO_FACTOR_CODE") setErrors({ code: t("reauth.invalidCode") });
      else if (status === 429) setErrors({ form: t("twoFactor.errors.tooMany") });
      else setPhase(status === 403 ? { name: "forbidden" } : { name: "failed" });
    } finally {
      setSending(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (code.length !== 6) {
      setError(t("twoFactor.setup.codeRequired"));
      return;
    }
    setError(null);
    setSending(true);
    try {
      if (replace) {
        await api<void>("/auth/two-factor/replace/confirm", { method: "POST", body: { code } });
        onEnabled();
        return;
      }
      const res = await api<{ backupCodes: string[] }>("/auth/two-factor/enable", { method: "POST", body: { code } });
      setPhase({ name: "codes", codes: res.backupCodes });
    } catch (err) {
      if (replace && err instanceof ApiError && err.status === 403) setPhase({ name: "forbidden" });
      else if (replace && err instanceof ApiError && err.status === 409) {
        // Pedido vencido ou já concluído: recomeça pela senha; um código de reserva usado antes já foi gasto.
        setCurrentCode("");
        setPhase({ name: "password", expired: true });
      } else if (err instanceof ApiError && err.code === "INVALID_TWO_FACTOR_CODE") setError(t("twoFactor.setup.invalid"));
      else if (err instanceof ApiError && err.status === 429) setError(t("twoFactor.errors.tooMany"));
      else setError(t("twoFactor.errors.failed"));
    } finally {
      setSending(false);
    }
  }

  const inCodes = phase.name === "codes";
  const steps = [t("twoFactor.setup.stepRead"), t("twoFactor.setup.stepConfirm"), ...(replace ? [] : [t("twoFactor.setup.stepSave")])];
  const cancel = (
    <Button type="button" variant="ghost" onClick={onClose}>
      {t("common.cancel")}
    </Button>
  );
  let body;
  let footer;
  switch (phase.name) {
    case "password":
      body = (
        <form id="two-factor-replace" noValidate onSubmit={requestReplace} className="space-y-4" aria-busy={sending}>
          <p className="text-sm">{t("twoFactor.replace.intro")}</p>
          {phase.expired && <Banner tone="warn">{t("twoFactor.replace.expired")}</Banner>}
          {errors.form && <Banner tone="danger">{errors.form}</Banner>}
          <Field label={t("reauth.password")} error={errors.password} alertError>
            {(c) => <Input {...c} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
          <CodeField id="replace-code" kind="any" label={t("reauth.code")} value={currentCode} onChange={setCurrentCode} error={errors.code} />
        </form>
      );
      footer = (
        <>
          {cancel}
          <Button type="submit" form="two-factor-replace" disabled={sending}>
            {sending ? t("twoFactor.setup.sending") : t("twoFactor.replace.next")}
          </Button>
        </>
      );
      break;
    case "loading":
      body = <LoadingState text={t("twoFactor.setup.loading")} />;
      break;
    case "forbidden":
      body = <ForbiddenState />;
      break;
    case "failed":
      body = (
        <ErrorState
          onRetry={() => {
            if (replace) {
              setPhase({ name: "password" });
              return;
            }
            setPhase({ name: "loading" });
            setAttempt((a) => a + 1);
          }}
        />
      );
      break;
    case "codes":
      body = <BackupCodesBody codes={phase.codes} />;
      footer = <BackupCodesFooter saved={saved} onSaved={setSaved} onDone={onEnabled} />;
      break;
    case "form":
      body = (
        <form id="two-factor-setup" noValidate onSubmit={submit} className="grid gap-6 sm:grid-cols-[auto_1fr]" aria-busy={sending}>
          <img src={phase.qr} width={192} height={192} alt={t(replace ? "twoFactor.replace.qrAlt" : "twoFactor.setup.qrAlt")} className="mx-auto size-48 rounded-md border" />
          <div className="min-w-0 space-y-4">
            <p className="text-sm">{t(replace ? "twoFactor.replace.step1" : "twoFactor.setup.step1")}</p>
            <div className="space-y-2">
              <p className="text-sm">{t("twoFactor.setup.step2")}</p>
              <p aria-label={t("twoFactor.setup.keyLabel")} className="break-all rounded-md border bg-surface-soft px-3 py-2 font-mono text-base">{groupKey(phase.setup.secret)}</p>
            </div>
            <CodeField id="setup-code" label={t("twoFactor.setup.codeLabel")} placeholder={t("twoFactor.setup.placeholder")} value={code} onChange={setCode} error={error} />
            <p className="text-sm text-muted-foreground">{t(replace ? "twoFactor.replace.warning" : "twoFactor.setup.warning")}</p>
          </div>
        </form>
      );
      footer = (
        <>
          {replace
            ? cancel
            : !required && (
                <Button type="button" variant="ghost" onClick={onClose}>
                  {t("twoFactor.setup.later")}
                </Button>
              )}
          <Button type="submit" form="two-factor-setup" disabled={sending}>
            {sending ? t("twoFactor.setup.sending") : t("twoFactor.setup.submit")}
          </Button>
        </>
      );
      break;
  }

  return (
    <Modal open={open} onOpenChange={(o) => !o && !inCodes && onClose()} title={t(replace ? "twoFactor.replace.title" : "twoFactor.setup.title")} size="md" scrim="canvas" dismissible={!inCodes} footer={footer}>
      <div className="space-y-4">
        {phase.name !== "password" && <WindowSteps steps={steps} current={inCodes ? 3 : code ? 2 : 1} />}
        {body}
      </div>
    </Modal>
  );
}
