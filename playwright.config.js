// End-to-end tests in Chromium with an iPhone 15 viewport, against tests/support/server.js
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "tests/e2e",
  timeout: 120000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:8800",
    ...devices["iPhone 15"],
    browserName: "chromium",
    locale: "nl-NL",
    timezoneId: "Europe/Amsterdam",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "node tests/support/server.js",
    url: "http://localhost:8800/index.html",
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
