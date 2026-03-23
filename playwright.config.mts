import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./apps",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
  },
  webServer: [
    {
      command: "python3 -m http.server 4173 -d apps/docs/public",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "python3 -m http.server 4174 -d apps/example-basic/public",
      url: "http://127.0.0.1:4174",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
