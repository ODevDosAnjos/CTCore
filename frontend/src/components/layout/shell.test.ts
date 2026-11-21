import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { describe, expect, it } from "vitest";

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const pages = walk("src/features").filter((f) => /Page\.tsx$/.test(f));
const read = (f: string) => readFileSync(f, "utf8");

// RNF-43 (#675): a moldura é a rota-pai (ManagementShell/PortalShell); nenhuma tela a monta.
describe("moldura fixa na rota (CA9)", () => {
  it("encontra as páginas", () => {
    expect(pages.length).toBeGreaterThanOrEqual(45);
  });

  it.each(pages)("%s não importa nem monta a moldura", (f) => {
    expect(read(f)).not.toMatch(/ManagementLayout|PortalLayout/);
  });
});

// Telas da gestão (CA8 da #417): o título vem do PageHeader. Ficam de fora as telas de acesso, a pública, o portal (portalPages.test.ts) e as gavetas
// sobre a lista (painel da turma, do professor e da aula, e a ficha do Professor, #470 e #472): quem tem o título é a lista.
describe("telas da gestão (CA8)", () => {
  const management = pages.filter((f) => !new RegExp("features/(auth|payments|portal)/|(Class|Teacher)PanelPage|LessonPanelPage|TeacherRecordPage").test(f.split(sep).join("/")));
  it("encontra as telas da gestão", () => {
    expect(management.length).toBeGreaterThanOrEqual(25);
  });

  it.each(management)("%s usa PageHeader e nenhum <h1 próprio", (f) => {
    expect(read(f)).not.toContain("<h1");
    expect(read(f)).toContain("<PageHeader");
  });
});
