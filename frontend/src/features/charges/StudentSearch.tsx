import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { PersonRow } from "@/components/ui/person-row";
import { SearchBox } from "@/components/ui/search-box";
import type { StudentList } from "@/features/students/types";
import type { useResource } from "@/features/students/useStudentRecord";

type Chosen = { id: string; name: string; photoUrl?: string | null };

// Busca de aluno por nome (mínimo 2 letras) das janelas de cobrança: lista os resultados e, ao escolher, mostra o aluno confirmado com "Trocar".
// Quatro estados: carregando, vazio, erro com nova tentativa e sem permissão.
export function StudentSearch({
  query,
  onQuery,
  students,
  studentId,
  onPick,
  error,
}: {
  query: string;
  onQuery: (q: string) => void;
  students: ReturnType<typeof useResource<StudentList>>;
  studentId: string;
  onPick: (id: string) => void;
  error?: string;
}) {
  const { t } = useTranslation();
  const labelId = useId();
  const [chosen, setChosen] = useState<Chosen>();
  const items = students.data?.items ?? [];
  const confirmed = studentId && chosen?.id === studentId ? chosen : undefined;
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-sm font-medium">
        {t("charges.creation.student")}
      </span>
      {confirmed ? (
        <div className="rounded-md border border-input bg-card p-2">
          <PersonRow
            name={confirmed.name}
            photoUrl={confirmed.photoUrl}
            size="sm"
            action={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={t("charges.creation.change", { name: confirmed.name })}
                onClick={() => {
                  setChosen(undefined);
                  onQuery("");
                }}
              >
                {t("charges.creation.changeShort")}
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <SearchBox value={query} onChange={onQuery} placeholder={t("charges.creation.searchPlaceholder")} aria-label={t("charges.creation.search")} />
          {students.status === "loading" && <LoadingState />}
          {students.status === "forbidden" && <ForbiddenState />}
          {(students.status === "error" || students.status === "notFound") && <ErrorState onRetry={students.reload} />}
          {students.status === "ready" && items.length === 0 && <p className="text-sm text-muted-foreground">{t("charges.creation.noStudent")}</p>}
          {students.status === "ready" && items.length > 0 && (
            <ul aria-labelledby={labelId} className="flex max-h-56 flex-col divide-y divide-divider overflow-y-auto rounded-md border bg-card">
              {items.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center px-3 py-1.5 text-left hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      setChosen({ id: s.id, name: s.name, photoUrl: s.photoUrl });
                      onPick(s.id);
                    }}
                  >
                    <PersonRow name={s.name} photoUrl={s.photoUrl} size="sm" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {error && <p className="text-sm text-danger-foreground">{error}</p>}
    </div>
  );
}
