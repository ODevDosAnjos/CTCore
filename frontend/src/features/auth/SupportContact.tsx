import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/whatsapp";

export interface Contact {
  email?: string;
  phone?: string;
  whatsapp?: string;
}

/** Contato da plataforma (D2): vem das variáveis do front. */
export const platformContact = (): Contact => ({
  email: (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) || "suporte@ctcore.com.br",
  whatsapp: (import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined) || undefined,
});

/** Contato da plataforma ou da unidade numa linha só: "Precisa de ajuda? e-mail · WhatsApp" (canvas). */
export function SupportContact({ contact, title, onDark = false }: { contact: Contact; title?: string; onDark?: boolean }) {
  const { t } = useTranslation();
  const label = title ?? t("auth.support.title");
  return (
    <section aria-label={label} className={`flex flex-wrap items-center gap-x-2 text-sm ${onDark ? "text-sidebar-foreground" : "text-muted-foreground"}`}>
      <span>{label}</span>
      {contact.phone && (
        <a className="underline" href={`tel:${contact.phone.replace(/\D/g, "")}`}>
          {contact.phone}
        </a>
      )}
      {contact.email && (
        <a className="underline" href={`mailto:${contact.email}`}>
          {contact.email}
        </a>
      )}
      <WhatsAppButton phone={contact.whatsapp} variant="ghost" className="h-auto min-h-0 px-1 underline" />
    </section>
  );
}

/** Botão "Falar com o suporte" dos estados de erro: abre o e-mail do suporte da plataforma. */
export function SupportLink() {
  const { t } = useTranslation();
  const email = platformContact().email;
  return (
    <Button asChild variant="secondary">
      <a href={`mailto:${email}`}>{t("states.support")}</a>
    </Button>
  );
}
