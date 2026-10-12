import { spawn } from "node:child_process";
const children = [];
let stopping = false;
function launch(args) {
  const child = spawn(process.execPath, args, {
    stdio: "inherit",
    windowsHide: true,
    env: process.env,
  });
  children.push(child);
  return child;
}
const app = launch([
  "node_modules/next/dist/bin/next",
  "dev",
  "--hostname",
  "0.0.0.0",
]);
app.on("exit", (code) => {
  if (!stopping) {
    stopping = true;
    for (const child of children) if (child !== app) child.kill();
    process.exitCode = code || 0;
  }
});
if (process.env.MONGODB_URI && process.env.JWT_SECRET?.length >= 32) {
  const port = process.env.SUPPORT_REALTIME_PORT || "3001";
  let existing = false;
  try {
    const response = await fetch("http://localhost:" + port, {
      signal: AbortSignal.timeout(1000),
    });
    const health = await response.json();
    existing = health.service === "ovia-support";
  } catch {
    /* Start the worker when this project's service is not already running. */
  }
  if (!existing) {
    const worker = launch(["scripts/support-realtime.mjs"]);
    worker.on("exit", (code) => {
      if (!stopping && code)
        console.error(
          "Support Socket.IO worker stopped. Polling remains available.",
        );
    });
  }
}
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
