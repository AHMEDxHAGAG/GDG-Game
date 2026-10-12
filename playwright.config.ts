import { defineConfig, devices, type Project } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

// Match the production build's dotenv loading, including .env.local.
loadEnvConfig(process.cwd(), false);

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

/*
 * Two servers, because there are two kinds of test.
 *
 * The default one runs the developer's real `.env.local`, so the specs assert
 * what the event actually ships. The project-less one exists solely for
 * `teams.no-project.spec.ts`, which tests the *absence* of a Supabase project:
 * `NEXT_PUBLIC_SUPABASE_*` is inlined at build time, so "no project" cannot be
 * simulated by unsetting it in the browser — the server has to be built without
 * it in the first place. Without this second server those checks pass only for
 * developers who have not filled in their env yet, and silently stop testing
 * the branch they exist to cover.
 */
const NO_PROJECT_PORT = Number(process.env.E2E_NO_PROJECT_PORT ?? 3200);
const noProjectURL = `http://127.0.0.1:${NO_PROJECT_PORT}`;

const VIEWPORTS: Project[] = [
  { name: 'mobile', use: { ...devices['Pixel 7'] } },
  { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
];

/**
 * End-to-end configuration for the pirate expedition.
 *
 * Runs against a production build (`next build && next start`) so the specs
 * exercise what the event actually ships, not the dev server. Two viewports
 * cover the sizes the plan cares about: a narrow phone and a desktop projector.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Every spec except the two that need their own environment: the
    // unconfigured-branch checks, and the screenshot harness, which is a tool
    // rather than a test — it writes files and asserts nothing.
    ...VIEWPORTS.map((project) => ({
      ...project,
      testIgnore: [/(^|\/)(teams\.no-project|shoot-cards)\.spec\.ts$/],
    })),
    {
      name: 'no-project-mobile',
      testMatch: /teams\.no-project\.spec\.ts/,
      use: { ...devices['Pixel 7'], baseURL: noProjectURL },
    },
    {
      name: 'no-project-desktop',
      testMatch: /teams\.no-project\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: noProjectURL },
    },
  ],

  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  /*
   * Playwright manages one `webServer`, so the project-less build is started by
   * the `test:e2e` script in package.json — that script boots it, waits for it,
   * runs the suite, and shuts it down along with its alternate build output.
   */
});
