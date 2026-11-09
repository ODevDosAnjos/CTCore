import type { ReactNode } from "react";

/**
 * Cartão de uma linha da lista no celular (substitui a tabela abaixo de 640 px): `lead` (ex.: avatar), `title`,
 * `meta` (linhas de apoio), `badge` (situação) e `action` (ação principal, sempre no fim, com 44 px de toque).
 * Só o conteúdo: a `QueryPage` já embrulha em `<li>`.
 */
export function RowCard({ lead, title, meta, badge, action }: { lead?: ReactNode; title: ReactNode; meta?: ReactNode; badge?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {lead}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="break-words font-medium">{title}</span>
        {meta && <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">{meta}</div>}
        {badge && <span className="mt-1 self-start">{badge}</span>}
      </div>
      {action && <div className="flex min-h-11 shrink-0 items-center">{action}</div>}
    </div>
  );
}
