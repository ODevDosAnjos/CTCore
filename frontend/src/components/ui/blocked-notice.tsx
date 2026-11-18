import type { ReactNode } from "react";
import { Ban, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Aviso de "não dá" do canvas (desativar e desmarcar): título com ícone de proibido, uma linha por impedimento e, dentro, a orientação opcional. */
export function BlockedNotice({ title, lines, children, className }: { title: string; lines: string[]; children?: ReactNode; className?: string }) {
  return (
    <div role="alert" data-tone="danger" className={cn("flex flex-col gap-2 rounded-lg border border-danger-foreground/20 bg-danger p-4 text-sm text-danger-foreground", className)}>
      <span className="flex items-center gap-2 font-semibold">
        <Ban aria-hidden className="size-[18px] shrink-0" />
        {title}
      </span>
      {lines.map((line) => (
        <span key={line} className="flex items-center gap-2 text-foreground">
          <ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
          {line}
        </span>
      ))}
      {children}
    </div>
  );
}
