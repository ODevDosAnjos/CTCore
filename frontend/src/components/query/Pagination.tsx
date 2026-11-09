import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";

// Tamanhos de página do contrato (`size` em docs/openapi.yaml): 25, 50 ou 100; padrão 25.
export const PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;

export function Pagination({
  page,
  pages,
  total,
  size,
  onPage,
  onSize,
}: {
  page: number;
  pages: number;
  total: number;
  size: number;
  onPage: (p: number) => void;
  onSize: (s: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t("query.results")} className="flex flex-wrap items-center justify-between gap-2 py-2">
      <span>{t("query.total", { count: total })}</span>
      <label className="flex items-center gap-2">
        {t("query.pageSize")}
        <Select
          className="min-h-11 w-auto"
          value={size}
          onChange={(e) => onSize(Number(e.target.value))}
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          {t("query.prev")}
        </Button>
        <span aria-live="polite" className="tabular-nums">{t("query.page", { page, pages })}</span>
        <Button variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          {t("query.nextPage")}
        </Button>
      </div>
    </nav>
  );
}

const ICON_BUTTON = "relative inline-flex size-8 items-center justify-center rounded-md border border-input bg-card after:absolute after:left-1/2 after:top-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

/** Paginação do canvas: "1–25 de 131", "Por página [25]" e botões de ícone; mesmos props da `Pagination`. */
export function CanvasPagination({ page, pages, total, size, onPage, onSize }: { page: number; pages: number; total: number; size: number; onPage: (p: number) => void; onSize: (s: number) => void }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t("query.results")} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
      <span aria-live="polite" className="tabular-nums">
        {t("query.range", { from: (page - 1) * size + 1, to: Math.min(page * size, total), total })}
      </span>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-muted-foreground">
          {t("query.pageSizeShort")}
          <Select className="h-8 min-h-8 w-auto py-0 text-foreground" value={size} onChange={(e) => onSize(Number(e.target.value))}>
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </label>
        <button type="button" className={ICON_BUTTON} aria-label={t("query.prev")} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft aria-hidden="true" className="size-4" />
        </button>
        <button type="button" className={ICON_BUTTON} aria-label={t("query.nextPage")} disabled={page >= pages} onClick={() => onPage(page + 1)}>
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </nav>
  );
}
