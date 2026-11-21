import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ChooseLinkPage } from "./ChooseLinkPage";
import { useSession } from "./SessionProvider";

// Reabre a página de escolha sem novo login, por cima da casca; só aparece com mais de um vínculo (D5).
// Trocar de vínculo leva ao Início do vínculo novo (D2); a escolha logo após o login não passa por aqui e mantém o `next`.
export function ChooseLinkTrigger() {
  const { t } = useTranslation();
  const { state } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  if (state.status !== "ready" || state.session.links.length < 2) return null;
  return (
    <>
      <Button ref={button} variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t("chooseLink.trigger")}
      </Button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label={t("chooseLink.title")} className="fixed inset-0 z-50 overflow-auto bg-background">
          <ChooseLinkPage
            onChosen={() => navigate("/")}
            onClose={() => {
              setOpen(false);
              setTimeout(() => button.current?.focus());
            }}
          />
        </div>
      )}
    </>
  );
}
