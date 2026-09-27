import { mkdtemp, cp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
const root = process.cwd();
const target = process.env.OVIA_AUTH_TEST_DIR || await mkdtemp(path.join(tmpdir(), "ovia-auth-browser-"));
for (const name of ["src", "public", "tests"])
  await cp(path.join(root, name), path.join(target, name), { recursive: true });
for (const name of [
  "package.json",
  "tsconfig.json",
  "next-env.d.ts",
  "next.config.ts",
])
  await cp(path.join(root, name), path.join(target, name));
try { await symlink(
  path.join(root, "node_modules"),
  path.join(target, "node_modules"),
  "junction",
); } catch (error) { if (error.code !== "EEXIST") throw error; }
await writeFile(
  path.join(target, "playwright.config.ts"),
  `import { defineConfig } from '@playwright/test'; export default defineConfig({ testDir: './tests/browser', testMatch: 'recovery.spec.ts', timeout: 90000, expect: { timeout: 15000 }, workers: 1, use: { baseURL: 'http://localhost:3107', headless: true, channel: 'msedge' }, webServer: { command: 'node node_modules/next/dist/bin/next dev --webpack --port 3107', url: 'http://localhost:3107', reuseExistingServer: false, timeout: 120000 } });`,
);
const env = {
  ...process.env,
  MONGODB_URI: "",
  OVIA_AUTH_TEST_ISOLATED: "true",
  APP_ORIGIN: "http://localhost:3107",
  JWT_SECRET: "isolated-browser-test-secret-thirty-two-characters",
  EMAIL_API_KEY: "",
  EMAIL_FROM: "",
};
console.log(`Isolated browser fixture: ${target}`);
const args = process.argv.includes("--build")
  ? [path.join(root, "node_modules/next/dist/bin/next"), "build", "--webpack"]
  : [path.join(root, "node_modules/@playwright/test/cli.js"), "test"];
const child = spawn(process.execPath, args, {
  cwd: target,
  env,
  stdio: "inherit",
  windowsHide: true,
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
