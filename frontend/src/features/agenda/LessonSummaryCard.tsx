import { cn } from "@/lib/utils";

/** Cartão "Aula" das janelas da aula: rótulo pequeno e o resumo em uma linha. */
export function LessonSummaryCard({ label, text, className }: { label: string; text: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1 rounded-md bg-surface-soft p-3 text-sm", className)}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="break-words font-medium">{text}</span>
    </div>
  );
}
