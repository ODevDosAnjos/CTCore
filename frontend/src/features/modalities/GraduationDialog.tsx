import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import {
  useGraduation,
  type Graduation,
  type GraduationUpdate,
} from "./useGraduation";
import { Input } from "@/components/ui/field";
import { Banner } from "@/components/ui/banner";
import { Checkbox } from "@/components/ui/checkbox";
import { ComingSoon } from "@/components/ui/coming-soon";
import { SwitchRow } from "@/features/units/SwitchRow";

// Cor inicial de um nível novo: o token neutro do tema; o valor final é a cor que a pessoa escolhe.
const neutralColor = () => getComputedStyle(document.documentElement).getPropertyValue("--subtle").trim();

const MAX_LEVELS = 30;
const MAX_NAME = 40;
const LEVELS_ERROR = "graduation-levels-error";
const LEVELS = "levels";
const input = "min-h-11";
const HEAD = "whitespace-nowrap px-2 py-2 text-xs font-semibold text-muted-foreground";
// RN-GRA-01: só o Jiu-Jitsu tem padrão de catálogo (D9).
const DEFAULT_MODALITY = "Jiu-Jitsu";

// Linha da tela: números ficam em texto até salvar.
type Row = {
  key: string;
  id?: string;
  name: string;
  color: string;
  secondaryColor: string;
  maxDegree: string;
  minAge: string;
  maxAge: string;
  kids: boolean;
};

const toRows = (g: Graduation): Row[] =>
  g.levels.map((l) => ({
    key: l.id,
    id: l.id,
    name: l.name,
    color: l.color,
    secondaryColor: l.secondaryColor ?? "",
    maxDegree: String(l.maxDegree),
    minAge: l.minAge === null ? "" : String(l.minAge),
    maxAge: l.maxAge === null ? "" : String(l.maxAge),
    kids: l.kids,
  }));

const num = (s: string) => (s.trim() === "" ? null : Number(s));

function ReadOnly({ data }: { data: Graduation }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3">
      <p>
        {data.enabled
          ? t("modalities.graduation.statusOn")
          : t("modalities.graduation.statusOff")}
      </p>
      <p>
        {data.requireOriginProof
          ? t("modalities.graduation.proofOn")
          : t("modalities.graduation.proofOff")}
      </p>
      <ol className="flex flex-col divide-y">
        {data.levels.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center gap-2 py-2">
            <span
              aria-hidden="true"
              className="inline-block size-5 rounded border"
              style={{ backgroundColor: l.color }}
            />
            <span className="min-w-0 break-words font-medium">{l.name}</span>
            <span className="text-sm text-muted-foreground">
              {t("modalities.graduation.summary", {
                degrees: l.maxDegree,
                kind: l.kids
                  ? t("modalities.graduation.kidsShort")
                  : t("modalities.graduation.adultShort"),
              })}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Editor({
  modalityName,
  data,
  save,
  onSaved,
  onClose,
}: {
  modalityName: string;
  data: Graduation;
  save: (body: GraduationUpdate) => Promise<Graduation>;
  onSaved: (g: Graduation) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(data.enabled);
  const [proof, setProof] = useState(data.requireOriginProof);
  const [rows, setRows] = useState<Row[]>(() => toRows(data));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);

  const patch = (i: number, change: Partial<Row>) => {
    setErrors({});
    setRows((all) => all.map((r, j) => (j === i ? { ...r, ...change } : r)));
  };
  // Mesmo caminho do arrastar (mouse) e dos botões de subir e descer (teclado e leitor de tela).
  const reorder = (from: number, to: number) => {
    setErrors({});
    setRows((all) => {
      if (to < 0 || to >= all.length || from === to) return all;
      const next = [...all];
      next.splice(to, 0, ...next.splice(from, 1));
      return next;
    });
  };

  async function submit() {
    if (busy) return;
    const found: Record<string, string> = {};
    rows.forEach((r, i) => {
      const name = r.name.trim();
      if (name.length < 1 || name.length > MAX_NAME)
        found[`levels[${i}].name`] = t("modalities.graduation.nameInvalid");
    });
    if (enabled && rows.length === 0)
      found[LEVELS] = t("modalities.graduation.needLevel");
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    try {
      const saved = await save({
        enabled,
        requireOriginProof: proof,
        levels: rows.map((r) => ({
          ...(r.id ? { id: r.id } : {}),
          name: r.name.trim(),
          color: r.color,
          secondaryColor: r.secondaryColor || null,
          maxDegree: Number(r.maxDegree),
          minAge: num(r.minAge),
          maxAge: num(r.maxAge),
          kids: r.kids,
        })),
      });
      onSaved(saved);
    } catch (e) {
      const fields = e instanceof ApiError ? e.fields : [];
      const shown = /\.(name|maxDegree|minAge|maxAge)$|^levels$/;
      setErrors({
        ...Object.fromEntries(fields.map((f) => [f.field, f.message])),
        ...(fields.length === 0 || fields.some((f) => !shown.test(f.field))
          ? { form: t("modalities.graduation.saveError") }
          : {}),
      });
    } finally {
      setBusy(false);
    }
  }

  const err = (field: string, id: string) =>
    errors[field] ? (
      <p id={id} role="alert" className="mt-1 text-sm text-danger-foreground">
        {errors[field]}
      </p>
    ) : null;

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <SwitchRow
        label={t("modalities.graduation.enabled")}
        description={t("modalities.graduation.enabledHelp")}
        checked={enabled}
        onChange={(v) => {
          setErrors({});
          setEnabled(v);
        }}
      />
      {modalityName === DEFAULT_MODALITY && (
        <p className="text-sm text-muted-foreground">
          {t("modalities.graduation.defaultNote")}
        </p>
      )}
      {err(LEVELS, LEVELS_ERROR)}
      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          {t("modalities.graduation.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table
            aria-label={t("modalities.graduation.tableLabel")}
            className="w-full text-left text-sm"
          >
            <thead className="border-b border-divider bg-surface-soft">
              <tr>
                <th scope="col" className="w-8 px-2 py-2">
                  <span className="sr-only">{t("modalities.graduation.order")}</span>
                </th>
                <th scope="col" className={HEAD}>{t("modalities.graduation.levelHeader")}</th>
                <th scope="col" className={HEAD}>{t("modalities.graduation.maxDegreeHeader")}</th>
                <th scope="col" className={HEAD}>{t("modalities.graduation.agesHeader")}</th>
                <th scope="col" className="px-2 py-2">
                  <span className="sr-only">{t("modalities.graduation.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const n = i + 1;
                const nameField = `levels[${i}].name`;
                return (
                  <tr
                    key={r.key}
                    data-testid="graduation-row"
                    onDragOver={(e) => dragging !== null && e.preventDefault()}
                    onDrop={() => {
                      if (dragging !== null) reorder(dragging, i);
                      setDragging(null);
                    }}
                    className="border-b border-divider align-top last:border-b-0"
                  >
                    <td className="px-2 py-3">
                      <span
                        draggable
                        data-testid="graduation-handle"
                        onDragStart={() => setDragging(i)}
                        onDragEnd={() => setDragging(null)}
                        className="inline-flex min-h-8 cursor-grab items-center text-subtle"
                      >
                        <GripVertical aria-hidden className="size-4" />
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <span aria-hidden className="h-2.5 w-11 shrink-0 rounded-sm border" style={{ backgroundColor: r.color }} />
                        <input
                          id={`level-color-${r.key}`}
                          type="color"
                          aria-label={t("modalities.graduation.color", { n })}
                          className="size-8 shrink-0 cursor-pointer rounded-md border border-input bg-card p-0.5"
                          value={r.color}
                          onChange={(e) => patch(i, { color: e.target.value })}
                        />
                        <Input
                          id={`level-name-${r.key}`}
                          aria-label={t("modalities.graduation.levelName", { n })}
                          className={`${input} min-w-36 flex-1`}
                          value={r.name}
                          autoComplete="off"
                          aria-invalid={errors[nameField] ? true : undefined}
                          aria-describedby={errors[nameField] ? `level-name-error-${r.key}` : undefined}
                          onChange={(e) => patch(i, { name: e.target.value })}
                        />
                      </div>
                      {err(nameField, `level-name-error-${r.key}`)}
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        id={`level-degree-${r.key}`}
                        aria-label={t("modalities.graduation.maxDegree", { n })}
                        type="number"
                        min={0}
                        max={10}
                        className={`${input} w-16`}
                        value={r.maxDegree}
                        onChange={(e) => patch(i, { maxDegree: e.target.value })}
                      />
                      {err(`levels[${i}].maxDegree`, `level-degree-error-${r.key}`)}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        <Input
                          id={`level-min-${r.key}`}
                          aria-label={t("modalities.graduation.minAge", { n })}
                          type="number"
                          min={0}
                          max={120}
                          className={`${input} w-16`}
                          value={r.minAge}
                          onChange={(e) => patch(i, { minAge: e.target.value })}
                        />
                        <span aria-hidden>–</span>
                        <Input
                          id={`level-max-${r.key}`}
                          aria-label={t("modalities.graduation.maxAge", { n })}
                          type="number"
                          min={0}
                          max={120}
                          className={`${input} w-16`}
                          value={r.maxAge}
                          onChange={(e) => patch(i, { maxAge: e.target.value })}
                        />
                      </div>
                      {err(`levels[${i}].minAge`, `level-min-error-${r.key}`)}
                      {err(`levels[${i}].maxAge`, `level-max-error-${r.key}`)}
                      <Checkbox
                        className="min-h-8 text-xs"
                        label={t("modalities.graduation.kidsShort")}
                        aria-label={t("modalities.graduation.kids", { n })}
                        checked={r.kids}
                        onChange={(e) => patch(i, { kids: e.target.checked })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" className="size-8" aria-label={t("modalities.graduation.up", { n })} disabled={i === 0} onClick={() => reorder(i, i - 1)}>
                          <ArrowUp aria-hidden />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="size-8" aria-label={t("modalities.graduation.down", { n })} disabled={i === rows.length - 1} onClick={() => reorder(i, i + 1)}>
                          <ArrowDown aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon" className="size-8"
                          aria-label={t("modalities.graduation.remove", { n })}
                          onClick={() => {
                            setErrors({});
                            setRows((all) => all.filter((_, j) => j !== i));
                          }}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        className="self-center"
        disabled={rows.length >= MAX_LEVELS}
        onClick={() =>
          setRows((all) => [
            ...all,
            {
              key: crypto.randomUUID(),
              name: "",
              color: neutralColor(),
              secondaryColor: "",
              maxDegree: "4",
              minAge: "",
              maxAge: "",
              kids: false,
            },
          ])
        }
      >
        <Plus aria-hidden />
        {t("modalities.graduation.add")}
      </Button>
      <SwitchRow
        label={t("modalities.graduation.requireProof")}
        description={t("modalities.graduation.requireProofHelp")}
        checked={proof}
        onChange={setProof}
      />
      {errors.form && <Banner tone="danger">{errors.form}</Banner>}
      <div className="sticky -bottom-6 -mx-6 -mb-6 mt-2 flex flex-wrap items-center justify-end gap-2 border-t border-divider bg-surface-soft px-6 py-4">
        <div className="mr-auto">
          <ComingSoon variant="button" label={t("modalities.graduation.backToDefault")} />
        </div>
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" className="min-h-11" disabled={busy}>
          {busy ? t("modalities.graduation.saving") : t("modalities.graduation.save")}
        </Button>
      </div>
    </form>
  );
}

// Carrega ao abrir: fechar desmonta, então reabrir sempre lê o estado atual do servidor.
function Body({
  modality,
  onClose,
  onSaved,
}: {
  modality: { id: string; name: string };
  onClose: () => void;
  onSaved: (modalityId: string, g: Graduation) => void;
}) {
  const g = useGraduation(modality.id);
  return (
    <>
      {g.status === "loading" && <LoadingState />}
      {g.status === "forbidden" && <ForbiddenState />}
      {g.status === "error" && <ErrorState onRetry={g.retry} />}
      {g.data &&
        (g.data.canManage ? (
          <Editor
            modalityName={modality.name}
            data={g.data}
            save={g.save}
            onClose={onClose}
            onSaved={(saved) => onSaved(modality.id, saved)}
          />
        ) : (
          <ReadOnly data={g.data} />
        ))}
    </>
  );
}

// RF-MOD-02: janela "Sistema de graduação". Coordenador edita (canManage); Administrador só consulta.
export function GraduationDialog({
  modality,
  onClose,
  onSaved,
}: {
  modality: { id: string; name: string } | null;
  onClose: () => void;
  onSaved: (modalityId: string, g: Graduation) => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      open={modality !== null}
      onOpenChange={(o) => !o && onClose()}
      title={t("modalities.graduation.dialogTitle", { name: modality?.name ?? "" })}
      size="lg"
      scrim="canvas"
      className="max-w-[720px]"
    >
      {modality && (
        <Body modality={modality} onClose={onClose} onSaved={onSaved} />
      )}
    </Modal>
  );
}
