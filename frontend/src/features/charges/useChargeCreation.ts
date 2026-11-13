import { api } from "@/lib/api";
import { useResource } from "@/features/students/useStudentRecord";
import type { AdvancePreview, ChargeCreated, ChargeRow, OneOffInput } from "./types";

// RN-COB-11: cobrança avulsa; o requestId vira o id da cobrança, então repetir o envio não duplica.
export const createOneOff = (studentId: string, body: OneOffInput) => api<ChargeRow>(`/students/${studentId}/charges`, { method: "POST", body });
// RN-COB-06: as próximas N mensalidades da modalidade, tudo ou nada.
export const advanceCharges = (studentId: string, rowId: string, count: number) =>
  api<ChargeCreated[]>(`/students/${studentId}/modalities/${rowId}/charges/advance`, { method: "POST", body: { count } });
// RN-COB-06: prévia das mensalidades antes de gerar; sem aluno, modalidade ou quantidade, não pede nada.
export const useAdvancePreview = (studentId: string, rowId: string, count: number) =>
  useResource<AdvancePreview>(studentId && rowId && count ? `/students/${studentId}/modalities/${rowId}/charges/advance/preview?count=${count}` : null);
