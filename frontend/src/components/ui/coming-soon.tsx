import { useId } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { buttonVariants } from "./button";

export type ComingSoonVariant = "button" | "tab" | "switch" | "link" | "menuitem";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const MUTED = "cursor-not-allowed opacity-50";

/**
 * Regra R3: item de sprint futura aparece visível e desabilitado, com o selo "Em breve" e a dica.
 * Usa `aria-disabled` (e não `disabled`) para continuar alcançável por teclado; não tem `onClick` nem `href`.
 * O selo fica fora do nome acessível; a dica chega por `aria-describedby`.
 */
export function ComingSoon({ variant, label, className }: { variant: ComingSoonVariant; label: string; className?: string }) {
  const { t } = useTranslation();
  const hintId = useId();
  const common = { "aria-disabled": true as const, "aria-describedby": hintId };
  const pill = "inline-flex min-h-11 items-center rounded-md border px-3 text-sm";
  let item;
  switch (variant) {
    case "button":
      item = (
        <button type="button" {...common} className={cn(buttonVariants({ variant: "secondary" }), MUTED, className)}>
          {label}
        </button>
      );
      break;
    case "tab":
      item = (
        <button type="button" {...common} className={cn(pill, FOCUS, MUTED, className)}>
          {label}
        </button>
      );
      break;
    case "switch":
      item = (
        <span className={cn("inline-flex min-h-11 items-center gap-2", className)}>
          <button type="button" role="switch" aria-checked={false} aria-label={label} {...common} className={cn("inline-flex h-6 w-11 shrink-0 items-center rounded-full border bg-muted p-0.5", FOCUS, MUTED)}>
            <span className="size-4 rounded-full bg-card shadow" />
          </button>
          {label}
        </span>
      );
      break;
    case "link":
      item = (
        <span role="link" tabIndex={0} {...common} className={cn("inline-flex min-h-11 items-center text-sm underline", FOCUS, MUTED, className)}>
          {label}
        </span>
      );
      break;
    case "menuitem":
      item = (
        <span role="menuitem" tabIndex={0} {...common} className={cn("inline-flex min-h-11 items-center px-3 text-sm", FOCUS, MUTED, className)}>
          {label}
        </span>
      );
      break;
  }
  return (
    <span role={variant === "menuitem" ? "none" : undefined} className="group relative inline-flex items-center gap-2">
      {item}
      <Badge tone="neutral">{t("comingSoon.badge")}</Badge>
      <span
        role={variant === "menuitem" ? undefined : "tooltip"}
        id={hintId}
        className="pointer-events-none invisible absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-md border bg-card px-2 py-1 text-xs text-foreground shadow group-focus-within:visible group-hover:visible"
      >
        {t("comingSoon.hint")}
      </span>
    </span>
  );
}
