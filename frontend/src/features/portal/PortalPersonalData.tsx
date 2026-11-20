import { useRef, useState } from "react";
import { CreditCard, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { formatPhone, isValidPhone } from "@/components/fields/masks";
import { CARD_TITLE, Card } from "@/components/Card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogoCropDialog } from "@/features/organization/LogoCropDialog";
import { checkLogoFile, LOGO_TYPES } from "@/features/organization/logoFile";
import { formatDate } from "@/lib/format";
import { PortalContactDialog } from "./PortalContactDialog";
import { removePortalPhoto, uploadPortalPhoto, type InfoPersonal } from "./usePortalInfo";

const phone = (raw: string | null) => (raw ? (isValidPhone(raw) ? formatPhone(raw) : raw) : null);

// RF-POR-07, RN-ALU-11: bloco "Foto" (avatar, trocar e remover) e "Carteirinha"; a foto o aluno ou responsável edita.
export function PortalPhoto({ studentId, personal, onChanged, compact = false }: { studentId: string; personal: InfoPersonal; onChanged: () => void; compact?: boolean }) {
  const { t } = useTranslation();
  const k = "portalInfo.personal.";
  const fileInput = useRef<HTMLInputElement>(null);
  const [cropping, setCropping] = useState<File | null>(null);
  const [notice, setNotice] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setNotice(undefined);
    try {
      await action();
      onChanged();
    } catch {
      setNotice(t(`${k}photoFailed`));
    } finally {
      setBusy(false);
    }
  }
  function pick(file: File | undefined) {
    if (!file) return;
    const problem = checkLogoFile(file);
    if (problem) return setNotice(t(problem === "type" ? `${k}photoTypeError` : `${k}photoSizeError`));
    setNotice(undefined);
    setCropping(file);
  }
  const card = (
    <Button asChild variant="secondary" size="sm">
      <Link to="/portal/carteirinha">
        <CreditCard aria-hidden />
        {t(`${k}card`)}
      </Link>
    </Button>
  );
  return (
    <Card>
      <div className={compact ? "flex items-center gap-3" : "flex flex-wrap items-center gap-4"}>
        {personal.photoUrl ? (
          <img src={personal.photoUrl} alt="" className="size-14 shrink-0 rounded-full object-cover" />
        ) : (
          <Avatar name={personal.name} decorative className="size-14 text-xl" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-medium">{compact ? personal.name : t(`${k}photoLabel`)}</span>
          {compact && <div>{card}</div>}
          {personal.canEdit && (
            <>
              <input
                ref={fileInput}
                type="file"
                hidden
                aria-label={t(`${k}photoFile`)}
                accept={LOGO_TYPES.join(",")}
                onChange={(ev) => {
                  pick(ev.target.files?.[0]);
                  ev.target.value = "";
                }}
              />
              <div className="-ml-3 flex flex-wrap gap-x-2">
                <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => fileInput.current?.click()}>
                  {personal.photoUrl ? t(`${k}photoReplace`) : t(`${k}photoChoose`)}
                </Button>
                {personal.photoUrl && (
                  <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void run(() => removePortalPhoto(studentId))}>
                    {t(`${k}photoRemove`)}
                  </Button>
                )}
              </div>
            </>
          )}
          {notice && (
            <p role="alert" className="text-sm text-danger-foreground">
              {notice}
            </p>
          )}
        </div>
        {!compact && card}
      </div>
      {cropping && (
        <LogoCropDialog
          file={cropping}
          labels={{ title: t(`${k}cropTitle`), hint: t(`${k}cropHint`), preview: t(`${k}cropPreview`), error: t(`${k}photoTypeError`) }}
          onCancel={() => setCropping(null)}
          onConfirm={async (blob) => {
            setCropping(null);
            await run(() => uploadPortalPhoto(studentId, blob));
          }}
        />
      )}
    </Card>
  );
}

// RF-POR-07, RN-ALU-11: nome, CPF, nascimento e e-mail só leitura; celular, endereço e emergência o aluno ou responsável edita.
export function PortalPersonalData({ studentId, personal, onChanged, compact = false }: { studentId: string; personal: InfoPersonal; onChanged: () => void; compact?: boolean }) {
  const { t } = useTranslation();
  const k = "portalInfo.personal.";
  const none = t("portalInfo.none");
  const [editing, setEditing] = useState(false);
  const { address: a, emergency: e } = personal;
  const row = (label: string, value: string | null) => (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{value ?? none}</dd>
    </div>
  );
  return (
    <Card
      heading="h2"
      title={t(`${k}title`)}
      titleClassName={compact ? CARD_TITLE : undefined}
      actions={
        personal.canEdit && (
          <Button variant={compact ? "ghost" : "secondary"} size="sm" onClick={() => setEditing(true)}>
            <Pencil aria-hidden />
            {t(`${k}${compact ? "editShort" : "edit"}`)}
          </Button>
        )
      }
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        {!compact && row(t(`${k}name`), personal.name)}
        {!compact && row(t(`${k}birthDate`), formatDate(personal.birthDate))}
        {!compact && row(t(`${k}cpf`), personal.maskedCpf)}
        {row(t(`${k}phone`), phone(personal.phone))}
        {row(t(`${k}email`), personal.email ? (compact ? personal.email : t(`${k}emailNote`, { email: personal.email })) : null)}
        {row(
          t(`${k}address`),
          a.street && compact
            ? t(`${k}addressShort`, { street: a.street, number: a.number, complement: a.complement ? `, ${a.complement}` : "" })
            : a.street ? t(`${k}addressLine`, { street: a.street, number: a.number, complement: a.complement ? ` ${a.complement}` : "", district: a.district, city: a.city, state: a.state, postalCode: a.postalCode }) : null,
        )}
        {row(t(`${k}emergency`), e.name ? t(`${k}${compact ? "emergencyShort" : "emergencyLine"}`, { name: e.name, relationship: e.relationship ?? "", phone: phone(e.phone) ?? "" }) : null)}
      </dl>
      {!compact && <p className="mt-4 text-xs text-muted-foreground">{t(`${k}readOnlyHint`)}</p>}
      {editing && <PortalContactDialog studentId={studentId} personal={personal} onClose={() => setEditing(false)} onSaved={onChanged} />}
    </Card>
  );
}
