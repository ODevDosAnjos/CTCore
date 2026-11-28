import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, OctagonAlert, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { TONE_CLASS } from "./status-tone";

// Aviso no canto (RNF-44): sucesso e atenção somem sozinhos; erro fica até a pessoa fechar. Todos fecham.
export const TOAST_MS = 5000;
type Kind = "ok" | "warn" | "danger";
type Item = { id: number; kind: Kind; text: string };
type Api = { success: (text: string) => void; warn: (text: string) => void; error: (text: string) => void };

const ICON = { ok: CheckCircle2, warn: AlertTriangle, danger: OctagonAlert } as const;
const ToastContext = createContext<Api | null>(null);

export function useToast(): Api {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast precisa estar dentro de ToastProvider");
  return api;
}

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const close = useCallback((id: number) => setItems((l) => l.filter((i) => i.id !== id)), []);
  const add = useCallback((kind: Kind, text: string) => setItems((l) => [...l, { id: ++seq, kind, text }]), []);
  const api = useMemo<Api>(() => ({ success: (x) => add("ok", x), warn: (x) => add("warn", x), error: (x) => add("danger", x) }), [add]);
  const errors = items.filter((i) => i.kind === "danger");
  const row = (i: Item) => <ToastRow key={i.id} item={i} onClose={() => close(i.id)} label={t("toast.close")} />;
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-60 flex flex-col items-end gap-2 sm:left-auto sm:w-96">
        <div data-testid="toast-live" aria-live="polite" className="flex w-full flex-col gap-2">{items.filter((i) => i.kind !== "danger").map(row)}</div>
        {errors.length > 0 && <div role="alert" className="flex w-full flex-col gap-2">{errors.map(row)}</div>}
      </div>
    </ToastContext.Provider>
  );
}

function ToastRow({ item, onClose, label }: { item: Item; onClose: () => void; label: string }) {
  const Icon = ICON[item.kind];
  useEffect(() => {
    if (item.kind === "danger") return;
    const id = setTimeout(onClose, TOAST_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- um relógio por aviso; onClose é novo a cada render
  }, [item.kind]);
  return (
    <div data-tone={item.kind} className={cn("pointer-events-auto flex items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-menu duration-200 animate-in fade-in-0 slide-in-from-bottom-2", TONE_CLASS[item.kind])}>
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 flex-1 break-words">{item.text}</p>
      <button type="button" onClick={onClose} aria-label={label} className="relative -m-1 rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring after:absolute after:left-1/2 after:top-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2">
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
