import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { OrgMark } from "./OrgMark";
import { PortalTabs } from "./PortalTabs";

describe("OrgMark (CA6; #754 CA3)", () => {
  it("CA6: sem logo ou com imagem quebrada, o quadrado com as iniciais", () => {
    const { container, rerender } = render(<OrgMark name="Academia Alfa" logoUrl={null} />);
    expect(container.querySelector("[data-initials]")).toHaveAttribute("data-initials", "AA");
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-initials]")).toHaveClass("bg-brand");
    rerender(<OrgMark name="Academia Alfa" logoUrl="data:image/png;base64,AAAA" />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("src", "data:image/png;base64,AAAA");
    fireEvent.error(img);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-initials]")).toHaveAttribute("data-initials", "AA");
  });
});

describe("PortalTabs (CA2)", () => {
  const tabs = (count: number, reduced = false) => (
    <MemoryRouter initialEntries={["/portal/financeiro"]}>
      <PortalTabs reduced={reduced} count={count} variant="bar" />
    </MemoryRouter>
  );

  it("contador 99+ acima de 99, some em zero e o nome acessível diz a contagem", () => {
    const { rerender } = render(tabs(120));
    expect(screen.getByRole("link", { name: "Avisos 99+ não lidos" })).toHaveTextContent("99+");
    rerender(tabs(2));
    expect(screen.getByRole("link", { name: "Avisos 2 não lidos" })).toHaveTextContent("2");
    rerender(tabs(0));
    expect(screen.getByRole("link", { name: "Avisos" })).toHaveTextContent(/^Avisos$/);
  });

  it("só a aba atual tem aria-current e o reduzido esconde Início, Agenda e Avisos", () => {
    const { rerender } = render(tabs(0));
    expect(screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page").map((a) => a.textContent)).toEqual(["Financeiro"]);
    rerender(tabs(0, true));
    expect(screen.getAllByRole("link").map((a) => a.textContent)).toEqual(["Financeiro", "Minhas informações"]);
  });
});
