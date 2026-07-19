import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  use: { baseURL: "http://localhost:8137" },
  webServer: {
    command: "python3 -m http.server 8137",
    port: 8137,
    reuseExistingServer: true,
  },
});
