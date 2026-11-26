import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useBelowSm } from "@/components/query/useBelowSm";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { PortalRequestKind } from "@/features/portal-requests/types";
import { cn } from "@/lib/utils";
import { PortalHeading } from "./PortalHeading";
import { PortalMyRequests } from "./PortalMyRequests";
import { PortalRequestCards } from "./PortalRequestCards";
import { PortalRequestDialog } from "./PortalRequestDialog";
import { useMyRequests, usePortalStudents, useRequestOptions } from "./usePortalRequests";

function Student({ studentId }: { studentId: string }) {
  const options = useRequestOptions(studentId);
  const mine = useMyRequests(studentId);
  const [open, setOpen] = useState<PortalRequestKind>();
  const parts = [options, mine];
  if (parts.some((p) => p.status === "loading")) return <LoadingState />;
  if (parts.some((p) => p.status === "forbidden")) return <ForbiddenState />;
  if (!options.data || !mine.data) return <ErrorState onRetry={() => parts.forEach((p) => p.reload())} />;
  const { modalities, offers } = options.data;
  return (
    <div className="flex flex-col gap-4">
      <PortalRequestCards canPick={modalities.length > 0} canOffer={offers.length > 0} onPick={setOpen} />
      <PortalMyRequests requests={mine.data} />
      {open && <PortalRequestDialog studentId={studentId} kind={open} modalities={modalities} offers={offers} onClose={() => setOpen(undefined)} onDone={() => parts.forEach((p) => p.reload())} />}
    </div>
  );
}

// RF-MAT-04 (#86, canvas do item 500): o aluno adulto, ou o responsável pelo menor, faz e acompanha os pedidos; nada muda na matrícula até a gestão agir.
export function PortalRequestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const narrow = useBelowSm();
  const students = usePortalStudents();
  const [picked, setPicked] = useState<string>();
  let body;
  if (students.status === "loading") body = <LoadingState />;
  else if (students.status === "forbidden") body = <ForbiddenState />;
  else if (!students.data) body = <ErrorState onRetry={students.reload} />;
  else if (students.data.length === 0) body = <EmptyState title={t("portalOwn.noStudentTitle")} text={t("portalOwn.noStudentText")} />;
  else {
    const id = picked ?? students.data[0].id;
    body = (
      <div className="flex flex-col gap-4">
        {students.data.length > 1 && (
          <ul aria-label={t("portalOwn.students")} className="flex flex-wrap gap-2">
            {students.data.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={id === s.id}
                  onClick={() => setPicked(s.id)}
                  className={cn("flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-medium", id === s.id ? "border-primary bg-card" : "bg-secondary")}
                >
                  <Avatar name={s.name} decorative size="sm" />
                  {s.self ? t("portalOwn.you") : s.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <Student key={id} studentId={id} />
      </div>
    );
  }
  return (
    <>
      {narrow && (
        <Button variant="ghost" onClick={() => navigate("/portal/minhas-informacoes")} className="-ml-3 mb-2 text-muted-foreground">
          <ChevronLeft aria-hidden className="size-4" />
          {t("portalOwn.back")}
        </Button>
      )}
      <PortalHeading label={t("portalOwn.label")} title={t("portalOwn.title")} className="mb-4" />
      {body}
    </>
  );
}
