import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { BlockerChecklist } from "@/components/ui/blocker-checklist";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ReauthDialog } from "@/features/auth/ReauthDialog";
import { ApiError, api } from "@/lib/api";
import type { UnitSummary } from "./useUnits";

// Espelha UnitDeactivationCheck do OpenAPI.
interface Check {
  activeStudents: number;
  activeClasses: number;
  lastActiveUnit: boolean;
  canDeactivate: boolean;
}
type Phase = "form" | "reauth" | "sending" | "failed" | "forbidden";
type Loaded = { key: string; check?: Check; forbidden?: boolean };

// RF-ORG-07 / RNF-26: mostra o que impede, pede o nome da unidade digitado, depois a senha; só então chama a rota.
export function DeactivateUnitDialog({ unit, onClose, onDone }: { unit: UnitSummary | null; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [tick, setTick] = useState(0);
  const [loaded, setLoaded] = useState<Loaded>();
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string>();
  const unitId = unit?.id;
  const key = `${unitId}:${tick}`;

  useEffect(() => {
    if (!unitId) return;
    let alive = true;
    api<Check>(`/units/${unitId}/deactivation-check`).then(
      (check) => alive && setLoaded({ key, check }),
      (e) => alive && setLoaded({ key, forbidden: e instanceof ApiError && e.status === 403 }),
    );
    return () => {
      alive = false;
    };
  }, [unitId, key]);

  const current = loaded?.key === key ? loaded : undefined;
  const check = current?.check;
  const ready = !!unit && !!check?.canDeactivate && name.trim().toLowerCase() === unit.name.trim().toLowerCase();

  function close() {
    setName("");
    setError(undefined);
    setPhase("form");
    setTick((n) => n + 1);
    onClose();
  }

  async function send(token: string) {
    if (!unit) return;
    setPhase("sending");
    try {
      await api(`/units/${unit.id}/deactivation`, {
        method: "POST",
        body: { confirmation: name.trim() },
        headers: { "X-Reauth-Token": token },
      });
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      if (status === 400) {
        setError(t("units.deactivate.nameInvalid"));
        setPhase("form");
      } else if (status === 409) {
        setTick((n) => n + 1); // mostra o que impede agora
        setPhase("form");
      } else setPhase(status === 403 ? "forbidden" : "failed");
      return;
    }
    close();
    onDone();
  }

  return (
    <>
      <Modal
        open={unit !== null && phase !== "reauth"}
        onOpenChange={(o) => !o && phase !== "sending" && close()}
        size="sm"
        title={t("units.deactivate.title", { name: unit?.name ?? "" })}
        footer={
          check ? (
            <>
              <Button type="button" variant="outline" className="min-h-11" onClick={close} disabled={phase === "sending"}>
                {t("common.close")}
              </Button>
              <Button type="submit" form="deactivate-unit-form" className="min-h-11" disabled={!ready || phase === "sending"}>
                {t("units.deactivate.confirm")}
              </Button>
            </>
          ) : undefined
        }
      >
        {phase === "forbidden" || current?.forbidden ? (
          <ForbiddenState />
        ) : phase === "failed" ? (
          <ErrorState onRetry={() => setPhase("reauth")} />
        ) : !current ? (
          <LoadingState />
        ) : !check ? (
          <ErrorState onRetry={() => setTick((n) => n + 1)} />
        ) : (
          <form
            id="deactivate-unit-form"
            noValidate
            className="flex flex-col gap-3"
            aria-busy={phase === "sending"}
            onSubmit={(e) => {
              e.preventDefault();
              if (ready && phase === "form") setPhase("reauth");
            }}
          >
            <p className="text-sm">{t("units.deactivate.summary")}</p>
            <BlockerChecklist
              label={t("units.deactivate.blockedHead")}
              items={[
                check.activeStudents > 0
                  ? { text: t("units.deactivate.students", { count: check.activeStudents }), link: { to: `/alunos?unitId=${unit?.id}&status=ACTIVE`, label: t("units.deactivate.seeStudents") } }
                  : { text: t("units.deactivate.studentsFree"), ok: true },
                check.activeClasses > 0
                  ? { text: t("units.deactivate.classes", { count: check.activeClasses }), link: { to: `/turmas?unitId=${unit?.id}&status=ACTIVE`, label: t("units.deactivate.seeClasses") } }
                  : { text: t("units.deactivate.classesFree"), ok: true },
                check.lastActiveUnit ? { text: t("units.deactivate.lastUnit") } : { text: t("units.deactivate.lastUnitFree"), ok: true },
              ]}
            />
            <Field label={t("units.deactivate.typeLabel", { name: unit?.name ?? "" })} error={error} alertError>
              {(c) => (
                <Input
                  {...c}
                  autoComplete="off"
                  value={name}
                  disabled={!check.canDeactivate}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(undefined);
                  }}
                />
              )}
            </Field>
          </form>
        )}
      </Modal>
      <ReauthDialog open={unit !== null && phase === "reauth"} action="DEACTIVATE_UNIT" onClose={() => setPhase("form")} onConfirmed={(token) => void send(token)} />
    </>
  );
}
