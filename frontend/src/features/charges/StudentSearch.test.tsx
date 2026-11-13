import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { useState } from "react";
import { useStudentModalities } from "@/features/benefits/GrantBenefitDialog";
import { server } from "@/mocks/server";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { StudentSearch } from "./StudentSearch";

const calls: string[] = [];
const picked = vi.fn();

function Harness() {
  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState("");
  const { students } = useStudentModalities(query, "");
  return (
    <StudentSearch
      query={query}
      onQuery={(q) => {
        setQuery(q);
        setStudentId("");
      }}
      students={students}
      studentId={studentId}
      onPick={(id) => {
        picked(id);
        setStudentId(id);
      }}
    />
  );
}

function setup(list: () => Response = () => HttpResponse.json({ items: [{ id: "s1", name: "Maria Lima", photoUrl: null }, { id: "s2", name: "Mariana Costa", photoUrl: null }], page: 1, size: 25, total: 2 })) {
  calls.length = 0;
  picked.mockClear();
  server.use(
    http.get("/api/v1/students", ({ request }) => {
      calls.push(new URL(request.url).searchParams.get("q")!);
      return list();
    }),
  );
  render(
    <ThemeProvider>
      <Harness />
    </ThemeProvider>,
  );
  return userEvent.setup();
}

const box = () => screen.getByLabelText("Buscar aluno pelo nome (mínimo 2 letras)");

describe("StudentSearch (R9, CA16)", () => {
  it("com menos de 2 letras não pede nada; com 2 ou mais lista os alunos", async () => {
    const user = setup();
    await user.type(box(), "m");
    expect(calls).toEqual([]);
    await user.type(box(), "a");
    expect(await screen.findByRole("button", { name: "Maria Lima" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mariana Costa" })).toBeInTheDocument();
    expect(calls).toEqual(["ma"]);
  });

  it("escolher mostra o aluno confirmado com Trocar, que volta à busca", async () => {
    const user = setup();
    await user.type(box(), "ma");
    await user.click(await screen.findByRole("button", { name: "Maria Lima" }));
    expect(picked).toHaveBeenCalledWith("s1");
    expect(screen.getByText("Maria Lima")).toBeInTheDocument();
    expect(screen.queryByLabelText("Buscar aluno pelo nome (mínimo 2 letras)")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Trocar o aluno Maria Lima" }));
    expect(box()).toHaveValue("");
  });

  it("sem resultado, erro com nova tentativa e sem permissão mostram o estado", async () => {
    let status = 200;
    const user = setup(() => (status === 200 ? HttpResponse.json({ items: [], page: 1, size: 25, total: 0 }) : HttpResponse.json({ code: "X" }, { status })));
    await user.type(box(), "zz");
    expect(await screen.findByText("Nenhum aluno encontrado.")).toBeInTheDocument();
    status = 500;
    await user.type(box(), "z");
    expect(await screen.findByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
    status = 403;
    await user.type(box(), "z");
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });
});
