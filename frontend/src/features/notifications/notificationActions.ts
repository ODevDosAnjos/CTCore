import { AlertTriangle, Banknote, Cake, FileText, Gift, Lock, Mail, UserPlus, Users, type LucideIcon } from "lucide-react";
import { hrefOf } from "@/routes";
import type { Tone } from "@/components/ui/status-tone";
import type { AppNotification, NotificationType } from "./useNotifications";

// D5: a ação de cada notificação é o botão que leva à tela do objeto; sem tela própria do objeto, a lista da área.
export function notificationTarget(n: Pick<AppNotification, "type" | "refType" | "refId">): string {
  const student = n.refType === "student" && n.refId ? hrefOf("students", { id: n.refId }) : hrefOf("students");
  const routes: Record<NotificationType, string> = {
    PAYMENT_RECEIVED: hrefOf("collections"),
    HIGH_BENEFIT: hrefOf("benefits"),
    STUDENT_MAJORITY: student,
    EMAIL_PROBLEM: student,
    INVITE_PENDING: hrefOf("staffUsers"),
    CLOSURE_REQUEST: hrefOf("requests"),
    PORTAL_REQUEST: hrefOf("requests"),
    PAYMENT_PROOF: hrefOf("paymentProofs"),
    MP_DISCONNECTED: hrefOf("organizationSettings"),
    SUBSCRIPTION_OVERDUE: hrefOf("organizationSettings"),
  };
  return routes[n.type];
}

/** Tempo relativo em minutos, horas ou dias (a data exata vai no `title`). */
export function relativeTime(createdAt: string, now: Date = new Date()): { key: "now" | "minutes" | "hours" | "days"; count: number } {
  const minutes = Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60_000);
  if (minutes < 1) return { key: "now", count: 0 };
  if (minutes < 60) return { key: "minutes", count: minutes };
  if (minutes < 1440) return { key: "hours", count: Math.floor(minutes / 60) };
  return { key: "days", count: Math.floor(minutes / 1440) };
}

// Canvas: quadrado de 32 px colorido por tipo (pagamento verde, comprovante azul, pedido amarelo, problema vermelho, demais neutro).
export const NOTIFICATION_LOOK: Record<NotificationType, { icon: LucideIcon; tone: Tone }> = {
  PAYMENT_RECEIVED: { icon: Banknote, tone: "ok" },
  HIGH_BENEFIT: { icon: Gift, tone: "neutral" },
  STUDENT_MAJORITY: { icon: Cake, tone: "neutral" },
  EMAIL_PROBLEM: { icon: Mail, tone: "danger" },
  INVITE_PENDING: { icon: UserPlus, tone: "neutral" },
  CLOSURE_REQUEST: { icon: Lock, tone: "warn" },
  PORTAL_REQUEST: { icon: Users, tone: "warn" },
  PAYMENT_PROOF: { icon: FileText, tone: "info" },
  MP_DISCONNECTED: { icon: AlertTriangle, tone: "danger" },
  SUBSCRIPTION_OVERDUE: { icon: AlertTriangle, tone: "danger" },
};
