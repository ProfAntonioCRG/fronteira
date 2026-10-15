import { defineConfig } from "@playwright/test";

const production = process.env.PW_PRODUCTION === "1";
const url = production ? "http://localhost:4173" : "http://127.0.0.1:5173";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  timeout: 45000,
  expect: { timeout: 10000 },
  use: {
    baseURL: url,
    viewport: { width: 1366, height: 768 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: production ? "node tools/servidor-local.mjs" : "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort",
    url,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});