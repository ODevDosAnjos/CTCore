import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Building2, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RadioCard } from "@/components/ui/radio-card";
import { cn } from "@/lib/utils";
import { usePopover } from "./usePopover";

export const ALL_UNITS = "all";
export interface UnitOption {
  id: string;
  name: string;
}
export interface UnitMenuProps {
  status: "loading" | "ready" | "forbidden" | "error";
  units: UnitOption[];
  /** Abrangência "Todas as unidades" (só consulta). */
  allUnits: boolean;
  selected: string | null;
  onSelect: (value: string) => void;
  onRetry: () => void;
  /** "desktop": botão com lista suspensa; "mobile": botão que abre a folha de baixo; "compact": o mesmo, em linha pequena sob o título da barra do celular (D5, D6). */
  variant?: "desktop" | "mobile" | "compact";
}

const compactTrigger = "relative inline-flex min-h-5 min-w-0 items-center gap-1 text-xs text-muted-foreground after:absolute after:-inset-y-3 after:inset-x-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const trigger = "inline-flex min-h-11 min-w-0 items-center gap-2 rounded-md px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Seletor de unidade da barra de cima: uma unidade é só rótulo; duas ou mais abrem a lista (RF-ORG-05). O servidor decide cada acesso.
export function UnitMenu({ status, units, allUnits, selected, onSelect, onRetry, variant = "desktop" }: UnitMenuProps) {
  const { t } = useTranslation();
  const { open, setOpen, root, button } = usePopover();
  const [sheet, setSheet] = useState(false);
  if (status === "loading") return <span role="status" className="sr-only">{t("unitScope.loading")}</span>;
  if (status === "error") {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <span role="alert" className="min-w-0 truncate text-sm">{t("unitScope.error")}</span>
        <Button variant="secondary" size="sm" className="shrink-0" onClick={onRetry}>{t("states.retry")}</Button>
      </span>
    );
  }
  if (status === "forbidden" || units.length === 0) return null;
  const options = [...(allUnits ? [{ id: ALL_UNITS, name: t("unitScope.all") }] : []), ...units];
  const current = options.find((o) => o.id === selected) ?? options[0];
  const small = variant === "compact";
  const body = (
    <>
      <Building2 aria-hidden="true" className={cn("shrink-0", small ? "size-3" : "size-4")} />
      <span className={cn("min-w-0 truncate", !small && "font-medium")}>{current.name}</span>
    </>
  );
  if (options.length < 2) return <span className={cn(small ? compactTrigger : trigger, "text-muted-foreground")} aria-label={`${t("unitScope.label")}: ${current.name}`} role="group">{body}</span>;
  const note = (id: string) => (id === ALL_UNITS ? t(variant === "desktop" ? "unitScope.readOnly" : "unitScope.readOnlyCoordinator") : undefined);

  if (variant !== "desktop") {
    return (
      <Dialog.Root open={sheet} onOpenChange={setSheet}>
        <Dialog.Trigger className={small ? compactTrigger : trigger} aria-label={`${t("unitScope.label")}: ${current.name}`}>
          {body}
          <ChevronDown aria-hidden="true" className={cn("shrink-0", small ? "size-3" : "size-4")} />
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col gap-3 overflow-y-auto rounded-t-window bg-background p-4 shadow-window data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom"
          >
            <Dialog.Title className="text-lg font-semibold">{t("unitScope.sheetTitle")}</Dialog.Title>
            <div role="radiogroup" aria-label={t("unitScope.sheetTitle")} className="flex flex-col gap-2">
              {options.map((o) => (
                <RadioCard
                  key={o.id}
                  name="unit-sheet"
                  label={o.name}
                  description={note(o.id)}
                  checked={o.id === current.id}
                  onChange={() => {
                    onSelect(o.id);
                    setSheet(false);
                  }}
                />
              ))}
            </div>
            <Dialog.Close asChild>
              <Button variant="secondary">{t("unitScope.close")}</Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <div ref={root} className="relative min-w-0">
      <button ref={button} type="button" aria-expanded={open} aria-label={`${t("unitScope.label")}: ${current.name}`} onClick={() => setOpen((o) => !o)} className={trigger}>
        {body}
        <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
      </button>
      {open && (
        <ul aria-label={t("unitScope.label")} className="absolute left-0 top-full z-40 mt-1 w-64 rounded-card border bg-popover p-1 text-popover-foreground shadow-menu">
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(o.id);
                  setOpen(false);
                  button.current?.focus();
                }}
                className="flex min-h-11 w-full flex-col items-start justify-center rounded-md px-3 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=true]:font-semibold"
                aria-current={o.id === current.id ? "true" : undefined}
              >
                {o.name}
                {note(o.id) && <span className="text-xs text-muted-foreground">{note(o.id)}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
