import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "./Breadcrumb";

const groups = [
  { id: "home", label: "Início", items: [{ id: "home", label: "Início", href: "/" }] },
  { id: "people", label: "Pessoas", items: [{ id: "students", label: "Alunos", href: "/alunos" }] },
];

describe("Breadcrumb", () => {
  it("CA6: Grupo › Tela com o último em aria-current", () => {
    render(<Breadcrumb groups={groups} activeId="students" />);
    expect(screen.getByText("Pessoas")).toBeInTheDocument();
    expect(screen.getByText("Alunos")).toHaveAttribute("aria-current", "page");
  });
  it("CA1: com trail, o item vira link e o último nível é o atual", () => {
    render(<Breadcrumb groups={groups} activeId="students" trail="Nova matrícula" />);
    expect(screen.getByRole("link", { name: "Alunos" })).toHaveAttribute("href", "/alunos");
    expect(screen.getByText("Nova matrícula")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Pessoas")).toBeInTheDocument();
  });
  it("só o Início não repete o grupo; rota fora do menu não mostra trilha", () => {
    const { rerender } = render(<Breadcrumb groups={groups} activeId="home" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    rerender(<Breadcrumb groups={groups} activeId="account" />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
