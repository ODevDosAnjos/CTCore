import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Card } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Switch } from "@/components/ui/switch";
import { useMyRequests } from "./usePortalRequests";
import { formatDate } from "@/lib/format";
import { setEmailAnnouncements, setPortalImageUse, type PortalInfoData } from "./usePortalInfo";

// RF-POR-07, RN-COM-13: comunicados por e-mail (vale para a conta na organização).
export function PortalPreferences({ initial }: { initial: boolean }) {
  const { t } = useTranslation();
  const [on, setOn] = useState(initial);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  async function change(next: boolean) {
    setBusy(true);
    setFailed(false);
    try {
      setOn((await setEmailAnnouncements(next)).announcements);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card heading="h2" title={t("portalInfo.preferences.title")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t("portalInfo.preferences.emailAnnouncements")}</p>
          <p className="text-sm text-muted-foreground">{t("portalInfo.preferences.note")}</p>
        </div>
        <Switch checked={on} disabled={busy} label={t("portalInfo.preferences.emailAnnouncements")} onCheckedChange={(next) => void change(next)} />
      </div>
      {failed && (
        <p role="alert" className="text-sm text-danger-foreground">
          {t("portalInfo.preferences.failed")}
        </p>
      )}
    </Card>
  );
}

// RF-POR-07, RN-LGP-01, RN-MAT-12: termo de matrícula aceito e uso de imagem, que o aluno ou responsável revoga ou concede aqui.
export function PortalTermsAccepted({ studentId, terms, onChanged }: { studentId: string; terms: PortalInfoData["terms"]; onChanged: () => void }) {
  const { t } = useTranslation();
  const k = "portalInfo.terms.";
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { enrollment, imageUse } = terms;
  async function toggle() {
    setBusy(true);
    setFailed(false);
    try {
      await setPortalImageUse(studentId, !imageUse.granted);
      onChanged();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card heading="h2" title={t(`${k}title`)}>
      <ul className="flex flex-col divide-y text-sm">
        <li className="flex items-center justify-between gap-3 pb-3">
          <div className="min-w-0">
            <p className="font-medium">{t(`${k}enrollment`)}</p>
            <p className="text-xs text-muted-foreground">{enrollment ? t(`${k}enrollmentAccepted`, { version: enrollment.version, date: formatDate(enrollment.acceptedAt) }) : t(`${k}enrollmentNone`)}</p>
          </div>
          {enrollment && <ComingSoon tipAlign="end" variant="link" label={t(`${k}view`)} />}
        </li>
        <li className="flex items-center justify-between gap-3 pt-3">
          <div className="min-w-0">
            <p className="font-medium">{t(`${k}imageUse`)}</p>
            <p className="text-xs text-muted-foreground">{imageUse.granted ? t(`${k}imageGranted`, { date: imageUse.at ? formatDate(imageUse.at) : "" }) : t(`${k}imageNotGranted`)}</p>
          </div>
          <Button variant="ghost" disabled={busy} onClick={() => (imageUse.granted ? setConfirming(true) : void toggle())}>
            {imageUse.granted ? t(`${k}revoke`) : t(`${k}grant`)}
          </Button>
        </li>
      </ul>
      {failed && (
        <p role="alert" className="text-sm text-danger-foreground">
          {t(`${k}failed`)}
        </p>
      )}
      <ConfirmDialog
        open={confirming}
        tone="danger"
        size="sm"
        onOpenChange={setConfirming}
        title={t(`${k}revokeTitle`)}
        summary={t(`${k}revokeSummary`)}
        summaryItems={[t(`${k}revokeItem1`, { date: formatDate(new Date()) }), t(`${k}revokeItem2`), t(`${k}revokeItem3`)]}
        summaryLabel={t(`${k}revokeSummaryLabel`)}
        confirmLabel={t(`${k}revokeConfirm`)}
        onConfirm={toggle}
      />
    </Card>
  );
}

// RF-POR-07, RN-POR-07: os últimos pedidos do aluno; o pedido em si é feito em /portal/pedidos.
export function PortalRequestsSummary({ studentId }: { studentId: string }) {
  const { t } = useTranslation();
  const k = "portalInfo.requests.";
  const mine = useMyRequests(studentId);
  return (
    <Card heading="h2" title={t(`${k}title`)}>
      {mine.status === "loading" && <LoadingState />}
      {mine.status === "forbidden" && <ForbiddenState />}
      {mine.status === "error" && <ErrorState onRetry={mine.reload} />}
      {mine.data && mine.data.length === 0 && <p className="text-sm">{t(`${k}empty`)}</p>}
      {mine.data && mine.data.length > 0 && (
        <ul className="flex flex-col divide-y text-sm">
          {mine.data.slice(0, 5).map((r) => (
            <li key={r.id} className="py-2">
              {t(`${k}line`, { kind: t(`portalRequests.kinds.${r.kind}`), status: t(`portalRequests.statuses.${r.status}`), date: formatDate(r.createdAt) })}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// R3 (D4, D5): vai para Minha conta; baixar, excluir e instalar o app são das Sprints 13 e 21 e ficam visíveis e desabilitados (sem rota nem chamada).
export function PortalAccountCard({ reduced = false }: { reduced?: boolean }) {
  const { t } = useTranslation();
  const k = "portalInfo.account.";
  return (
    <Card heading="h2" title={t(reduced ? "portalInfo.accountReduced" : `${k}title`)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Button asChild variant="secondary" size="sm">
          <Link to="/conta">{t(`${k}mine`)}</Link>
        </Button>
        <ComingSoon tipAlign="end" variant="button" label={t(`${k}download`)} />
        <ComingSoon tipAlign="end" variant="button" label={t(`${k}delete`)} />
        {!reduced && (
          <span className="sm:hidden">
            <ComingSoon tipAlign="end" variant="button" label={t(`${k}install`)} />
          </span>
        )}
      </div>
    </Card>
  );
}
