import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/format";
import { ModalityDialog } from "@/features/students/ModalityPickers";
import { refuseRequest } from "./usePortalRequests";
import { requestDetail } from "./RequestSummary";
import type { PortalRequest } from "./types";

type Props = { request: PortalRequest; onClose: () => void; onDone: (decided: PortalRequest) => void };

// RF-MAT-04: recusar exige a mensagem ao aluno (3 a 500 caracteres); o texto sugerido já vem preenchido e é editável.
export function RefuseRequestDialog({ request, onClose, onDone }: Props) {
  const { t } = useTranslation();
  const k = "portalRequests.refuse.";
  const closure = request.kind === "CLOSURE";
  const first = request.studentName.split(" ")[0];
  const [message, setMessage] = useState(() => t(`${k}suggested.${request.kind}`, { student: first }));
  const decided = useRef<PortalRequest>(null);
  const modality = request.modality ?? "";
  const summary = closure
    ? [t(`${k}closureActive`, { modality }), t(`${k}closureMessage`, { student: first }), t(`${k}refused`)]
    : [t(`${k}who`, { student: request.studentName, kind: t(`portalRequests.kinds.${request.kind}`) }), requestDetail(t, request), t(`${k}refused`)];
  return (
    <ModalityDialog
      size="sm"
      fullOnMobile
      submitVariant="dangerSolid"
      cancelLabel={closure ? t(`${k}back`) : t("common.cancel")}
      title={t(closure ? `${k}closureTitle` : `${k}title`)}
      effect={closure ? t(`${k}closureSubtitle`, { student: request.studentName, modality, date: formatDate(request.createdAt).slice(0, 5), expires: request.expiresAt.slice(8, 10) + "/" + request.expiresAt.slice(5, 7) }) : undefined}
      state="ready"
      submitLabel={t(closure ? `${k}closureSubmit` : `${k}submit`)}
      canSubmit={message.trim().length >= 3}
      summary={summary}
      reason={{ label: t(`${k}message`, { student: first }), value: message, onChange: setMessage, max: 500, field: "message" }}
      work={async () => {
        decided.current = await refuseRequest(request.id, message.trim());
      }}
      onClose={onClose}
      onDone={() => onDone(decided.current!)}
      errorPrefix="portalRequests.errors."
    >
      {() => null}
    </ModalityDialog>
  );
}
