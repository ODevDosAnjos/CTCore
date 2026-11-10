import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatPhone } from "@/components/fields/masks";
import { Button } from "@/components/ui/button";
import { useBelowSm } from "@/components/query/useBelowSm";
import { WhatsAppButton } from "@/components/whatsapp";
import { Banner } from "@/components/ui/banner";
import { StatusBadge } from "@/components/ui/badge";
import { PersonRow } from "@/components/ui/person-row";
import { api, ApiError } from "@/lib/api";
import { GuardianLinkDialog } from "./GuardianLinkDialog";
import type { StudentRecord, StudentRecordGuardian } from "./types";

// RN-RSP-02, RN-RSP-05: lista os responsáveis e usa as rotas de #54. Recusa do servidor aparece aqui, sem fechar o painel; ao concluir, a ficha é recarregada.
export function RecordGuardians({ record, onChanged, canManage = false }: { record: StudentRecord; onChanged: () => void; canManage?: boolean }) {
  const { t } = useTranslation();
  const k = "students.record.guardians.";
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<StudentRecordGuardian | null>(null);
  const [linking, setLinking] = useState(false);
  const base = `/students/${record.id}/guardians`;
  const narrow = useBelowSm();
  const full = record.guardians.length >= 2;
  const other = unlinking ? record.guardians.find((g) => g.guardianId !== unlinking.guardianId) : undefined;

  async function run(work: () => Promise<unknown>, done: string) {
    setNotice(null);
    setProblem(null);
    try {
      await work();
      setNotice(done);
      onChanged();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "generic";
      setProblem(t(`${k}errors.${code}`, { defaultValue: t(`${k}errors.generic`) }));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {problem && (
        <Banner tone="danger">
          {problem}
        </Banner>
      )}
      {record.minor && record.age != null && <Banner tone="info">{t(`${k}minorNotice`, { name: record.name.split(" ")[0], age: record.age })}</Banner>}
      {record.guardians.length === 0 ? (
        <p className="text-muted-foreground">{t(`${k}empty`)}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {record.guardians.map((g) => {
            const phone = g.phone && formatPhone(g.phone);
            const badges = (
              <>
                {g.financial && <StatusBadge status="ACTIVE" label={t(`${k}financial`)} />}
                {g.access && <StatusBadge status={g.access === "ACTIVE" ? "CONFIRMED" : "PENDING"} label={t(g.access === "ACTIVE" ? `${k}accessActive` : `${k}accessPending`)} />}
              </>
            );
            return (
              <li key={g.guardianId} className="flex flex-col gap-3 rounded-card border bg-card p-3">
                <PersonRow name={g.name} secondary={[phone, g.email].filter(Boolean).join(" · ")} badges={badges} action={narrow && <WhatsAppButton phone={g.phone} />} />
                {canManage && (
                  <div className="flex flex-wrap gap-2">
                    {g.access === "PENDING" && (
                      <Button variant="secondary" className="min-h-11" onClick={() => run(() => api(`${base}/${g.guardianId}/invite`, { method: "POST" }), t(`${k}resent`, { name: g.name }))}>
                        {t(`${k}resend`)}
                      </Button>
                    )}
                    {!g.financial && (
                      <Button variant="ghost" className="min-h-11" onClick={() => run(() => api(`${base}/${g.guardianId}`, { method: "PUT", body: { financial: true } }), t(`${k}madeFinancial`, { name: g.name }))}>
                        {t(`${k}makeFinancial`)}
                      </Button>
                    )}
                    <Button variant="danger" className="min-h-11" onClick={() => setUnlinking(g)}>
                      {t(`${k}unlink`)}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {canManage && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button className="min-h-11 w-full sm:w-auto" disabled={full} onClick={() => setLinking(true)}>
              {t(`${k}link`)}
            </Button>
            {full && <span className="text-sm text-muted-foreground">{t(`${k}limit`)}</span>}
          </div>
          <p className="text-xs text-muted-foreground">{t(`${k}rule`)}</p>
        </div>
      )}
      {unlinking && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setUnlinking(null)}
          tone="danger"
          size="sm"
          title={t(`${k}unlinkTitle`)}
          subtitle={t(unlinking.financial ? `${k}unlinkSubtitleFinancial` : `${k}unlinkSubtitle`, { name: unlinking.name })}
          summary={t(`${k}unlinkSummary`, { name: unlinking.name, student: record.name.split(" ")[0] })}
          summaryLabel={t("students.record.enrollment.summaryLabel")}
          summaryItems={[
            ...(unlinking.financial && other ? [t(`${k}unlinkPromoted`, { other: other.name })] : []),
            ...(other ? [t(`${k}unlinkKept`, { student: record.name.split(" ")[0] })] : []),
            t(`${k}unlinkAudit`),
          ]}
          reason="required"
          confirmLabel={t(`${k}unlink`)}
          onConfirm={(reason) => run(() => api(`${base}/${unlinking.guardianId}/unlink`, { method: "POST", body: { reason } }), t(`${k}unlinked`, { name: unlinking.name }))}
        />
      )}
      <GuardianLinkDialog
        studentId={record.id}
        open={linking}
        onOpenChange={setLinking}
        onLinked={(name) => {
          setProblem(null);
          setNotice(t(`${k}linked`, { name }));
          onChanged();
        }}
      />
    </div>
  );
}
