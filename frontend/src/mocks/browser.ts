import { HttpResponse, http, type JsonBodyType } from "msw";
import { setupWorker } from "msw/browser";
import { handlers, restoreMockLogin } from "./handlers";

export const worker = setupWorker(...handlers);

type Override = { method: "get" | "post" | "put" | "patch" | "delete"; path: string; status: number; body: JsonBodyType };

declare global {
  interface Window {
    __mswQueue?: Override[];
    __mswOverride?: (spec: Override) => void;
    __mswReset?: () => void;
    __mswTermo?: (pending: { id: string; name: string }[], term: { version: number; body: string }, imageUse: { version: number; body: string }) => void;
  }
}

// Gancho do e2e (só em dev com MSW, ver main.tsx): troca a resposta de um endpoint por teste, sem mexer nos handlers padrão.
export function installE2eHook(w: typeof worker) {
  restoreMockLogin();
  const override = ({ method, path, status, body }: Override) => w.use(http[method](`/api/v1${path}`, () => HttpResponse.json(body, { status })));
  window.__mswOverride = override;
  window.__mswReset = () => w.resetHandlers();
  // Teste visual (#494): termos pendentes com texto e versão do canvas; cada aceite tira o aluno da lista.
  window.__mswTermo = (kids, term, imageUse) => {
    let left = kids;
    w.use(
      http.get("/api/v1/portal/term", () => HttpResponse.json(left.map((k) => ({ ...k, term, imageUse: { ...imageUse, granted: false } })))),
      http.post("/api/v1/portal/students/:id/term-acceptance", ({ params }) => {
        left = left.filter((k) => k.id !== params.id);
        return HttpResponse.json({ studentId: params.id, version: term.version, imageUse: false }, { status: 201 });
      }),
    );
  };
  window.__mswQueue?.forEach(override);
}
