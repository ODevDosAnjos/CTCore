/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { proxy: { "/api": "http://localhost:8080" } },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    maxWorkers: 6, // #519: com o padrao (11 de 12 nucleos) a suite levava 683-734 s e 2 a 4 testes estouravam; com 6, 730-766 s e 0 a 1 falha
    testTimeout: 20000, // jsdom com userEvent fica lento com a máquina carregada
    css: true,
    exclude: ["e2e/**", "node_modules/**"], // e2e é do Playwright (visual/*.visual.ts não casa com *.test.*)
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.*", "src/test/**", "src/main.tsx", "src/mocks/browser.ts"],
      // RNF-37: 80% de linhas no total; 100% nas pastas das regras de cobrança (billing e charges), pagamentos,
      // assinatura e inativação (billing, subscription e deactivation sem efeito até existirem arquivos nelas).
      thresholds: {
        lines: 80,
        "src/features/billing/**": { lines: 100 },
        "src/features/charges/**": { lines: 100 },
        "src/features/payments/**": { lines: 100 },
        "src/features/subscription/**": { lines: 100 },
        "src/features/deactivation/**": { lines: 100 },
      },
    },
  },
});
