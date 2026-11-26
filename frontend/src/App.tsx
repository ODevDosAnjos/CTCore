import { lazy, Suspense, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Route, Routes } from "react-router";
import { LoginPage } from "@/features/auth/LoginPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { AreaUnavailablePage } from "@/features/auth/AreaUnavailablePage";
import { InvitePage } from "@/features/auth/InvitePage";
import { PublicReceiptPage } from "@/features/payments/PublicReceiptPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import { RequireSession } from "@/features/auth/RequireSession";
import { RequireTwoFactor, TWO_FACTOR_REQUIRED_PATH } from "@/features/auth/RequireTwoFactor";
import { TwoFactorRequiredPage } from "@/features/auth/TwoFactorRequiredPage";
import { OrganizationSettingsPage } from "@/features/organization/OrganizationSettingsPage";
import { AgeRangesPage } from "@/features/age-ranges/AgeRangesPage";
import { TermsPage } from "@/features/terms/TermsPage";
import { TextsPage } from "@/features/texts/TextsPage";
import { ModalitiesPage } from "@/features/modalities/ModalitiesPage";
import { NewUnitPage } from "@/features/units/NewUnitPage";
import { UnitSettingsPage } from "@/features/units/UnitSettingsPage";
import { SettingsIndexPage } from "@/features/units/SettingsIndexPage";
import { UnitsPage } from "@/features/units/UnitsPage";
import { BirthdaysCard } from "@/features/students/BirthdaysCard";
import { EnrollmentWizardPage } from "@/features/students/enrollment-wizard/EnrollmentWizardPage";
import { PortalRequestsPage } from "@/features/portal-requests/PortalRequestsPage";
import { StudentsPage } from "@/features/students/StudentsPage";
import { StudentRecordPage } from "@/features/students/StudentRecordPanel";
import { ChargesPage } from "@/features/charges/ChargesPage";
import { ChargePanelPage } from "@/features/charges/ChargePanelPage";
import { ChargePreviewPage } from "@/features/charges/ChargePreviewPage";
import { DailyReceiptsPage } from "@/features/charges/DailyReceiptsPage";
import { OverduePage } from "@/features/charges/OverduePage";
import { PaymentProofsPage } from "@/features/payment-proofs/PaymentProofsPage";
import { AnnouncementsPage } from "@/features/announcements/AnnouncementsPage";
import { NewAnnouncementPage } from "@/features/announcements/NewAnnouncementPage";
import { TeachersPage } from "@/features/teachers/TeachersPage";
import { TeacherPanel } from "@/features/teachers/TeacherPanel";
import { ClassesPage } from "@/features/classes/ClassesPage";
import { ClassPanel } from "@/features/classes/ClassPanel";
import { PlansPage } from "@/features/plans/PlansPage";
import { PlanPanelPage } from "@/features/plans/PlanInspectDrawer";
import { BenefitsPage } from "@/features/benefits/BenefitsPage";
import { AgendaPage } from "@/features/agenda/AgendaPage";
import { LessonPanelPage } from "@/features/agenda/LessonPanelPage";
import { NoClassDaysPage } from "@/features/noClassDays/NoClassDaysPage";
import { PermissionsTablePage } from "@/features/users/PermissionsTablePage";
import { AdministratorsPage } from "@/features/users/AdministratorsPage";
import { AccountPage } from "@/features/account/AccountPage";
import { ConfirmEmailPage } from "@/features/account/ConfirmEmailPage";
import { ModalityConfirmations } from "@/features/portal/ModalityConfirmations";
import { PortalRequestsPage as PortalOwnRequestsPage } from "@/features/portal/PortalRequestsPage";
import { PortalAgendaPage } from "@/features/portal/PortalAgendaPage";
import { PortalAnnouncementsPage } from "@/features/portal/PortalAnnouncementsPage";
import { PortalCardPage } from "@/features/portal/PortalCardPage";
import { PortalFinancePage } from "@/features/portal/PortalFinancePage";
import { PortalHomePage } from "@/features/portal/PortalHomePage";
import { PortalInfoPage } from "@/features/portal/PortalInfoPage";
import { RequireFullPortal } from "@/features/portal/RequireFullPortal";
import { PortalTermPage } from "@/features/portal/PortalTermPage";
import { TeacherRecordPage } from "@/features/students/TeacherRecordPage";
import { RequireArea } from "@/features/auth/RequireArea";
import { NotFoundPage } from "@/features/auth/NotFoundPage";
import { RoleShell } from "@/features/auth/RoleShell";
import { useSession } from "@/features/auth/SessionProvider";
import { routeById, routes, type AppRoute } from "@/routes";
import { PageHeader } from "@/components/ui/page-header";

function Welcome() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t("app.welcomeTitle")} />
      <p className="mt-2 text-muted-foreground">{t("app.welcomeText")}</p>
    </>
  );
}

// "/" serve os dois mundos: a moldura vem da rota-pai (RoleShell); aqui só muda o conteúdo pelo perfil.
function Home() {
  const { state } = useSession();
  const session = state.status === "ready" ? state.session : undefined;
  const role = session?.links.find((l) => l.id === session.activeLinkId)?.role;
  if (role === "COORDINATOR" || role === "ADMINISTRATOR" || role === "TEACHER") {
    return (
      <>
        <Welcome />
        {(role === "ADMINISTRATOR" || role === "TEACHER") && <BirthdaysCard />}
      </>
    );
  }
  return (
    <>
      <PortalHomePage />
      <ModalityConfirmations />
    </>
  );
}

const P = (id: string) => routeById(id).path;

// Telas da gestão por id do mapa de rotas (`routes.ts`): endereço, acesso, menu e trilha vêm de lá.
const screens: Record<string, ReactNode> = {
  students: <StudentsPage />,
  studentRecord: <StudentRecordPage />,
  enrollment: <EnrollmentWizardPage />,
  requests: <PortalRequestsPage />,
  teachers: <TeachersPage />,
  teacherPanel: <TeacherPanel />,
  agenda: <AgendaPage />,
  lesson: <LessonPanelPage />,
  teacherRecord: <TeacherRecordPage />,
  classes: <ClassesPage />,
  classPanel: <ClassPanel />,
  noClassDays: <NoClassDaysPage />,
  collections: <ChargesPage />,
  chargePanel: <ChargePanelPage />,
  chargePreview: <ChargePreviewPage />,
  dailyReceipts: <DailyReceiptsPage />,
  overdue: <OverduePage />,
  paymentProofs: <PaymentProofsPage />,
  plans: <PlansPage />,
  planPanel: <PlanPanelPage />,
  benefits: <BenefitsPage />,
  announcements: <AnnouncementsPage />,
  newAnnouncement: <NewAnnouncementPage />,
  settings: <SettingsIndexPage />,
  organizationSettings: <OrganizationSettingsPage />,
  units: <UnitsPage />,
  newUnit: <NewUnitPage />,
  unitSettings: <UnitSettingsPage />,
  modalities: <ModalitiesPage />,
  ageRanges: <AgeRangesPage />,
  terms: <TermsPage />,
  texts: <TextsPage />,
  administrators: <AdministratorsPage />,
  permissionsTable: <PermissionsTablePage />,
};

// Uma <Route> por rota da gestão; a rota com `parent` entra dentro da mãe (que tem um <Outlet />). Cada uma passa pelo guarda do mapa (D1).
function managementRoutes(parent?: string): ReactNode[] {
  return routes
    .filter((r) => r.area === "management" && r.parent === parent && (r.redirect || screens[r.id]))
    .map((r: AppRoute) => {
      const children = managementRoutes(r.id);
      const element = r.redirect ? <Navigate to={r.redirect} replace /> : <RequireArea route={r}>{screens[r.id]}</RequireArea>;
      return (
        <Route key={r.id} path={r.path} element={element}>
          {children}
        </Route>
      );
    });
}

// Rota do portal: o mesmo guarda do mapa (o perfil da gestão não entra nela).
const portal = (id: string, screen: ReactNode) => <RequireArea route={routeById(id)}>{screen}</RequireArea>;

// Vitrine de desenvolvimento: sob import.meta.env.DEV o Vite elimina a rota e o módulo do build.
const Vitrine = import.meta.env.DEV ? lazy(() => import("@/dev/Vitrine")) : null;

// Precisa estar dentro de um roteador e do SessionProvider (main.tsx).
export function App() {
  return (
    <Routes>
      {Vitrine && (
        <Route path="/dev/vitrine" element={<Suspense fallback={null}><Vitrine /></Suspense>} />
      )}
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha/:code" element={<ResetPasswordPage />} />
      <Route path="/convite/:code" element={<InvitePage />} />
      <Route path="/recibo/:codigo" element={<PublicReceiptPage />} />
      <Route element={<RequireSession />}>
        <Route element={<RequireTwoFactor />}>
          <Route path={TWO_FACTOR_REQUIRED_PATH} element={<TwoFactorRequiredPage />} />
          <Route path="/portal/termo" element={<PortalTermPage />} />
          <Route element={<RoleShell />}>
            <Route path={P("confirmEmail")} element={<ConfirmEmailPage />} />
            <Route path={P("noAccess")} element={<AreaUnavailablePage />} />
            {managementRoutes()}
            <Route path={P("home")} element={<Home />} />
            <Route path={P("account")} element={<AccountPage />} />
            <Route path={P("portalRequests")} element={portal("portalRequests", <PortalOwnRequestsPage />)} />
            <Route path={P("portalCard")} element={portal("portalCard", <PortalCardPage />)} />
            <Route element={<RequireFullPortal />}>
              <Route path={P("portalAgenda")} element={portal("portalAgenda", <PortalAgendaPage />)} />
              <Route path={P("portalAnnouncements")} element={portal("portalAnnouncements", <PortalAnnouncementsPage />)} />
            </Route>
            <Route path={P("portalFinance")} element={portal("portalFinance", <PortalFinancePage />)} />
            <Route path={P("portalInfo")} element={portal("portalInfo", <PortalInfoPage />)} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
