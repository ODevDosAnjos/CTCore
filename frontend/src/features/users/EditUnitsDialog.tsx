import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { useUnitScope, type ReachableUnit } from "@/features/units/UnitScopeProvider";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { UnitChecks } from "./UnitChecks";
import { changeUnits, type StaffUser } from "./useUsers";

// R7 / D5: o cliente envia as unidades desejadas ao seu alcance; as demais do vínculo o servidor preserva.
export function EditUnitsDialog({ user, price, onClose, onDone }: { user: StaffUser | null; price: number; onClose: () => void; onDone: () => void }) {
  const { units } = useUnitScope();
  return user ? <Body key={user.linkId} user={user} price={price} choices={units} onClose={onClose} onDone={onDone} /> : null;
}

function Body({ user, price, choices, onClose, onDone }: { user: StaffUser; price: number; choices: ReachableUnit[]; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [unitIds, setUnitIds] = useState(() => user.units.map((u) => u.id).filter((id) => choices.some((c) => c.id === id)));
  const [error, setError] = useState<string>();
  const [last, setLast] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  // D6: só vínculo ativo ocupa vaga; convite pendente não mostra aumento.
  const before = user.units.map((u) => u.id);
  const added = user.status === "ACTIVE" ? unitIds.filter((id) => !before.includes(id)).length : 0;
  const removed = before.some((id) => choices.some((c) => c.id === id) && !unitIds.includes(id));

  async function submit() {
    setLast([]);
    if (unitIds.length === 0) return setError(t("administrators.invite.unitsRequired"));
    setError(undefined);
    setBusy(true);
    try {
      await changeUnits(user.linkId, unitIds);
    } catch (e) {
      if (e instanceof ApiError && e.code === "LAST_UNIT_ADMINISTRATOR") {
        setLast((e.fields[0]?.message ?? "").split(",").map((id) => choices.find((c) => c.id === id)?.name ?? id));
      } else setError(t("administrators.editUnits.error"));
      setBusy(false);
      return;
    }
    setBusy(false);
    onClose();
    onDone();
  }

  return (
    <Modal open onOpenChange={(o) => !o && !busy && onClose()} title={t("administrators.editUnits.title", { name: user.name })}>
      <form
        noValidate
        className="flex flex-col gap-3"
        aria-busy={busy}
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void submit();
        }}
      >
        <UnitChecks units={choices} value={unitIds} onChange={setUnitIds} error={error} />
        {user.status === "ACTIVE" && (
          <div className="flex flex-col gap-1">
            {added > 0 && <p className="text-[13px] font-medium">{t("administrators.cost.riseUnits", { total: formatCurrency(price * added) })}</p>}
            {removed && <p className="text-[13px] text-muted-foreground">{t("administrators.cost.noRefund")}</p>}
          </div>
        )}
        {last.length > 0 && (
          <Banner tone="warn">
            <p className="font-medium">{t("administrators.lastAdmin.explain")}</p>
            <ul className="list-disc pl-5">
              {last.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </Banner>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" className="min-h-11" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" className="min-h-11" disabled={busy}>
            {t("administrators.editUnits.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
