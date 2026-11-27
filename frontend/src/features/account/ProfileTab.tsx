import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { PhoneField } from "@/components/fields/fields";
import { Avatar } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useSession, type SessionView } from "@/features/auth/SessionProvider";
import { LogoCropDialog } from "@/features/organization/LogoCropDialog";
import { checkLogoFile, LOGO_TYPES } from "@/features/organization/logoFile";
import { api, ApiError } from "@/lib/api";

const k = "account.profile.";

type Notice = { tone: "ok" | "danger"; text: string };

/** Envia uma mudança do perfil: a sessão devolvida atualiza o topo; os erros viram aviso (ou erro de campo). */
function useProfileSave() {
  const { t } = useTranslation();
  const { setSession, refresh } = useSession();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>();
  const [nameError, setNameError] = useState<string>();

  async function run(path: string, method: string, body: unknown, done: string) {
    setBusy(true);
    setNotice(undefined);
    setNameError(undefined);
    try {
      setSession(await api<SessionView>(path, { method, body }));
      setNotice({ tone: "ok", text: t(`${k}${done}`) });
    } catch (e) {
      const error = e instanceof ApiError ? e : undefined;
      if (error?.status === 401) return void refresh(); // sessão expirada: volta ao login
      const field = error?.status === 422 ? error.fields[0]?.field : undefined;
      if (field === "name") return setNameError(t(`${k}nameError`));
      const key = field === "phone" ? "phoneError" : field === "file" ? "photoRejected" : error?.status === 403 ? "forbidden" : "failed";
      setNotice({ tone: "danger", text: t(`${k}${key}`) });
    } finally {
      setBusy(false);
    }
  }
  return { busy, notice, setNotice, nameError, run };
}

function PhotoCard({ account }: { account: SessionView["account"] }) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [cropping, setCropping] = useState<File | null>(null);
  const { busy, notice, setNotice, run } = useProfileSave();

  function pick(file: File | undefined) {
    if (!file) return;
    const problem = checkLogoFile(file);
    if (problem) return setNotice({ tone: "danger", text: t(`${k}${problem === "type" ? "photoTypeError" : "photoSizeError"}`) });
    setNotice(undefined);
    setCropping(file);
  }
  function upload(photo: Blob) {
    const form = new FormData();
    form.append("file", photo, "foto.png");
    return run("/auth/profile/photo", "PUT", form, "photoSaved");
  }

  return (
    <Card heading="h2" title={t(`${k}photoTitle`)}>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={account.name || account.email} size="lg" decorative photoUrl={account.photoUrl} />
        <input
          ref={input}
          type="file"
          hidden
          aria-label={t(`${k}photoFile`)}
          accept={LOGO_TYPES.join(",")}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
            {t(`${k}${account.photoUrl ? "photoReplace" : "photoChoose"}`)}
          </Button>
          {account.photoUrl && (
            <Button type="button" variant="ghost" disabled={busy} onClick={() => void run("/auth/profile/photo", "DELETE", undefined, "photoRemoved")}>
              {t(`${k}photoRemove`)}
            </Button>
          )}
        </div>
      </div>
      {notice && (
        <Banner tone={notice.tone} className="mt-3">
          {notice.text}
        </Banner>
      )}
      {cropping && (
        <LogoCropDialog
          file={cropping}
          labels={{ title: t(`${k}cropTitle`), hint: t(`${k}cropHint`), preview: t(`${k}cropPreview`), error: t(`${k}photoTypeError`) }}
          onCancel={() => setCropping(null)}
          onConfirm={async (blob) => {
            setCropping(null);
            await upload(blob);
          }}
        />
      )}
    </Card>
  );
}

function DataCard({ account }: { account: SessionView["account"] }) {
  const { t } = useTranslation();
  const [name, setName] = useState(account.name ?? "");
  const [phone, setPhone] = useState(account.phone ?? "");
  const { busy, notice, nameError, run } = useProfileSave();

  function submit(e: FormEvent) {
    e.preventDefault();
    void run("/auth/profile", "PUT", { name, phone }, "saved");
  }

  return (
    <Card heading="h2" title={t(`${k}dataTitle`)}>
      <form onSubmit={submit} noValidate className="space-y-3">
        <p className="text-sm text-muted-foreground">{t(`${k}dataHint`)}</p>
        <div className="grid items-start gap-3 sm:grid-cols-2">
          <Field label={t(`${k}name`)} required error={nameError} alertError>
            {(control) => <Input {...control} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
          </Field>
          <PhoneField label={t(`${k}phone`)} initial={account.phone ?? ""} onChange={setPhone} autoComplete="tel" />
        </div>
        {notice && <Banner tone={notice.tone}>{notice.text}</Banner>}
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {t(`${k}${busy ? "saving" : "save"}`)}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// RF-ACE-04: foto, nome e telefone da própria conta, que valem em todas as organizações; só na gestão (no portal, o Perfil é só Meus vínculos).
export function ProfileTab() {
  const { state } = useSession();
  if (state.status !== "ready") return null;
  const { account } = state.session;
  return (
    <>
      <PhotoCard account={account} />
      <DataCard account={account} />
    </>
  );
}
