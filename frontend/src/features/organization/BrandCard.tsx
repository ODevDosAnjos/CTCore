import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { initials } from "@/components/ui/avatar";
import { Field, Input } from "@/components/ui/field";
import { LogoCropDialog } from "./LogoCropDialog";
import { checkLogoFile, LOGO_TYPES } from "./logoFile";
import type { OrganizationView } from "./useOrganization";

type Notice = { kind: "ok" | "error"; text: string };

// RF-ORG-01: cartão "Marca" do canvas: nome, titular, logo (miniatura, trocar e remover) e a nota da marca (sem cor: RNF-22).
// Nome e titular são do formulário da tela (rodapé Descartar/Salvar); a logo envia e remove na hora (D5).
export function BrandCard({
  view,
  canEdit,
  name,
  onName,
  nameError,
  holderName,
  onHolderName,
  holderNameError,
  holder,
  onHolder,
  onHolderBlur,
  holderError,
  nameRef,
  uploadLogo,
  removeLogo,
}: {
  view: OrganizationView;
  canEdit: boolean;
  name: string;
  onName: (value: string) => void;
  nameError?: string;
  holderName: string;
  onHolderName: (value: string) => void;
  holderNameError?: string;
  holder: string;
  onHolder: (value: string) => void;
  onHolderBlur: () => void;
  holderError?: string;
  nameRef?: React.Ref<HTMLInputElement>;
  uploadLogo: (logo: Blob) => Promise<unknown>;
  removeLogo: () => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [cropping, setCropping] = useState<File | null>(null);
  const [removing, setRemoving] = useState(false);
  const [notice, setNotice] = useState<Notice>();

  function pick(file: File | undefined) {
    if (!file) return;
    const problem = checkLogoFile(file);
    if (problem) {
      setNotice({ kind: "error", text: t(problem === "type" ? "organization.logoTypeError" : "organization.logoSizeError") });
      return;
    }
    setNotice(undefined);
    setCropping(file);
  }

  return (
    <Card heading="h2" title={t("organization.brandTitle")} className="flex flex-col">
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("organization.name")} required error={nameError}>
            {(c) => <Input {...c} ref={nameRef} value={name} disabled={!canEdit} maxLength={120} onChange={(e) => onName(e.target.value)} />}
          </Field>
          <Field label={t("organization.holder")} error={holderNameError}>
            {(c) => <Input {...c} autoComplete="off" value={holderName} disabled={!canEdit} maxLength={160} onChange={(e) => onHolderName(e.target.value)} />}
          </Field>
          <Field label={t("organization.holderDocument")} error={holderError}>
            {(c) => (
              <Input {...c} inputMode="numeric" autoComplete="off" value={holder} disabled={!canEdit} onChange={(e) => onHolder(e.target.value)} onBlur={onHolderBlur} />
            )}
          </Field>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t("organization.logoLabel")}</span>
          <div className="flex items-center gap-3">
            {view.logoUrl ? (
              <img src={view.logoUrl} alt={t("organization.logoAlt")} width={72} height={72} className="size-[72px] shrink-0 rounded-card border object-cover" />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-[72px] shrink-0 items-center justify-center rounded-card bg-brand font-heading text-3xl font-bold text-brand-foreground"
              >
                {initials(name || view.name)}
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-1.5">
              {canEdit && (
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={input}
                    type="file"
                    hidden
                    aria-label={t("organization.logoFile")}
                    accept={LOGO_TYPES.join(",")}
                    onChange={(e) => {
                      pick(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <Button variant="secondary" size="sm" icon={<Upload aria-hidden="true" />} onClick={() => input.current?.click()}>
                    {view.logoUrl ? t("organization.logoReplace") : t("organization.logoUpload")}
                  </Button>
                  {view.logoUrl && (
                    <Button variant="secondary" size="sm" onClick={() => setRemoving(true)}>
                      {t("organization.logoRemove")}
                    </Button>
                  )}
                </div>
              )}
              <span className="text-xs text-muted-foreground">{t("organization.logoHint")}</span>
            </div>
          </div>
          {notice && <Banner tone={notice.kind === "ok" ? "ok" : "danger"}>{notice.text}</Banner>}
        </div>
      </div>
      {cropping && (
        <LogoCropDialog
          file={cropping}
          onCancel={() => setCropping(null)}
          onConfirm={async (logo) => {
            await uploadLogo(logo);
            setCropping(null);
            setNotice({ kind: "ok", text: t("organization.logoUpdated") });
          }}
        />
      )}
      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={t("organization.logoRemove")}
        summary={t("organization.logoRemoveSummary")}
        confirmLabel={t("organization.logoRemove")}
        onConfirm={async () => {
          try {
            await removeLogo();
            setNotice({ kind: "ok", text: t("organization.logoRemoved") });
          } catch (e) {
            setNotice({ kind: "error", text: t("organization.logoError") });
            throw e;
          }
        }}
      />
    </Card>
  );
}
