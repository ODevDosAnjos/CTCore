import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { casos, semCaso } from "./casos";
// @ts-expect-error módulo .mjs sem tipos, compartilhado com scripts/visual-canvas.mjs
import { LIMITE_PADRAO } from "./comparar.mjs";

const indice: { arquivo: string; pagina: string; largura: number }[] = JSON.parse(readFileSync("../docs/design/canvas/indice.json", "utf8"));
const nomeTela = (t: { arquivo: string }) => t.arquivo.replace(".dc.html", "");
const telas = new Set(indice.map(nomeTela));
const larguraDe = new Map(indice.map((t) => [nomeTela(t), t.largura]));
const app = readFileSync("src/App.tsx", "utf8");
const mapa = readFileSync("src/routes.ts", "utf8"); // lido como texto: importar `src` traria os tipos de DOM ao projeto do e2e (typecheck)
// As rotas vêm do App (telas públicas) e do mapa de rotas (RNF-43, `src/routes.ts`).
const paths = [...[...app.matchAll(/<Route path="([^"]+)/g)].map((m) => m[1]), ...[...mapa.matchAll(/"(\/[^"]*)"/g)].map((m) => m[1])];
const casa = (rota: string) =>
  paths.some((p) => p === "*" || new RegExp(`^${p.replace(/\/:\w+\??/g, "(/[^/]+)?")}/?$`).test(rota.split("?")[0]));

describe("casos do teste visual", () => {
  it("nomes únicos", () => expect(new Set(casos.map((c) => c.nome)).size).toBe(casos.length));
  it.each(casos)("$nome: canvas existe e rota está em App.tsx", (c) => {
    for (const nome of [c.canvas, c.canvasEscuro, c.canvasCelular]) if (nome) expect(telas.has(nome)).toBe(true);
    expect(casa(c.rota)).toBe(true);
  });
  it("canvasCelular é tela de 390 px", () => {
    for (const c of casos) {
      if (c.canvasCelular) expect(larguraDe.get(c.canvasCelular), c.nome).toBe(390);
    }
  });
  it("limiteCanvas é por largura comparada, acima do padrão, com motivo e issue (#714)", () => {
    for (const c of casos.filter((c) => c.limiteCanvas)) {
      const { motivo, ...limites } = c.limiteCanvas!;
      expect(Object.keys(limites).length, c.nome).toBeGreaterThan(0);
      for (const [largura, valor] of Object.entries(limites)) {
        expect(["1440", "390"], c.nome).toContain(largura);
        expect(largura === "390" ? c.canvasCelular : c.canvas, `${c.nome} não compara ${largura}`).toBeTruthy();
        expect(valor, c.nome).toBeGreaterThan(LIMITE_PADRAO);
        expect(valor, c.nome).toBeLessThanOrEqual(1);
      }
      expect(motivo, c.nome).toMatch(/#[0-9]+/);
    }
  });
  it("toda tela de gestão e portal do canvas tem caso ou está em semCaso com motivo", () => {
    const usadas = new Set(casos.flatMap((c) => [c.canvas, c.canvasEscuro, c.canvasCelular]).filter(Boolean));
    const excecoes = new Set(Object.values(semCaso).flat());
    expect(Object.keys(semCaso).every((m) => m.trim() !== "")).toBe(true);
    const escopo = indice.filter((t) => /^(Desktop|Celular) · (Gestão|Portal do aluno)$/.test(t.pagina)).map(nomeTela);
    expect(escopo.filter((n) => !usadas.has(n) && !excecoes.has(n))).toEqual([]);
    expect([...excecoes].filter((n) => !telas.has(n))).toEqual([]);
    expect([...excecoes].filter((n) => usadas.has(n))).toEqual([]);
  });
});
