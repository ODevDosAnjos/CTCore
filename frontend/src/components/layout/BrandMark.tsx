import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

// Marca da gestão: logo (quadrado arredondado com a inicial da organização, cor de marca) e o nome em fonte de título.
export function BrandMark({ org, compact = false, className }: { org?: string; compact?: boolean; className?: string }) {
  const { t } = useTranslation();
  const name = org ?? t("app.name");
  return (
    <span className={cn("flex min-w-0 items-center gap-3", className)}>
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand font-heading font-semibold text-brand-foreground">
        {Array.from(name.trim())[0]?.toUpperCase()}
      </span>
      {!compact && <span className="truncate font-heading text-lg font-semibold uppercase tracking-wide">{name}</span>}
    </span>
  );
}
