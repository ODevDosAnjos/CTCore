import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus } from "lucide-react";
import { LastChange } from "@/components/LastChange";
import { DataTable, type Column } from "@/components/query/DataTable";
import { RowCard } from "@/components/query/RowCard";
import { useBelowSm } from "@/components/query/useBelowSm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { AgeRangeDialog } from "./AgeRangeDialog";
import { useAgeRanges, type AgeRange } from "./useAgeRanges";
import { PageHeader } from "@/components/ui/page-header";

// Aberta com `target`: undefined = fechada, null = nova faixa, faixa = edição. `n` renova a janela a cada abertura.
type Editing = { n: number; target: AgeRange | null };

function Content() {
  const { t } = useTranslation();
  const api = useAgeRanges();
  const narrow = useBelowSm();
  const [editing, setEditing] = useState<Editing>();
  const [removing, setRemoving] = useState<AgeRange>();
  const [message, setMessage] = useState<{ kind: "status" | "alert"; text: string }>();
  if (api.status === "loading") return <LoadingState />;
  if (api.status === "forbidden") return <ForbiddenState />;
  if (!api.items) return <ErrorState onRetry={api.retry} />;

  const open = (target: AgeRange | null) => {
    setMessage(undefined);
    setEditing({ n: Date.now(), target });
  };
  const ages = (r: AgeRange) =>
    r.maxAge === null ? t("ageRanges.openEnded", { count: r.minAge }) : t("ageRanges.range", { min: r.minAge, max: r.maxAge });

  const usedIn = (r: AgeRange) => {
    const { count, names } = r.usedIn;
    if (count === 0) return t("ageRanges.usedIn.none");
    if (count === 1) return names[0];
    return count === 2 ? t("ageRanges.usedIn.two", { first: names[0], second: names[1] }) : t("ageRanges.usedIn.many", { count });
  };
  const create = api.canManage && (
    <Button size="sm" onClick={() => open(null)}>
      <Plus aria-hidden="true" />
      {t("ageRanges.create")}
    </Button>
  );
  const pencil = (r: AgeRange) =>
    api.canManage ? (
      <Button type="button" variant="outline" size="icon" className="min-h-11 min-w-11" aria-label={t("ageRanges.editFor", { name: r.name })} title={t("ageRanges.edit")} onClick={() => open(r)}>
        <Pencil aria-hidden="true" />
      </Button>
    ) : null;
  const columns: Column<AgeRange>[] = [
    { key: "name", label: t("ageRanges.columns.name"), render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "minAge", label: t("ageRanges.columns.minAge"), numeric: true, render: (r) => r.minAge },
    { key: "maxAge", label: t("ageRanges.columns.maxAge"), numeric: true, render: (r) => r.maxAge ?? t("ageRanges.noMax") },
    { key: "usedIn", label: t("ageRanges.columns.usedIn"), render: (r) => <span className="break-words">{usedIn(r)}</span> },
    ...(api.canManage ? [{ key: "actions", label: t("ageRanges.columns.actions"), hideLabel: true, render: pencil }] : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("ageRanges.title")} actions={api.items.length > 0 ? create : undefined} />
      {message && <Banner tone={message.kind === "alert" ? "danger" : "ok"}>{message.text}</Banner>}
      {api.items.length === 0 ? (
        <EmptyState title={t("ageRanges.emptyTitle")} text={t("ageRanges.emptyText")} action={create || undefined} />
      ) : narrow ? (
        <ul className="flex flex-col divide-y rounded-card border bg-card px-4">
          {api.items.map((r) => (
            <li key={r.id} className="py-3">
              <RowCard
                title={r.name}
                meta={
                  <>
                    <span>{ages(r)}</span>
                    <span>{usedIn(r)}</span>
                  </>
                }
                action={pencil(r)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-hidden rounded-card border bg-card [&_th]:normal-case">
          <DataTable columns={columns} rows={api.items} rowKey={(r) => r.id} order="" onOrder={() => undefined} />
        </div>
      )}
      <Banner tone="info">{t("ageRanges.competitionNote")}</Banner>
      <LastChange value={api.lastChange} />
      {editing && (
        <AgeRangeDialog
          key={editing.n}
          range={editing.target}
          open
          onDelete={
            editing.target
              ? () => {
                  setRemoving(editing.target ?? undefined);
                  setEditing(undefined);
                }
              : undefined
          }
          onClose={() => setEditing(undefined)}
          onSave={async (input) => {
            await (editing.target ? api.update(editing.target.id, input) : api.create(input));
            setMessage({ kind: "status", text: t("ageRanges.saved") });
          }}
        />
      )}
      <ConfirmDialog
        open={removing !== undefined}
        onOpenChange={(o) => !o && setRemoving(undefined)}
        title={t("ageRanges.confirm.title")}
        summary={t("ageRanges.confirm.summary", { name: removing?.name })}
        confirmLabel={t("ageRanges.delete")}
        onConfirm={async () => {
          if (!removing) return;
          try {
            await api.remove(removing.id);
            setMessage({ kind: "status", text: t("ageRanges.deleted", { name: removing.name }) });
          } catch {
            setMessage({ kind: "alert", text: t("ageRanges.deleteError", { name: removing.name }) });
          }
        }}
      />
    </div>
  );
}

// RF-MOD-04: Coordenador altera; Administrador só consulta (canManage). A barreira de dados é o servidor.
export function AgeRangesPage() {
  return <Content />;
}
