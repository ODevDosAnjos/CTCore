import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/** Indicador de passos das janelas em assistente: quem usa controla o passo atual (1 a N). */
export function WindowSteps({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={className}>
      <p className="sr-only">{t("ui.stepOf", { current, total: steps.length })}</p>
      <ol aria-label={t("ui.stepsLabel")} className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {steps.map((label, i) => {
          const n = i + 1;
          return (
            <li key={label} aria-current={n === current ? "step" : undefined} className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
                  n === current ? "border-primary bg-primary text-primary-foreground" : n < current ? "border-ok-foreground bg-ok text-ok-foreground" : "border-input bg-card text-muted-foreground",
                )}
              >
                {n < current ? <Check aria-hidden className="size-4" /> : <span aria-hidden>{n}</span>}
              </span>
              <span className={n === current ? "font-semibold" : "text-muted-foreground"}>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
