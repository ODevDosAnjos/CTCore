import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { SearchBox } from "@/components/ui/search-box";
import { DataTable, TableSkeleton, type Column } from "./DataTable";
import { CanvasPagination, DEFAULT_PAGE_SIZE, PAGE_SIZES, Pagination } from "./Pagination";
import { useQueryParams } from "./useQueryParams";
import { useBelowSm } from "./useBelowSm";

export type Query = { q: string; pagina: number; ordem: string; filtros: Record<string, string>; tamanho: number };
// `counts` são totais auxiliares da tela (ex.: filtros rápidos), vindos do mesmo pedido.
export type Page<T> = { rows: T[]; total: number; counts?: Record<string, number> };

// Consulta: busca, filtros, ordenação, página e tamanho vivem no endereço (RNF-27). Nunca pede mais que uma página.
// A tela mapeia Query para o contrato da rota (`tamanho` vira `size`, sempre 25, 50 ou 100); erro com status 403 vira "sem permissão".
// `fetchPage` deve ter identidade estável (definida fora do componente ou em useCallback).
export function QueryPage<T>({
  columns,
  fetchPage,
  rowKey,
  filterKeys = [],
  filters,
  emptyAction,
  texts,
  cards,
  cardsBelow = "md",
  footer,
  search = true,
  searchPlaceholder,
  canvasPagination,
  canvasStates,
  header,
  defaultFilters = {},
  onRowClick,
  rowClassName,
}: {
  columns: Column<T>[];
  fetchPage: (q: Query) => Promise<Page<T>>;
  rowKey: (row: T) => string;
  filterKeys?: string[];
  filters?: (p: { get: (k: string) => string; set: (k: string, v: string) => void; counts?: Record<string, number>; total?: number; clear: () => void }) => ReactNode;
  emptyAction?: ReactNode;
  // Textos próprios dos dois vazios (sem item / sem item com estes filtros); sem eles valem os padrões.
  texts?: { emptyTitle?: string; emptyText?: string; noResultTitle?: string; noResultText?: string };
  // Opcionais: abaixo de md a lista sai em cartões no lugar da tabela; `footer` recebe a página carregada (ex.: totais).
  cards?: (row: T) => ReactNode;
  footer?: (page: Page<T>) => ReactNode;
  /** Onde a lista vira cartões: "md" (768 px, por CSS, padrão) ou "sm" (640 px; só uma das duas existe no DOM). */
  cardsBelow?: "sm" | "md";
  /** Falso: sem caixa de busca (a rota não tem `q`). */
  search?: boolean;
  /** Com texto de ajuda, a busca usa `SearchBox` (canvas) e a barra alinha ao centro; sem ele, a caixa de sempre. */
  searchPlaceholder?: string;
  /** Paginação do canvas ("1–25 de 131"); sem ela vale a de sempre, até cada tela migrar. */
  canvasPagination?: boolean;
  /** Os quatro estados no visual do canvas (cartão); sem isso valem os de sempre, até cada tela migrar. */
  canvasStates?: boolean;
  /** Cabeçalho da tela acima da busca; recebe os totais da lista (ex.: subtítulo com a contagem). */
  header?: (p: { counts?: Record<string, number>; total?: number }) => ReactNode;
  /** Valor de filtro quando o endereço não traz o parâmetro (ex.: `{ status: "ACTIVE" }`). A tela grava um valor próprio (ex.: "ALL") para o "Todos" não reaplicar o padrão. */
  defaultFilters?: Record<string, string>;
  /** Linha da tabela clicável (o link do nome continua sendo o alvo do teclado). */
  onRowClick?: (row: T) => void;
  /** Classe extra da linha da tabela (ex.: esmaecer o que está desativado). */
  rowClassName?: (row: T) => string | undefined;
}) {
  const { t } = useTranslation();
  const { get, set, clear } = useQueryParams();
  const narrow = useBelowSm();
  const cardsOnly = cardsBelow === "sm" && !!cards;

  const q = get("q");
  const rawPage = Number(get("pagina"));
  const pagina = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const rawOrder = get("ordem");
  const ordem = columns.some((c) => c.sortable && c.key === rawOrder.replace(/^-/, "")) ? rawOrder : "";
  const rawSize = Number(get("tamanho"));
  const tamanho = (PAGE_SIZES as readonly number[]).includes(rawSize) ? rawSize : DEFAULT_PAGE_SIZE;
  const getF = (k: string) => get(k) || defaultFilters[k] || "";
  const filtros = Object.fromEntries(filterKeys.map((k) => [k, getF(k)]).filter(([, v]) => v));
  const filtrosKey = JSON.stringify(filtros);
  // O padrão da tela não conta como filtro: sem resultado nele, o vazio é o de "nada ainda".
  const hasFilter = Boolean(q) || Object.entries(filtros).some(([k, v]) => v !== defaultFilters[k]);

  // O resultado guarda a chave da consulta que o gerou; chave diferente da atual significa carregando.
  const [tick, setTick] = useState(0);
  const key = JSON.stringify([q, pagina, ordem, filtrosKey, tamanho, tick]);
  const [done, setDone] = useState<{ key: string; s: "error" | "forbidden" | "ok"; data?: Page<T> }>();
  const state = done?.key === key ? done : { s: "loading" as const, data: undefined };
  // Os totais auxiliares ficam à vista enquanto a página seguinte carrega.
  const [lastCounts, setLastCounts] = useState<Record<string, number>>();
  const [lastTotal, setLastTotal] = useState<number>();

  useEffect(() => {
    let alive = true;
    fetchPage({ q, pagina, ordem, filtros: JSON.parse(filtrosKey), tamanho }).then(
      (data) => {
        if (!alive) return;
        // Página fora do intervalo: volta para a primeira, sem erro (CA6).
        if (pagina > 1 && data.rows.length === 0) set({ pagina: "" }, true);
        else {
          setDone({ key, s: "ok", data });
          if (data.counts) setLastCounts(data.counts);
          setLastTotal(data.total);
        }
      },
      (e: { status?: number }) => {
        if (alive) setDone({ key, s: e?.status === 403 ? "forbidden" : "error" });
      },
    );
    return () => {
      alive = false;
    };
  }, [key, q, pagina, ordem, filtrosKey, tamanho, fetchPage, set]);

  const variant = canvasStates ? "card" : undefined;
  let body: ReactNode;
  if (state.s === "loading" && canvasStates)
    body =
      cardsOnly && narrow ? (
        <ul role="status" className="flex flex-col gap-3">
          <li className="sr-only">{t("states.loadingCard")}</li>
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} aria-hidden="true" className="flex items-center gap-3 rounded-md border p-3">
              <div className="size-9 shrink-0 animate-pulse rounded-full bg-neutral" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3 w-1/2 animate-pulse rounded-md bg-neutral" />
                <div className="h-3 w-3/4 animate-pulse rounded-md bg-neutral" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <TableSkeleton columns={columns} />
      );
  else if (state.s === "loading") body = <LoadingState variant={variant} />;
  else if (state.s === "error") body = <ErrorState variant={variant} onRetry={() => setTick((n) => n + 1)} />;
  else if (state.s === "forbidden") body = <ForbiddenState variant={variant} />;
  else if (state.data!.total === 0 && hasFilter)
    body = (
      <EmptyState
        variant={variant}
        title={texts?.noResultTitle ?? t("query.noResultTitle")}
        text={texts?.noResultText ?? t("query.noResultText")}
        action={
          <Button className="min-h-11" onClick={clear}>
            {t("query.clear")}
          </Button>
        }
      />
    );
  else if (state.data!.total === 0) body = <EmptyState variant={variant} title={texts?.emptyTitle} text={texts?.emptyText} action={emptyAction} />;
  else {
    const Pager = canvasPagination ? CanvasPagination : Pagination;
    const pages = Math.max(1, Math.ceil(state.data!.total / tamanho));
    body = (
      <>
        {!(cardsOnly && narrow) && (
          <div className={cards && !cardsOnly ? "hidden md:block" : undefined}>
            <DataTable columns={columns} rows={state.data!.rows} rowKey={rowKey} onRowClick={onRowClick} rowClassName={rowClassName} order={ordem} onOrder={(o) => set({ ordem: o })} />
          </div>
        )}
        {cards && (!cardsOnly || narrow) && (
          <ul className={cardsOnly ? "flex flex-col gap-3" : "flex flex-col gap-3 md:hidden"}>
            {state.data!.rows.map((r) => (
              <li key={rowKey(r)} className="rounded-md border p-3">
                {cards(r)}
              </li>
            ))}
          </ul>
        )}
        <Pager
          page={pagina}
          pages={pages}
          total={state.data!.total}
          size={tamanho}
          onPage={(p) => set({ pagina: String(p) })}
          // Trocar o tamanho volta para a página 1; o padrão não aparece no endereço.
          onSize={(s) => set({ tamanho: s === DEFAULT_PAGE_SIZE ? "" : String(s) })}
        />
        {footer?.(state.data!)}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {header?.({ counts: lastCounts, total: lastTotal })}
      <form role="search" className={searchPlaceholder ? "flex flex-wrap items-center gap-2" : "flex flex-wrap items-end gap-2"} onSubmit={(e) => e.preventDefault()}>
        {search && searchPlaceholder && <SearchBox className="w-full sm:w-80" aria-label={t("query.search")} placeholder={searchPlaceholder} value={q} onChange={(v) => set({ q: v })} />}
        {search && !searchPlaceholder && (
          <input
            type="search"
            aria-label={t("query.search")}
            className="min-h-11 min-w-0 flex-1 rounded-md border bg-background px-3"
            value={q}
            onChange={(e) => set({ q: e.target.value })}
          />
        )}
        {filters?.({ get: getF, set: (k, v) => set({ [k]: v }), counts: lastCounts, total: lastTotal, clear })}
      </form>
      {body}
    </div>
  );
}
