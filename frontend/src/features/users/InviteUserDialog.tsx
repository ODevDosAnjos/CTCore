import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { useSession } from "@/features/auth/SessionProvider";
import { Text } from "@/features/units/Text";
import { useUnitScope } from "@/features/units/UnitScopeProvider";
import { ApiError } from "@/lib/api";
import { UnitChecks } from "./UnitChecks";
import { inviteUser } from "./useUsers";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const KNOWN = ["ALREADY_LINKED", "STAFF_LIMIT_REACHED", "FORBIDDEN"];
type Errors = { email?: string; name?: string; units?: string; form?: string };

// RF-ACE-06: convida; o perfil vem do servidor (Coordenador convida Administrador, Administrador convida Professor).
export function InviteUserDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const { units } = useUnitScope();
  const { state } = useSession();
  // D5: o perfil do convite é o que o servidor usa para quem convida (o corpo não leva perfil).
  const active = state.status === "ready" ? state.session.links.find((l) => l.id === state.session.activeLinkId)?.role : undefined;
  const invited = active === "ADMINISTRATOR" ? "TEACHER" : "ADMINISTRATOR";
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
    if (!EMAIL.test(email.trim())) found.email = t("users.invite.emailInvalid");
    if (!name.trim()) found.name = t("users.invite.nameRequired");
    if (unitIds.length === 0) found.units = t("users.invite.unitsRequired");
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await inviteUser({ email: email.trim(), name: name.trim(), unitIds });
    } catch (e) {
      const code = e instanceof ApiError && KNOWN.includes(e.code) ? e.code : "generic";
      setErrors({ form: t(`users.invite.errors.${code}`) });
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
      title={t("users.invite.title")}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={close} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={formId} disabled={busy}>
            <Send aria-hidden="true" />
            {t("users.invite.send")}
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
          <Text label={t("users.invite.name")} required value={name} onChange={setName} error={errors.name} autoComplete="off" />
          <Text label={t("users.invite.email")} required type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="off" />
        </div>
        <ChoiceCards
          legend={t("users.invite.role")}
          columns={2}
          value={invited}
          onChange={() => undefined}
          options={[
            { value: "ADMINISTRATOR", label: t("users.roles.ADMINISTRATOR"), description: t("users.invite.roleAdministrator"), disabled: invited !== "ADMINISTRATOR" },
            { value: "TEACHER", label: t("users.roles.TEACHER"), description: t("users.invite.roleTeacher"), disabled: invited !== "TEACHER" },
          ]}
        />
        <UnitChecks units={units} value={unitIds} onChange={setUnitIds} error={errors.units} />
        <p className="text-[13px] leading-normal text-muted-foreground">{t("users.invite.notice")}</p>
        {errors.form && <Banner tone="danger">{errors.form}</Banner>}
      </form>
    </Modal>
  );
}
