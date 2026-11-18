import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ErrorState } from "@/components/states";
import { AuthShell } from "@/components/layout/AuthShell";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import { CodeField } from "./CodeField";
import type { SessionView } from "./SessionProvider";

// RF-ACE-01 (canvas LoginDuasEtapas e LoginCodigoReserva): segundo passo do login com o bilhete devolvido pela senha certa.
export function TwoFactorStep({
  ticket,
  backupCodesRemaining,
  onDone,
  onExpired,
}: {
  ticket: string;
  /** Códigos de reserva que restam (D3); sem o número, a caixa informativa fala só de gerar códigos novos. */
  backupCodesRemaining?: number;
  onDone: (session: SessionView) => void;
  onExpired: () => void;
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function submit(value = code, e?: FormEvent) {
    e?.preventDefault();
    if (sending) return;
    if (!value) {
      setError(t("twoFactor.login.required"));
      return;
    }
    setError(null);
    setFailed(false);
    setSending(true);
    try {
      onDone(await api<SessionView>("/auth/login/two-factor", { method: "POST", body: { ticket, code: value } }));
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const apiCode = err instanceof ApiError ? err.code : "";
      if (apiCode === "TWO_FACTOR_TICKET_INVALID") onExpired();
      else if (apiCode === "INVALID_TWO_FACTOR_CODE") {
        setError(t("twoFactor.login.invalid"));
        ref.current?.focus();
      } else if (status === 429) setError(t("twoFactor.errors.tooMany"));
      else setFailed(true);
    } finally {
      setSending(false);
    }
  }

  function swap() {
    setBackup((b) => !b);
    setCode("");
    setError(null);
  }

  return (
    <AuthShell
      title={t(backup ? "twoFactor.login.backupTitle" : "twoFactor.login.title")}
      subtitle={t(backup ? "twoFactor.login.introBackup" : "twoFactor.login.intro")}
    >
      {failed ? (
        <ErrorState onRetry={() => void submit()} />
      ) : (
        <form noValidate onSubmit={(e) => void submit(code, e)} className="space-y-4" aria-busy={sending}>
          <CodeField
            key={backup ? "backup" : "totp"}
            inputRef={ref}
            label={t(backup ? "twoFactor.login.backupLabel" : "twoFactor.login.codeLabel")}
            hideLabel={!backup}
            hint={backup ? t("twoFactor.login.backupHint") : undefined}
            kind={backup ? "any" : "totp"}
            value={code}
            onChange={setCode}
            onComplete={(v) => void submit(v)}
            error={error}
          />
          <Button type="submit" size="lg" className="w-full" disabled={sending}>
            {sending ? t("twoFactor.login.sending") : t("twoFactor.login.submit")}
          </Button>
          <button type="button" className="text-sm font-medium underline" onClick={swap}>
            {t(backup ? "twoFactor.login.useApp" : "twoFactor.login.useBackup")}
          </button>
          {backup ? (
            <Banner tone="info">
              {backupCodesRemaining === undefined
                ? t("twoFactor.login.backupInfoNoCount")
                : t("twoFactor.login.backupInfo", { n: backupCodesRemaining })}
            </Banner>
          ) : (
            <p className="text-sm text-muted-foreground">{t("twoFactor.login.note")}</p>
          )}
        </form>
      )}
    </AuthShell>
  );
}
