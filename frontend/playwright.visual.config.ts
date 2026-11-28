import { defineConfig, devices } from "@playwright/test";

// D1: config própria, fora do `playwright test` do e2e. Referências só do container do CI (D2).
export default defineConfig({
  testDir: "./visual",
  testMatch: "**/*.visual.ts",
  snapshotDir: "./visual/referencias",
  snapshotPathTemplate: "{snapshotDir}/{arg}{ext}",
  forbidOnly: !!process.env.CI,
  retries: 0,
  fullyParallel: true,
  // #528: no CI usa 2 workers (2 dos 4 vCPUs do runner; o resto fica para o Vite e o navegador). 3 workers não ganharam de 2 (D9). Fora do CI, o padrão do Playwright.
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  expect: { toHaveScreenshot: { animations: "disabled", caret: "hide", maxDiffPixelRatio: 0, threshold: 0.05 } },
  use: { baseURL: "http://localhost:5174", reducedMotion: "reduce", locale: "pt-BR", timezoneId: "America/Sao_Paulo", ...devices["Desktop Chrome"], channel: "chromium", launchOptions: { args: ["--lang=pt-BR"] } },
  // #564: com a raster parcial do Chromium, dia-sem-aula-novo às vezes guarda um resíduo num pixel junto do anel de foco. Só ele roda sem ela.
  // O launchOptions do projeto substitui o do `use` geral, por isso repete --lang. Outro caso com o mesmo sintoma entra nas duas expressões.
  projects: [
    { name: "visual", grepInvert: / dia-sem-aula-novo / },
    { name: "visual-sem-raster-parcial", grep: / dia-sem-aula-novo /, use: { launchOptions: { args: ["--lang=pt-BR", "--disable-partial-raster"] } } },
  ],
  webServer: {
    command: "npm run dev -- --port 5174 --strictPort",
    url: "http://localhost:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
