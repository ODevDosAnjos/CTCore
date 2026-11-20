import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { useRef } from "react";
import { useFocusOnRoute } from "./useFocusOnRoute";

function Shell({ children }: { children: React.ReactNode }) {
  const main = useRef<HTMLElement>(null);
  useFocusOnRoute(main);
  return (
    <>
      <Link to="/b">ir b</Link>
      <Link to="/c">ir c</Link>
      <main ref={main} tabIndex={-1} data-testid="main">{children}</main>
    </>
  );
}

describe("useFocusOnRoute", () => {
  it("CA5: foco no h1 da tela nova, na área central sem h1, e nada no primeiro carregamento", async () => {
    render(
      <MemoryRouter initialEntries={["/a"]}>
        <Shell>
          <Routes>
            <Route path="/a" element={<h1>A</h1>} />
            <Route path="/b" element={<h1>B</h1>} />
            <Route path="/c" element={<p>sem título</p>} />
          </Routes>
        </Shell>
      </MemoryRouter>,
    );
    expect(document.body).toHaveFocus();
    await userEvent.click(screen.getByRole("link", { name: "ir b" }));
    expect(screen.getByRole("heading", { name: "B" })).toHaveFocus();
    await userEvent.click(screen.getByRole("link", { name: "ir c" }));
    expect(screen.getByTestId("main")).toHaveFocus();
  });
});
