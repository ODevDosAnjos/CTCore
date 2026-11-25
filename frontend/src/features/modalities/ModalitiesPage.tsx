import { useState, type ReactNode } from "react";
import { CircleHelp, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/ui/page-header";
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
} from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModalityDot } from "@/components/ui/modality-dot";
import { ApiError } from "@/lib/api";
import { DeactivateModalityDialog, type Blocker } from "./DeactivateModalityDialog";
import { GraduationDialog } from "./GraduationDialog";
import { RequestModalityDialog } from "./RequestModalityDialog";
import { useModalities, type Modality } from "./useModalities";

const HEAD = "px-4 py-3 font-medium text-muted-foreground";
const CELL = "px-4 py-3 align-middle";
const list = (items: string[]) =>
  new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" }).format(items);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="font-heading text-[22px] font-semibold uppercase leading-none">{title}</h2>
      {children}
    </section>
  );
}

// "Graduação ligada · 19 níveis · Tijuca e Barra" (partes que não existem saem).
function useMeta() {
  const { t } = useTranslation();
  return (m: Modality) =>
    [
      m.graduationEnabled ? t("modalities.graduationOn") : t("modalities.graduationOff"),
      m.levelCount > 0 ? t("modalities.levels", { count: m.levelCount }) : null,
      m.offeredUnits.length > 0 ? list(m.offeredUnits) : null,
    ]
      .filter(Boolean)
      .join(" · ");
}

function Own({
  items,
  onGraduation,
  onDeactivate,
}: {
  items: Modality[];
  onGraduation: (m: Modality) => void;
  onDeactivate: (m: Modality) => void;
}) {
  const { t } = useTranslation();
  const meta = useMeta();
  if (items.length === 0) return <p className="text-muted-foreground">{t("modalities.mineEmpty")}</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((m) => (
        <li key={m.id}>
          <Card className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{m.name}</p>
              <p className="text-xs text-muted-foreground">{meta(m)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => onGraduation(m)}>
                {t("modalities.graduation.button")}
                <span className="sr-only"> {m.name}</span>
              </Button>
              <Button variant="danger" size="sm" onClick={() => onDeactivate(m)}>
                {t("modalities.deactivate")}
                <span className="sr-only"> {m.name}</span>
              </Button>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function Available({ items, onActivate }: { items: Modality[]; onActivate: (m: Modality) => void }) {
  const { t } = useTranslation();
  if (items.length === 0) return <p className="text-muted-foreground">{t("modalities.availableEmpty")}</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((m) => (
        <li key={m.id}>
          <Card className="flex items-center justify-between gap-2 px-4 py-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{m.name}</p>
              <p className="text-xs text-muted-foreground">{t("modalities.catalog")}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onActivate(m)}>
              <Plus aria-hidden />
              {t("modalities.activate")}
              <span className="sr-only"> {m.name}</span>
            </Button>
          </Card>
        </li>
      ))}
    </ul>
  );
}

// RF-MOD-01 (RN-MOD-02): o Administrador só consulta, numa tabela sem botões.
function ReadOnlyTable({ items, onGraduation }: { items: Modality[]; onGraduation: (m: Modality) => void }) {
  const { t } = useTranslation();
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative overflow-x-auto">
        <table aria-label={t("modalities.tableLabel")} className="w-full text-left text-sm">
          <thead className="border-b border-divider bg-surface-soft">
            <tr>
              <th scope="col" className={HEAD}>{t("modalities.table.modality")}</th>
              <th scope="col" className={HEAD}>{t("modalities.table.graduation")}</th>
              <th scope="col" className={HEAD}>{t("modalities.table.units")}</th>
              <th scope="col" className={HEAD}>{t("modalities.table.status")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-b border-divider last:border-b-0">
                <td className={`${CELL} font-medium`}>
                  {m.active ? (
                    <button type="button" className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onGraduation(m)}>
                      <ModalityDot name={m.name} />
                    </button>
                  ) : (
                    <ModalityDot name={m.name} />
                  )}
                </td>
                <td className={CELL}>
                  {m.active
                    ? [m.graduationEnabled ? t("modalities.table.on") : t("modalities.table.off"), m.graduationEnabled && m.levelCount > 0 ? t("modalities.levels", { count: m.levelCount }) : null].filter(Boolean).join(" · ")
                    : t("modalities.table.none")}
                </td>
                <td className={CELL}>{m.offeredUnits.length > 0 ? list(m.offeredUnits) : t("modalities.table.none")}</td>
                <td className={CELL}>
                  <StatusBadge status={m.active ? "ACTIVE" : "INACTIVE"} label={m.active ? t("modalities.table.active") : t("modalities.table.available")} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Content() {
  const { t } = useTranslation();
  const api = useModalities();
  const [asking, setAsking] = useState(false);
  const [grading, setGrading] = useState<Modality | null>(null);
  const [blocker, setBlocker] = useState<Blocker | null>(null);
  const [message, setMessage] = useState<{
    kind: "status" | "alert";
    text: string;
  }>();
  if (api.status === "loading") return <LoadingState />;
  if (api.status === "forbidden") return <ForbiddenState />;
  if (!api.items) return <ErrorState onRetry={api.retry} />;
  const items = api.items;

  async function toggle(m: Modality) {
    setMessage(undefined);
    try {
      await api.setActive(m.id, !m.active);
      setMessage({
        kind: "status",
        text: t(m.active ? "modalities.deactivated" : "modalities.activated", { name: m.name }),
      });
    } catch (e) {
      if (e instanceof ApiError && e.code === "MODALITY_IN_USE") {
        const count = (name: string) => Number(e.fields.find((f) => f.field === name)?.message ?? "0");
        setBlocker({
          name: m.name,
          classes: e.fields.filter((f) => f.field === "class").map((f) => f.message),
          students: count("activeStudents"),
        });
        return;
      }
      setMessage({ kind: "alert", text: t("modalities.changeError", { name: m.name }) });
    }
  }

  const canManage = items.some((m) => m.canManage);
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t("modalities.title")}
        actions={
          canManage && (
            <Button variant="ghost" onClick={() => setAsking(true)}>
              <CircleHelp aria-hidden />
              {t("modalities.notFound")}
            </Button>
          )
        }
      />
      {message && <Banner tone={message.kind === "alert" ? "danger" : "ok"}>{message.text}</Banner>}
      {items.length === 0 ? (
        <EmptyState
          title={t("modalities.emptyTitle")}
          text={t("modalities.emptyText")}
        />
      ) : canManage ? (
        <>
          <Section title={t("modalities.mine")}>
            <Own
              items={items.filter((m) => m.active)}
              onGraduation={(m) => {
                setMessage(undefined);
                setGrading(m);
              }}
              onDeactivate={toggle}
            />
          </Section>
          <Section title={t("modalities.available")}>
            <Available items={items.filter((m) => !m.active)} onActivate={toggle} />
          </Section>
        </>
      ) : (
        <>
          <Banner tone="info">{t("modalities.readOnlyBanner")}</Banner>
          <ReadOnlyTable
            items={items}
            onGraduation={(m) => {
              setMessage(undefined);
              setGrading(m);
            }}
          />
        </>
      )}
      <GraduationDialog
        modality={grading}
        onClose={() => setGrading(null)}
        onSaved={(id, saved) => {
          api.setGraduationEnabled(id, saved.enabled, saved.levels.length);
          setGrading(null);
          setMessage({
            kind: "status",
            text: t("modalities.graduation.saved"),
          });
        }}
      />
      <DeactivateModalityDialog blocker={blocker} onClose={() => setBlocker(null)} />
      <RequestModalityDialog
        open={asking}
        onClose={() => setAsking(false)}
        onSend={async (name, note) => {
          await api.sendRequest(name, note);
          setMessage({ kind: "status", text: t("modalities.dialog.sent") });
        }}
      />
    </div>
  );
}

// RF-MOD-01: Coordenador altera; Administrador só consulta (canManage). A barreira de dados é o servidor.
export function ModalitiesPage() {
  return <Content />;
}
