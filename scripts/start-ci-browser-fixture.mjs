import { cp, symlink, mkdir, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import { startDemoProviders } from "./demo-provider-fixture.mjs";

const root = process.cwd();
if (!process.env.MONGODB_URI) throw new Error("Browser CI requires an isolated Mongo replica set connection.");
const port = Number(process.env.OVIA_TEST_PORT || "3128");
const origin = process.env.OVIA_TEST_BASE_URL || `http://localhost:${port}`;
const address = new URL(origin);
if (address.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(address.hostname) || Number(address.port) !== port) throw new Error("Browser tests require the configured loopback port.");
const database = `ovia_verification_${Date.now()}_${randomBytes(6).toString("hex")}`;
const directory = await mkdtemp(path.join(tmpdir(), "ovia-ci-browser-"));
const client = await new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 }).connect();
const db = client.db(database);
let child, providers, stopping;
const stop = () => stopping ||= (async () => {
  child?.kill("SIGTERM");
  providers?.server.close();
  // Drop only the database created by this process; never use the caller's MONGODB_DB.
  if (!/^ovia_verification_\d+_[a-f0-9]{12}$/.test(database)) throw new Error("Unsafe verification database name.");
  await db.dropDatabase();
  await client.close();
  const absolute = path.resolve(directory);
  if (path.dirname(absolute) !== path.resolve(tmpdir()) || !path.basename(absolute).startsWith("ovia-ci-browser-")) throw new Error("Unsafe temporary fixture directory.");
  // Next may briefly retain file handles while closing; the OS can clean the temp copy later.
  await rm(absolute, { recursive: true, force: true }).catch(() => undefined);
})();
try {
  for (const name of ["src", "data"]) await cp(path.join(root, name), path.join(directory, name), { recursive: true });
  for (const name of ["package.json", "tsconfig.json", "next-env.d.ts", "next.config.ts"]) await cp(path.join(root, name), path.join(directory, name));
  for (const name of ["public", "node_modules"]) await symlink(path.join(root, name), path.join(directory, name), process.platform === "win32" ? "junction" : "dir");
  const catalogModule = await import("../src/lib/catalog.ts");
  const products = catalogModule.products || catalogModule.default?.products;
  if (!Array.isArray(products) || !products.length) throw new Error("Browser fixture requires the public catalog.");
  const now = new Date().toISOString();
  const fixtureProduct = {
    ...products[0], id: "ci-verification-backpack", slug: "ci-verification-backpack", name: "CI Verification Backpack", collection: "CI Verification", department: "bags", category: "Backpacks", subcategory: "Backpacks", catalogCategories: ["Backpacks"], tags: ["backpacks"], material: "Nylon", description: "Disposable browser verification product.", image: "/media/cat-backpacks.jpg", imageKind: "photograph", gallery: ["/media/cat-backpacks.jpg"], colors: ["Black", "Blue"],
    variants: [{ sku: "CI-VERIFY-BLACK", color: "Black", hex: "#202020", price: 199900, stock: 100, image: "/media/cat-backpacks.jpg" }, { sku: "CI-VERIFY-BLUE", color: "Blue", hex: "#334477", price: 219900, stock: 100, image: "/media/cat-backpacks.jpg" }], price: 199900, catalogOrder: -1, storefrontPublished: true, status: "Published", availability: "In stock", createdAt: now,
  };
  await db.collection("products").insertMany([...products, fixtureProduct]);
  providers = await startDemoProviders({ resetLimits: async () => {
    if (!database.startsWith("ovia_verification_")) throw new Error("Unsafe fixture namespace.");
    await db.collection("limits").deleteMany({});
  } });
  const env = Object.fromEntries(["PATH", "Path", "SystemRoot", "WINDIR", "TEMP", "TMP", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "COMSPEC", "HOME"].filter(key => process.env[key]).map(key => [key, process.env[key]]));
  Object.assign(env, { MONGODB_URI: process.env.MONGODB_URI, MONGODB_DB: database, APP_ORIGIN: origin, JWT_SECRET: "ci-browser-verification-only-signing-key-at-least-32-chars", PAYMENT_PROVIDER: "demo", ALLOW_DEMO_CHECKOUT: "true", EMAIL_API_KEY: "test-only-provider-key", EMAIL_FROM: "OVIA CI <verification@example.test>", CONTACT_EMAIL: "support@example.test", SUPPORT_INBOX_EMAIL: "support@example.test", OVIA_BUILD_DIR: ".next-ci-browser", OVIA_DEMO_FIXTURE_ORIGIN: providers.origin, NODE_OPTIONS: `--import=${pathToFileURL(path.join(root, "scripts/demo-provider-preload.mjs")).href}` });
  await mkdir(path.join(root, "artifacts/ci-browser"), { recursive: true });
  await writeFile(path.join(root, "artifacts/ci-browser/environment.json"), JSON.stringify({ origin, database, directory, providers: providers.origin, product: { slug: fixtureProduct.slug, name: fixtureProduct.name, sku: "CI-VERIFY-BLUE" } }, null, 2));
  console.log(`Isolated browser fixture: ${origin}, database ${database}`);
  child = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "dev", "--webpack", "--hostname", address.hostname, "--port", String(port)], { cwd: directory, env, stdio: "inherit", windowsHide: true });
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => void stop().then(() => process.exit(0), () => process.exit(1)));
  child.on("error", () => void stop().finally(() => { process.exitCode = 1; }));
  child.on("exit", code => void stop().finally(() => { process.exitCode = code || 0; }));
} catch (error) { await stop(); throw error; }
