import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

export type TabItem = {
  id: string;
  label: string;
  content: React.ReactNode;
  /** Marca depois do rótulo (ex.: aviso de erro na aba). */
  badge?: React.ReactNode;
  /** R3: aba de item futuro, com o selo "Em breve" e a dica; alcançável pelas setas, mas nunca fica ativa. */
  soon?: boolean;
};

/** Abas com teclado (setas, Home, End); só o painel ativo é exibido. Com `value`, a aba ativa é de quem usa (controlada). */
export function Tabs({
  tabs,
  label,
  defaultId,
  value,
  onValueChange,
  className,
}: {
  tabs: TabItem[];
  label: string;
  defaultId?: string;
  value?: string;
  onValueChange?: (id: string) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const base = React.useId();
  const [inner, setInner] = React.useState(defaultId ?? tabs.find((tab) => !tab.soon)?.id);
  const active = value ?? inner;
  const setActive = (id: string) => {
    setInner(id);
    onValueChange?.(id);
  };
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const go = (i: number) => {
    const next = tabs[(i + tabs.length) % tabs.length];
    if (!next.soon) setActive(next.id);
    refs.current[next.id]?.focus();
  };
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    go(to);
  };
  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_var(--divider)]">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[tab.id] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-t-${tab.id}`}
            aria-selected={tab.id === active}
            aria-controls={tab.soon ? undefined : `${base}-p-${tab.id}`}
            tabIndex={tab.id === active ? 0 : -1}
            aria-disabled={tab.soon || undefined}
            // dica nativa: a lista rola na horizontal e cortaria um balão próprio
            title={tab.soon ? t("comingSoon.hint") : undefined}
            onClick={tab.soon ? undefined : () => setActive(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative min-h-11 whitespace-nowrap border-b-2 px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              tab.id === active ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              tab.soon && "cursor-not-allowed hover:text-muted-foreground",
            )}
          >
            {tab.label}
            {tab.badge}
            {tab.soon && (
              // fora do nome acessível: a explicação chega pela dica
              <span aria-hidden className="ml-2">
                <Badge tone="neutral">{t("comingSoon.badge")}</Badge>
              </span>
            )}
          </button>
        ))}
      </div>
      {tabs.map(
        (tab) =>
          tab.id === active && (
            <div key={tab.id} role="tabpanel" id={`${base}-p-${tab.id}`} aria-labelledby={`${base}-t-${tab.id}`} className="pt-4">
              {tab.content}
            </div>
          ),
      )}
    </div>
  );
}
