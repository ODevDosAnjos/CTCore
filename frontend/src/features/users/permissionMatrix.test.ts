import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import ptBR from "@/i18n/pt-BR.json";
import { MATRIX } from "./permissionMatrix";

// CSV do back-end (#27): permission,COORDINATOR,ADMINISTRATOR,TEACHER
const csv = readFileSync(resolve(process.cwd(), "../backend/src/test/resources/permission-table.csv"), "utf8")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((l) => l.split(","));
const rows = ptBR.permissionsTable.rows as Record<string, Record<string, string>>;

describe("permissionMatrix", () => {
  it("CA8: tem as 28 linhas do canvas, cada uma com os textos das três colunas", () => {
    expect(MATRIX).toHaveLength(28);
    for (const r of MATRIX) {
      for (const k of ["label", "COORDINATOR", "ADMINISTRATOR", "TEACHER"]) expect(rows[r.id]?.[k], `${r.id}.${k}`).toBeTruthy();
    }
  });

  it("CA9: nível e escopo de cada perfil batem com o CSV do back-end nas linhas que o servidor conhece", () => {
    const byKey = new Map(csv.map(([k, ...g]) => [k, g]));
    for (const r of MATRIX) {
      for (const key of r.keys) expect(r.grants, `${r.id} (${key})`).toEqual(byKey.get(key));
    }
  });

  it("CA9: nenhuma permissão do servidor fica fora da matriz", () => {
    const covered = new Set(MATRIX.flatMap((r) => r.keys));
    expect(csv.map(([k]) => k).filter((k) => !covered.has(k))).toEqual([]);
  });

  it("CA9: permissão do Professor que depende da unidade aparece com asterisco no texto", () => {
    for (const r of MATRIX) expect(r.grants[2].includes("#"), r.id).toBe(rows[r.id].TEACHER.includes("*"));
  });
});
