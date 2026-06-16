import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
  webServer: [
    {
      command: 'cd ../api && npx nest start --watch',
      url: 'http://localhost:3001/api/v1/auth/me',
      timeout: 30000,
      reuseExistingServer: true,
    },
    {
      command: 'npx next dev',
      url: 'http://localhost:3000',
      timeout: 30000,
      reuseExistingServer: true,
    },
  ],
});
