import { api } from "@/lib/api";
import type { PaymentProof, PaymentProofConfirmed } from "./types";

// GET /payment-proofs: só os pendentes, do mais antigo ao mais novo. Pede a página inteira (100) para um comprovante de várias cobranças chegar junto (D7).
export async function fetchPendingProofs(unitId?: string): Promise<PaymentProof[]> {
  const data = await api<{ items: PaymentProof[]; total: number }>(`/payment-proofs?size=100${unitId ? `&unitId=${encodeURIComponent(unitId)}` : ""}`);
  return data.items;
}

export const confirmProof = (id: string, sendReceipt: boolean) => api<PaymentProofConfirmed>(`/payment-proofs/${id}/confirm`, { method: "POST", body: { sendReceipt } });
export const refuseProof = (id: string, reason: string) => api<PaymentProof>(`/payment-proofs/${id}/refuse`, { method: "POST", body: { reason } });
