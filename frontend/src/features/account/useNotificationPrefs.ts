import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { NotificationPreferences } from "@/features/notifications/useNotifications";

type Loaded = { tick: number; prefs?: NotificationPreferences; forbidden?: boolean };

/** GET/PUT /notifications/preferences com rascunho local: "Salvar" grava, "Descartar" volta ao gravado. */
export function useNotificationPrefs() {
  const [tick, setTick] = useState(0);
  const [done, setDone] = useState<Loaded>();
  const [draft, setDraft] = useState<boolean>();
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    api<NotificationPreferences>("/notifications/preferences").then(
      (prefs) => alive && setDone({ tick, prefs }),
      (e) => alive && setDone({ tick, forbidden: e instanceof ApiError && e.status === 403 }),
    );
    return () => {
      alive = false;
    };
  }, [tick]);

  const current = done?.tick === tick ? done : undefined;
  const prefs = current?.prefs;
  const receiveAll = draft ?? prefs?.receiveAll ?? false;
  return {
    status: !current ? ("loading" as const) : prefs ? ("ready" as const) : current.forbidden ? ("forbidden" as const) : ("error" as const),
    prefs,
    receiveAll,
    dirty: !!prefs && receiveAll !== prefs.receiveAll,
    saving,
    saveFailed,
    setReceiveAll: (v: boolean) => {
      setSaveFailed(false);
      setDraft(v);
    },
    discard: () => {
      setSaveFailed(false);
      setDraft(undefined);
    },
    retry: () => setTick((n) => n + 1),
    save: async () => {
      setSaving(true);
      setSaveFailed(false);
      try {
        const saved = await api<NotificationPreferences>("/notifications/preferences", { method: "PUT", body: { receiveAll } });
        setDone({ tick, prefs: saved });
        setDraft(undefined);
      } catch {
        setSaveFailed(true); // a mudança fica no rascunho
      } finally {
        setSaving(false);
      }
    },
  };
}
