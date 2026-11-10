import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { BlockerChecklist } from "./blocker-checklist";

it("CA2: link com href e rótulo; impedimento anunciado como Impede e livre como Livre", () => {
  render(
    <MemoryRouter>
      <BlockerChecklist label="O que impede agora" items={[{ text: "2 alunos", link: { to: "/alunos?x=1", label: "Ver alunos" } }, { text: "Sem turmas", ok: true }]} />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: "Ver alunos" })).toHaveAttribute("href", "/alunos?x=1");
  const [bad, ok] = screen.getAllByRole("listitem");
  expect(bad).toHaveTextContent("Impede: 2 alunos");
  expect(ok).toHaveTextContent("Livre: Sem turmas");
  expect(screen.getByText("O que impede agora")).toHaveClass("uppercase");
});

it("CA2: sem itens, não renderiza", () => {
  const { container } = render(<BlockerChecklist label="x" items={[]} />);
  expect(container).toBeEmptyDOMElement();
});
