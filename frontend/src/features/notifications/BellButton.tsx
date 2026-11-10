import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { NotificationPanel } from "./NotificationPanel";
import { useUnreadCount } from "./useNotifications";

// RF-NOT-01: sino da barra superior com o contador (99+ acima de 99; sem número em zero). Perfil sem sino (403): não aparece.
export function BellButton() {
  const { t } = useTranslation();
  const { count, forbidden, refresh, setCount } = useUnreadCount();
  if (forbidden) return null;
  const shown = count > 99 ? "99+" : String(count);
  return (
    <Popover
      label={t("notifications.title")}
      onOpenChange={(v) => !v && refresh()}
      trigger={(p) => (
        <Button
          {...p}
          variant="ghost"
          size="icon"
          className="relative min-h-11 min-w-11"
          aria-label={count > 0 ? t("notifications.bell.withCount", { count: shown }) : t("notifications.bell.label")}
        >
          <Bell aria-hidden="true" />
          {count > 0 && (
            <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-danger px-1 text-center text-xs font-semibold text-danger-foreground">
              {shown}
            </span>
          )}
        </Button>
      )}
    >
      {(close) => <NotificationPanel onClose={close} onUnread={setCount} />}
    </Popover>
  );
}
