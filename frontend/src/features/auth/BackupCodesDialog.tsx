import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";

/** Código de 10 caracteres exibido em dois blocos de 5 (D5 do item 490); copiar e baixar levam o texto exibido. */
export const formatCode = (c: string) => (c.length === 10 ? `${c.slice(0, 5)}-${c.slice(5)}` : c);

/** Os 10 códigos em grade 2x5, com copiar, baixar e a caixa âmbar (RN-ACE-18). O rodapé é o `BackupCodesFooter`. */
export function BackupCodesBody({ codes }: { codes: string[] }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const text = codes.map(formatCode).join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([text + "\n"], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = t("twoFactor.codes.fileName");
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">{t("twoFactor.codes.description")}</p>
      <ul aria-label={t("twoFactor.codes.list")} className="grid grid-cols-2 gap-2 font-mono">
        {codes.map((c) => (
          <li key={c} className="rounded-md bg-surface-soft px-3 py-2 text-center text-base tracking-wider">
            {formatCode(c)}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => void copy()}>
          <Copy aria-hidden />
          {t("twoFactor.codes.copy")}
        </Button>
        <Button type="button" variant="secondary" onClick={download}>
          <Download aria-hidden />
          {t("twoFactor.codes.download")}
        </Button>
      </div>
      {copied && <Banner tone="ok">{t("twoFactor.codes.copied")}</Banner>}
      <Banner tone="warn">{t("twoFactor.codes.support")}</Banner>
    </div>
  );
}

/** Rodapé da janela dos códigos: a caixa de confirmação e "Concluir" lado a lado. */
export function BackupCodesFooter({ saved, onSaved, onDone }: { saved: boolean; onSaved: (v: boolean) => void; onDone: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" className="size-5" checked={saved} onChange={(e) => onSaved(e.target.checked)} />
        {t("twoFactor.codes.saved")}
      </label>
      <Button type="button" disabled={!saved} onClick={onDone}>
        {t("twoFactor.codes.done")}
      </Button>
    </div>
  );
}

type Phase = "loading" | "failed" | "forbidden" | "codes";

/**
 * Janela dos códigos de reserva (canvas CodigosReserva). Com `codes`, mostra-os; sem eles, gera 10 novos ao abrir,
 * só com a sessão (os anteriores deixam de valer).
 */
export function BackupCodesDialog({ open, codes: initial, onClose }: { open: boolean; codes?: string[]; onClose: () => void }) {
  const { t } = useTranslation();
  const [codes, setCodes] = useState<string[] | null>(initial ?? null);
  const [phase, setPhase] = useState<Phase>(initial ? "codes" : "loading");
  const [saved, setSaved] = useState(false);
  const started = useRef(false);

  const generate = useCallback(async () => {
    setPhase("loading");
    try {
      const res = await api<{ backupCodes: string[] }>("/auth/two-factor/backup-codes", { method: "POST" });
      setCodes(res.backupCodes);
      setPhase("codes");
    } catch (err) {
      setPhase(err instanceof ApiError && err.status === 403 ? "forbidden" : "failed");
    }
  }, []);

  useEffect(() => {
    if (!open || initial || started.current) return;
    started.current = true;
    void generate();
  }, [open, initial, generate]);

  const showing = phase === "codes" && codes;
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && phase !== "codes" && onClose()}
      title={t("twoFactor.codes.title")}
      size="md"
      scrim="canvas"
      dismissible={phase !== "codes"}
      footer={showing && <BackupCodesFooter saved={saved} onSaved={setSaved} onDone={onClose} />}
    >
      {showing ? <BackupCodesBody codes={codes} /> : phase === "forbidden" ? <ForbiddenState /> : phase === "failed" ? <ErrorState onRetry={() => void generate()} /> : <LoadingState />}
    </Modal>
  );
}
