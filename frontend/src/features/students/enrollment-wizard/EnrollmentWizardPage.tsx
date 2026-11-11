import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { WindowSteps } from "@/components/ui/window-steps";
import { useUnitScope } from "@/features/units/UnitScopeProvider";
import { ManagementLayout } from "@/features/permissions/ManagementLayout";
import { ApiError } from "@/lib/api";
import type { StudentDetail } from "../types";
import { useEnrollment, useResource } from "../useStudentRecord";
import { AssistantSummary } from "./AssistantSummary";
import { ageOf } from "./enrollmentFormat";
import { FooterBar } from "./FooterBar";
import { concludeEnrollment } from "./api";
import { buildRequest, modalityReady, newModality } from "./request";
import { StepBilling } from "./StepBilling";
import { StepDone } from "./StepDone";
import { StepModalities } from "./StepModalities";
import { StepStudent } from "./StepStudent";
import { StepSummary } from "./StepSummary";
import { emptyStudentDraft, type EnrollmentConcluded, type ModalityDraft, type UnitDraft, type WizardStudent } from "./types";
import { PageHeader } from "@/components/ui/page-header";

const STEPS = ["student", "modalities", "billing", "summary", "done"] as const;
const BILLING_FIELDS = new Set(["dueDay", "feeExemptReason", "secondDueOn", "units"]);
const emptyUnit = (): UnitDraft => ({ dueDay: "", feeExempt: false, feeExemptReason: "", secondDueOn: "" });

function Wizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetId = params.get("aluno");
  const preset = useResource<{ id: string; name: string; photoUrl: string | null }>(presetId ? `/students/${presetId}/record` : null);
  const [chosen, setChosen] = useState<WizardStudent>();
  const [draft, setDraft] = useState(emptyStudentDraft);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [step, setStep] = useState(presetId ? 1 : 0);
  const [modalities, setModalities] = useState<ModalityDraft[]>(() => [{ ...newModality(), unitId: params.get("unidade") ?? "", modalityId: params.get("modalidade") ?? "" }]); // R18: o pedido de nova modalidade chega com unidade e modalidade
  const [drafts, setDrafts] = useState<Record<string, UnitDraft>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [network, setNetwork] = useState(false);
  const [result, setResult] = useState<EnrollmentConcluded>();
  const [payNow, setPayNow] = useState(false); // D9: só a intenção; o pagamento acontece na etapa 5
  const student: WizardStudent | undefined = chosen ?? (preset.data ? { id: preset.data.id, name: preset.data.name, photoUrl: preset.data.photoUrl, enrollmentStatus: "NONE" } : undefined);
  const enrollment = useEnrollment(student?.id ?? "", Boolean(student));
  const reachable = useResource<{ units: { id: string; name: string }[] }>("/units/reachable");
  const scope = useUnitScope();
  // Ficha do aluno para a coluna "Até aqui": quem não a lê (403) ou erro só perde idade e responsável.
  const detail = useResource<StudentDetail>(student && step > 0 ? `/students/${student.id}` : null);

  if (presetId && !chosen) {
    if (preset.status === "loading" || preset.status === "idle") return <LoadingState />;
    if (preset.status === "forbidden") return <ForbiddenState />;
    if (preset.status === "error" || preset.status === "notFound") return <ErrorState onRetry={preset.reload} />;
  }
  if (step > 0 && student) {
    if (enrollment.status === "loading" || enrollment.status === "idle" || reachable.status === "loading") return <LoadingState />;
    if (enrollment.status === "forbidden" || reachable.status === "forbidden") return <ForbiddenState />;
    if (enrollment.status === "error" || enrollment.status === "notFound" || reachable.status === "error") {
      return <ErrorState onRetry={() => { enrollment.reload(); reachable.reload(); }} />;
    }
  }

  const active = (enrollment.data?.modalities ?? []).filter((m) => m.status === "ACTIVE");
  const inherited: Record<string, number> = Object.fromEntries(active.map((m) => [m.unit.id, m.dueDay]));
  const unitIds = [...new Set(modalities.map((m) => m.unitId).filter(Boolean))];
  const unitName = (id: string) => reachable.data?.units.find((u) => u.id === id)?.name ?? "";
  const full: Record<string, UnitDraft> = Object.fromEntries(unitIds.map((id) => [id, { ...emptyUnit(), ...drafts[id], ...(inherited[id] ? { dueDay: String(inherited[id]) } : {}) }]));
  const request = buildRequest(modalities, full);

  const valid = [
    true,
    modalities.length > 0 && modalities.every(modalityReady),
    unitIds.every((id) => Boolean(full[id].dueDay) && (!full[id].feeExempt || full[id].feeExemptReason.trim().length >= 3)),
    true,
    true,
  ];

  // Erro de regra do servidor: volta à etapa do campo, com a mensagem, sem perder o que foi digitado.
  function fail(e: ApiError) {
    const fields = Object.fromEntries(e.fields.map((f) => [f.field.split(".").pop()!, f.message]));
    setErrors(fields);
    setStep(e.fields.some((f) => BILLING_FIELDS.has(f.field)) ? 2 : 1);
  }

  async function conclude() {
    if (busy || !student) return;
    setBusy(true);
    setNetwork(false);
    setErrors({});
    try {
      setResult(await concludeEnrollment(student.id, request));
      setStep(4);
    } catch (e) {
      if (e instanceof ApiError && [400, 409, 422].includes(e.status)) fail(e);
      else setNetwork(true);
    } finally {
      setBusy(false);
    }
  }

  const go = (n: number) => {
    setErrors({});
    setStep(n);
  };

  const stepLabels = STEPS.map((id) => t(`enrollmentWizard.steps.${id}`));
  const unitLabel = (modalities[0]?.unitId ? unitName(modalities[0].unitId) : "") || (scope.units.find((u) => u.id === scope.selected)?.name ?? "");
  const subtitle = unitLabel ? t("enrollmentWizard.subtitle", { unit: unitLabel }) : t("enrollmentWizard.subtitleNoUnit");
  const sideColumn = (step === 1 || step === 2) && student;
  const footer = step > 0 && step < 4 && !network;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("enrollmentWizard.title")} subtitle={subtitle} />
      <section className="flex flex-col gap-6 rounded-lg border bg-card p-4 text-card-foreground max-sm:pb-24 sm:p-6">
        <WindowSteps steps={stepLabels} current={step + 1} className="max-sm:hidden" />
        <p role="status" className="text-sm font-medium sm:hidden">
          {t("enrollmentWizard.stepOf", { current: step + 1, total: STEPS.length, name: stepLabels[step] })}
        </p>
        <div className="flex items-start gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
      {step === 0 && (
        <StepStudent
          draft={draft}
          onDraft={setDraft}
          onCancel={() => navigate("/alunos")}
          onConfirm={(s, failed) => {
            setChosen(s);
            setPhotoFailed(Boolean(failed));
            go(1);
          }}
        />
      )}
      {step === 1 && photoFailed && <Banner tone="warn">{t("enrollmentWizard.student.photoFailed")}</Banner>}
      {step === 1 && student && (
        <StepModalities
          studentId={student.id}
          activeCount={active.length}
          takenModalityIds={new Set(active.map((m) => m.modality.id))}
          modalities={modalities}
          errors={errors}
          onChange={setModalities}
        />
      )}
      {step === 2 && student && (
        <StepBilling
          studentId={student.id}
          request={request}
          ready={valid[2]}
          units={unitIds.map((id) => ({ id, name: unitName(id) }))}
          drafts={full}
          inherited={inherited}
          errors={errors}
          onChange={(id, d) => setDrafts((p) => ({ ...p, [id]: d }))}
        />
      )}
      {step === 3 && student && !network && (
        <>
          {Object.keys(errors).length > 0 && (
            <Banner tone="danger">
              {Object.values(errors).join(" ")}
            </Banner>
          )}
          <StepSummary studentId={student.id} name={student.name} detail={detail.data} request={request} modalities={modalities} payNow={payNow} onPayNow={setPayNow} onInvalid={fail} />
        </>
      )}
      {step === 3 && network && <ErrorState onRetry={() => void conclude()} />}
      {step === 4 && student && result && <StepDone name={student.name} detail={detail.data} result={result} payNow={payNow} onBack={() => navigate("/alunos")} onRecord={() => navigate(`/alunos/${student.id}`)} />}
          </div>
          {sideColumn && (
            <AssistantSummary
              name={student.name}
              age={detail.data ? ageOf(detail.data.birthDate) : undefined}
              financial={detail.data?.guardians.find((g) => g.financial)?.name}
              unit={unitLabel || undefined}
            />
          )}
        </div>
        {footer && (
          <FooterBar>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => go(step - 1)} disabled={busy || (step === 1 && Boolean(presetId))}>
              <ArrowLeft aria-hidden="true" />
              {t("common.back")}
            </Button>
            {step < 3 ? (
              <Button type="button" className="min-h-11" disabled={!valid[step]} onClick={() => go(step + 1)}>
                {t("enrollmentWizard.continue")}
                <ArrowRight aria-hidden="true" />
              </Button>
            ) : (
              <Button type="button" variant="accent" className="min-h-11" disabled={busy} onClick={() => void conclude()}>
                <Check aria-hidden="true" />
                {t("enrollmentWizard.summary.conclude")}
              </Button>
            )}
          </FooterBar>
        )}
      </section>
    </div>
  );
}

// RF-MAT-01: "Nova matrícula" em cinco etapas. A barreira de dados e de perfil é o servidor; a rota já é só da gestão.
export function EnrollmentWizardPage() {
  const { t } = useTranslation();
  return (
    <ManagementLayout activeId="students" trail={t("enrollmentWizard.trail")}>
      <Wizard />
    </ManagementLayout>
  );
}
