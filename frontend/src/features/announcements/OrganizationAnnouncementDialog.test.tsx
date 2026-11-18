import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { AnnouncementDraft, AnnouncementTargets } from "./types";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const coordinator: AnnouncementTargets = { organization: true, units: [{ id: "u1", name: "Tijuca" }, { id: "u2", name: "Barra" }], modalities: [], classes: [] };
const admin: AnnouncementTargets = { organization: false, units: [{ id: "u1", name: "Tijuca" }], modalities: [], classes: [] };
const templates = {
  CANCELED_CLASS: { title: "Aula cancelada", body: "A aula de {turma} foi cancelada." },
  TEACHER_CHANGE: { title: "Troca de professor", body: "Novo professor." },
  SCHEDULE_CHANGE: { title: "Alteração de horário", body: "Novo horário." },
  NO_CLASS_DAY: { title: "Dia sem aula", body: "Sem aula." },
  GENERAL: { title: "Aviso geral", body: "Oi, pessoal!" },
};
const failure = (status: number, code: string) => HttpResponse.json({ code, message: "m", fields: [], traceId: "t" }, { status });

let creates: AnnouncementDraft[];
type Options = { role?: string; targets?: AnnouncementTargets; orgUsed?: number; targetsResponse?: () => Response; create?: () => Response };
function setup({ role = "COORDINATOR", targets = coordinator, orgUsed = 1, targetsResponse, create }: Options = {}) {
  creates = [];
  window.history.replaceState(null, "", "/comunicados?novo=organizacao");
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role as never) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: true, units: [] })),
    http.get("/api/v1/announcements/targets", () => targetsResponse?.() ?? HttpResponse.json(targets)),
    http.get("/api/v1/announcements/templates", () => HttpResponse.json({ templates })),
    http.get("/api/v1/announcements/daily-limit", () => HttpResponse.json({ unit: { id: "u1", name: "Tijuca", used: 3, limit: 20 }, organization: { used: orgUsed, limit: 20 } })),
    http.post("/api/v1/announcements/preview", () => HttpResponse.json({ recipients: 286, adults: 280, guardians: 6, portal: 286, email: 271, whatsapp: null, channels: ["PORTAL", "EMAIL"] })),
    http.post("/api/v1/announcements", async ({ request }) => {
      creates.push((await request.json()) as AnnouncementDraft);
      return create?.() ?? HttpResponse.json({ id: "n1", status: "SENT", recipients: 286 }, { status: 201 });
    }),
    http.get("/api/v1/announcements", () => HttpResponse.json({ items: [], page: 1, size: 25, total: 0 })),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/comunicados?novo=organizacao"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}
const ready = () => screen.findByRole("radio", { name: /Organização inteira/ });
const SUMMARY = "Vai para 286 pessoas nas duas unidades, 271 por e-mail.";

describe("OrganizationAnnouncementDialog (R17, CA15)", () => {
  it("o Coordenador vê os quatro rádios, o Resumo e o limite próprio, e envia para a organização", async () => {
    const user = userEvent.setup();
    setup();
    expect(await ready()).toBeChecked();
    const dialog = screen.getByRole("dialog", { name: "Novo comunicado" });
    expect(
      within(dialog)
        .getAllByRole("radio")
        .slice(0, 4)
        .map((r) => r.closest("label")?.textContent),
    ).toEqual(["Organização inteiraTodas as unidades de uma vez · só o Coordenador", "Uma unidade", "Uma modalidade de uma unidade", "Uma turma"]);
    expect(await screen.findByText(SUMMARY)).toBeInTheDocument();
    expect(screen.getByText("Limite próprio da organização: 1 de 20 hoje. Não consome o limite das unidades.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByText("Comunicado enviado.")).toBeInTheDocument();
    expect(creates).toEqual([{ targetKind: "ORGANIZATION", type: "GENERAL", title: "Aviso geral", body: "Oi, pessoal!", channels: ["PORTAL", "EMAIL"] }]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("trocar o tipo preenche o texto pronto; Agendar abre a janela de data e hora e envia sendAt", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    await user.selectOptions(screen.getByLabelText("Tipo"), "Dia sem aula");
    await user.click(screen.getByRole("button", { name: "Agendar" }));
    const when = await screen.findByLabelText("Data e hora do envio");
    const confirm = () => within(screen.getByRole("dialog", { name: "Agendar comunicado" })).getByRole("button", { name: "Agendar" });
    await user.click(confirm());
    expect(await screen.findByText("Escolha uma data e hora futuras.")).toBeInTheDocument();
    await user.type(when, "2099-01-01T10:00");
    await user.click(confirm());
    await waitFor(() => expect(creates).toHaveLength(1));
    expect(creates[0]).toMatchObject({ targetKind: "ORGANIZATION", type: "NO_CLASS_DAY", title: "Dia sem aula", sendAt: new Date("2099-01-01T10:00").toISOString() });
  });

  it("com 20 de 20 do limite próprio, Enviar e Agendar ficam desabilitados e a janela explica", async () => {
    setup({ orgUsed: 20 });
    await ready();
    expect(await screen.findByText(/A organização chegou a 20 comunicados hoje/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Agendar" })).toBeDisabled();
  });

  it("o limite estourado no servidor mostra a faixa; Cancelar fecha sem enviar de novo", async () => {
    const user = userEvent.setup();
    setup({ create: () => failure(409, "ANNOUNCEMENT_DAILY_LIMIT") });
    await ready();
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByText(/A organização chegou a 20 comunicados hoje/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(creates).toHaveLength(1);
  });

  it("escolher Uma unidade leva ao formulário com o destino de unidade marcado", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    await user.click(screen.getByRole("radio", { name: "Uma unidade" }));
    expect(await screen.findByRole("combobox", { name: "Unidade" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Unidade" })).toBeChecked();
  });

  it("quem não é Coordenador abre a URL e vê só a lista, sem a janela", async () => {
    setup({ role: "ADMINISTRATOR", targets: admin });
    expect(await screen.findByRole("heading", { name: "Comunicados", level: 1 })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByRole("radio", { name: /Organização inteira/ })).toBeNull();
  });

  it("carregando e erro com Tentar de novo, que refaz a chamada", async () => {
    const user = userEvent.setup();
    let mode: "error" | "ok" = "error";
    setup({ targetsResponse: () => (mode === "error" ? failure(500, "X") : HttpResponse.json(coordinator)) });
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    mode = "ok";
    await user.click(retry);
    expect(await ready()).toBeInTheDocument();
  });

  it("axe nos dois temas a 360 px", async () => {
    for (const dark of [false, true]) {
      setDevicePrefersDark(dark);
      window.innerWidth = 360;
      const { unmount } = setup();
      await ready();
      await screen.findByText(SUMMARY);
      expect(await axeViolations(document.body)).toEqual([]);
      unmount();
    }
  });
});
