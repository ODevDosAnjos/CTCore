import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, type To } from "react-router";
import { Badge } from "@/components/ui/badge";
import { GraduationBelt } from "@/components/ui/graduation-belt";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { api, ApiError } from "@/lib/api";
import type { StudentSimple } from "./types";

const LIMIT = 5;

type Done = { key: string; items?: StudentSimple[]; failure?: "forbidden" | "error" };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// R22 (02): lista simples da turma ou da aula, a mesma para o Professor e para a gestão. Só nome, foto, faixa e bloqueio;
// quem recusa e quem recorta é o servidor, sem depender das chaves do Professor.
export function StudentSimpleList({
  lessonId,
  classId,
  recordHref,
  noRecordNotice,
}: {
  lessonId?: string;
  classId?: string;
  recordHref?: (id: string) => To;
  noRecordNotice?: boolean;
}) {
  const { t } = useTranslation();
  const [tick, setTick] = useState(0);
  const [done, setDone] = useState<Done>();
  const [all, setAll] = useState(false);
  const query = lessonId ? `lessonId=${lessonId}` : `classId=${classId}`;
  const key = `${query}:${tick}`;
  useEffect(() => {
    let alive = true;
    api<StudentSimple[]>(`/students/simple?${query}`).then(
      (items) => alive && setDone({ key, items }),
      (e) => alive && setDone({ key, failure: e instanceof ApiError && e.status === 403 ? "forbidden" : "error" }),
    );
    return () => {
      alive = false;
    };
  }, [query, key]);
  const state = done?.key === key ? done : undefined;
  if (!state) return <LoadingState />;
  if (state.failure === "forbidden") return <ForbiddenState />;
  if (!state.items) return <ErrorState onRetry={() => setTick((n) => n + 1)} />;
  if (state.items.length === 0) return <EmptyState title={t("students.simple.emptyTitle")} text={t("students.simple.emptyText")} />;
  return (
    <>
    <ul className="flex flex-col gap-2">
      {(all ? state.items : state.items.slice(0, LIMIT)).map((s) => (
        <li key={s.id} className="flex min-h-11 flex-wrap items-center gap-2">
          {s.photoUrl ? (
            <img src={s.photoUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
          ) : (
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {initials(s.name)}
            </span>
          )}
          {recordHref ? (
            <Link to={recordHref(s.id)} className="inline-flex min-h-11 min-w-0 items-center break-words font-medium underline">
              {s.name}
            </Link>
          ) : (
            <span className="min-w-0 break-words font-medium">{s.name}</span>
          )}
          {s.belt && s.beltColor && (
            <GraduationBelt name={s.belt} color={s.beltColor} secondaryColor={s.beltSecondaryColor} degree={s.degree} label={s.belt} className="text-sm" />
          )}
          <Badge tone={s.blocked ? "danger" : "ok"} className="ml-auto">
            {t(s.blocked ? "students.simple.blocked" : "students.simple.active")}
          </Badge>
        </li>
      ))}
    </ul>
    {!all && state.items.length > LIMIT && (
      <Button variant="ghost" className="mt-1 min-h-11 self-start" onClick={() => setAll(true)}>
        {t("students.simple.showAll", { count: state.items.length })}
      </Button>
    )}
    {noRecordNotice && <p className="mt-2 text-sm text-muted-foreground">{t("students.simple.noRecord")}</p>}
    </>
  );
}
