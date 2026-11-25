import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Text } from "@/features/units/Text";
import { useUnitScope } from "@/features/units/UnitScopeProvider";
import { ApiError } from "@/lib/api";
import { SeatCost } from "./SeatCost";
import { UnitChecks } from "./UnitChecks";
import { inviteUser } from "./useUsers";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const KNOWN = ["ALREADY_LINKED", "STAFF_LIMIT_REACHED", "FORBIDDEN"];
type Errors = { email?: string; name?: string; units?: string; form?: string };

// RF-ACE-06: o Coordenador convida Administrador; a janela mostra o custo da vaga (RN-ASS-21) antes do envio.
export function InviteUserDialog({ open, price, onClose, onDone }: { open: boolean; price: number; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const { units } = useUnitScope();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [unitIds, setUnitIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  function close() {
    setEmail("");
    setName("");
    setUnitIds([]);
    setErrors({});
    onClose();
  }

  async function submit() {
    const found: Errors = {};
    if (!EMAIL.test(email.trim())) found.email = t("administrators.invite.emailInvalid");
    if (!name.trim()) found.name = t("administrators.invite.nameRequired");
    if (unitIds.length === 0) found.units = t("administrators.invite.unitsRequired");
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await inviteUser({ email: email.trim(), name: name.trim(), unitIds });
    } catch (e) {
      const code = e instanceof ApiError && KNOWN.includes(e.code) ? e.code : "generic";
      setErrors({ form: t(`administrators.invite.errors.${code}`) });
      setBusy(false);
      return;
    }
    setBusy(false);
    close();
    onDone();
  }

  const formId = "invite-user-form";
  return (
    <Modal
      open={open}
      size="md"
      scrim="canvas"
      onOpenChange={(o) => !o && !busy && close()}
      title={t("administrators.invite.title")}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={close} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={formId} disabled={busy}>
            <Send aria-hidden="true" />
            {t("administrators.invite.send")}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        className="flex flex-col gap-3.5"
        aria-busy={busy}
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void submit();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Text label={t("administrators.invite.name")} required value={name} onChange={setName} error={errors.name} autoComplete="off" />
          <Text label={t("administrators.invite.email")} required type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="off" />
        </div>
        <UnitChecks units={units} value={unitIds} onChange={setUnitIds} error={errors.units} />
        <SeatCost price={price} added={unitIds.length} />
        <p className="text-[13px] leading-normal text-muted-foreground">{t("administrators.invite.notice")}</p>
        {errors.form && <Banner tone="danger">{errors.form}</Banner>}
      </form>
    </Modal>
  );
}
