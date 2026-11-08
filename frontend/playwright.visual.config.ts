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
  expect: { toHaveScreenshot: { animations: "disabled", caret: "hide", maxDiffPixelRatio: 0.001 } },
  use: { baseURL: "http://localhost:5174", locale: "pt-BR", timezoneId: "America/Sao_Paulo", ...devices["Desktop Chrome"], channel: "chromium", launchOptions: { args: ["--lang=pt-BR"] } },
  projects: [{ name: "visual" }],
  webServer: {
    command: "npm run dev -- --port 5174 --strictPort",
    url: "http://localhost:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
