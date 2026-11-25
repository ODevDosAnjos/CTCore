import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// R7, R8 (CA11, CA12): barra de rolagem fina nos tokens dos dois temas e sem barra vertical onde só se rola na horizontal.
const css = readFileSync(join(__dirname, "..", "index.css"), "utf8");

function fontes(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? fontes(join(dir, e.name)) : /\.tsx$/.test(e.name) && !/\.test\./.test(e.name) ? [join(dir, e.name)] : [],
  );
}

describe("barra de rolagem (CA11)", () => {
  it("fina, transparente sem hover e com o token no hover, em todo elemento", () => {
    expect(css).toMatch(/\*\s*\{[^}]*scrollbar-width:\s*thin;[^}]*scrollbar-color:\s*transparent transparent/);
    expect(css).toMatch(/\*:hover\s*\{[^}]*scrollbar-color:\s*var\(--scrollbar-thumb\) transparent/);
  });

  it("o menu usa o token do menu", () => {
    expect(css).toMatch(/\[data-sidebar-scroll\]:hover\s*\{[^}]*var\(--sidebar-scrollbar\)/);
  });

  it("os tokens existem no tema claro e no escuro", () => {
    const [claro, escuro] = [css.indexOf(":root {"), css.indexOf(".dark {")].map((i) => css.slice(i, i + 4500));
    for (const t of [claro, escuro]) {
      expect(t).toMatch(/--scrollbar-thumb:\s*#[0-9A-Fa-f]{6}/);
      expect(t).toMatch(/--sidebar-scrollbar:\s*#[0-9A-Fa-f]{6}/);
    }
  });

  it("sem `::-webkit-scrollbar` nem seta", () => expect(css).not.toMatch(/::-webkit-scrollbar|scrollbar-button/));
});

describe("rolagem sem excesso (CA12)", () => {
  it("faixa de abas só rola na horizontal", () => {
    for (const f of ["ui/tabs.tsx", "../features/students/StudentRecordPanel.tsx"]) {
      expect(readFileSync(join(__dirname, f), "utf8"), f).toMatch(/role="tablist"[^\n]*overflow-x-auto overflow-y-hidden/);
    }
  });

  it("o menu rola só na lista; o rodapé fica fora dela", () => {
    const side = readFileSync(join(__dirname, "layout/Sidebar.tsx"), "utf8");
    expect(side).toMatch(/<nav[^>]*data-sidebar-scroll[^>]*overflow-y-auto/);
    expect(side).toMatch(/<\/nav>\s*<div className="flex flex-col gap-1 border-t/);
  });

  it("há fontes para varrer", () => expect(fontes(join(__dirname, "..")).length).toBeGreaterThan(50));
});
