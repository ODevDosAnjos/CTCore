import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

export type BlockerItem = { text: string; ok?: boolean; link?: { to: string; label: string } };

/** "O que impede agora": uma linha por item, livre (✓ verde) ou impedindo (✗ vermelho), com link opcional para resolver. */
export function BlockerChecklist({ items, label, className }: { items: BlockerItem[]; label: string; className?: string }) {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <div className={cn("flex flex-col gap-2 rounded-md bg-surface-soft p-3 text-sm", className)}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.text} className="flex items-start gap-2">
            {item.ok ? <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-ok-foreground" /> : <X aria-hidden className="mt-0.5 size-4 shrink-0 text-danger-foreground" />}
            <span className="sr-only">{item.ok ? t("ui.blockerFree") : t("ui.blockerBlocks")}: </span>
            <span className="flex-1">{item.text}</span>
            {item.link && (
              <Link to={item.link.to} className="shrink-0 font-medium text-primary underline underline-offset-2">
                {item.link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
