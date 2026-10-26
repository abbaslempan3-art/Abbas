import { defineConfig } from "@playwright/test";

// Memory-only logic audit. Deliberately no webServer, browser/page fixtures or saved profile.
export default defineConfig({
  testDir: "./tests",
  testMatch: ["backup-audit.spec.ts", "backup-fix.spec.ts", "v3.spec.ts"],
  grep: /four-store audit:|persisted data takes precedence|empty exports and all-null|conflicting IDs or money|same backup is idempotent|invalid persisted data never|backup round trip retains|backup validation rejects|restore fails safely before journal/,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/backup-audit-report.json" }],
  ],
  outputDir: "test-results/backup-audit",
  timeout: 15000,
});
