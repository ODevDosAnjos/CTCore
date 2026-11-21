import { useEffect, useRef } from "react";
import { SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { StateCard } from "@/components/states/StateCard";
import { buttonVariants } from "@/components/ui/button";

// RNF-43 (R7): endereço que não está no mapa de rotas; aparece dentro da moldura do perfil (gestão ou portal) e leva ao Início.
export function NotFoundPage() {
  const { t } = useTranslation();
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);
  return (
    <div className="mx-auto w-full max-w-md">
      <StateCard
        icon={SearchX}
        framed
        level={1}
        titleRef={title}
        title={t("notFound.title")}
        text={t("notFound.text")}
        actions={
          <Link to="/" className={buttonVariants({ size: "lg", className: "w-full" })}>
            {t("notFound.home")}
          </Link>
        }
      />
    </div>
  );
}
