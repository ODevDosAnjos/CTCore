import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// RNF-43: link interno é `Link` do roteador; `<a href="/...">` e window.location para rota interna recarregam a página.
const proibido = /href=(?:"\/(?!\/)|\{\s*["'`]\/)|window\.(?:history|location)\b/;

function arquivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === "test" ? [] : arquivos(p);
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [p] : [];
  });
}

describe("RNF-43: sem link interno que recarrega a página", () => {
  it("CA6: nenhum arquivo de produção usa <a href=\"/...\"> nem window.location para rota interna", () => {
    const achados = arquivos(join(process.cwd(), "src")).flatMap((f) =>
      readFileSync(f, "utf8").split("\n").flatMap((l, i) => (proibido.test(l) ? [`${f}:${i + 1}: ${l.trim()}`] : [])),
    );
    expect(achados).toEqual([]);
  });

  it("CA6: o padrão reprova <a href=\"/x\">", () => {
    expect(proibido.test('<a href="/x">x</a>')).toBe(true);
    expect(proibido.test("window.history.replaceState(null, '', u)")).toBe(true);
    expect(proibido.test("const q = window.location.search")).toBe(true);
    expect(proibido.test('<a href="#conteudo">x</a>')).toBe(false);
    expect(proibido.test('<a href="https://x.test">x</a>')).toBe(false);
  });
});
