import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Props = { name: string; color: string; secondaryColor?: string | null; degree: number; label?: string; className?: string };

// Faixa do canvas (44x10): cor principal, ponta secundária e um risco branco por grau. As cores vêm dos dados (#RRGGBB).
export function GraduationBelt({ name, color, secondaryColor, degree, label, className }: Props) {
  const { t } = useTranslation();
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        role="img"
        aria-label={t("belt.label", { name, degree })}
        className="relative flex h-2.5 w-11 shrink-0 overflow-hidden rounded-sm border"
        style={{ backgroundColor: color }}
      >
        {Array.from({ length: degree }, (_, i) => (
          <span key={i} data-testid="belt-stripe" className="absolute inset-y-0 w-px" style={{ backgroundColor: "white", right: `${(secondaryColor ? 12 : 3) + i * 3}px` }} />
        ))}
        {secondaryColor && <span data-testid="belt-tip" className="absolute inset-y-0 right-0 w-2.5" style={{ backgroundColor: secondaryColor }} />}
      </span>
      {label}
    </span>
  );
}
