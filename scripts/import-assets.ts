/** Run only against a manifest whose licenses and product mapping you reviewed. */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
const schema = z.array(
  z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    url: z.url(),
    sourcePage: z.url(),
    author: z.string().min(1),
    license: z.string().min(1),
    licenseUrl: z.url(),
    permissionEvidence: z.string().min(1),
    approved: z.boolean(),
    productMatches: z.boolean(),
    attribution: z.string(),
  }),
);
const allowed = new Set(["images.unsplash.com", "res.cloudinary.com"]);
async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath)
    throw new Error(
      "Usage: npm run assets:import -- manifest.json [--dry-run]",
    );
  const entries = schema.parse(
    JSON.parse(await readFile(manifestPath, "utf8")),
  );
  const dryRun = process.argv.includes("--dry-run");
  const output = path.resolve("public/media/imported");
  const results = [];
  for (const asset of entries) {
    try {
      const url = new URL(asset.url);
      if (!asset.approved || !asset.productMatches) {
        results.push({
          id: asset.id,
          status: "skipped",
          reason: "Approval and truthful product mapping are required.",
        });
        continue;
      }
      if (
        url.protocol !== "https:" ||
        !allowed.has(url.hostname) ||
        url.port ||
        url.username ||
        url.password
      )
        throw new Error("Source host is not allowed.");
      if (dryRun) {
        results.push({ id: asset.id, status: "ready" });
        continue;
      }
      const response = await fetch(url, {
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const type = response.headers.get("content-type")?.split(";")[0];
      const ext =
        type === "image/jpeg"
          ? "jpg"
          : type === "image/png"
            ? "png"
            : type === "image/webp"
              ? "webp"
              : null;
      if (!ext) throw new Error("Unsupported image format.");
      if (Number(response.headers.get("content-length") || 0) > 8_000_000)
        throw new Error("Image exceeds size limit.");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Empty response.");
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 8_000_000) {
          await reader.cancel();
          throw new Error("Image exceeds size limit.");
        }
        chunks.push(value);
      }
      const data = Buffer.concat(chunks);
      const valid =
        ext === "jpg"
          ? data[0] === 255 && data[1] === 216
          : ext === "png"
            ? data
                .subarray(0, 8)
                .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            : data.toString("ascii", 0, 4) === "RIFF" &&
              data.toString("ascii", 8, 12) === "WEBP";
      if (!valid) throw new Error("File signature does not match image type.");
      const sha256 = createHash("sha256").update(data).digest("hex");
      await mkdir(output, { recursive: true });
      const name = `${asset.id}-${sha256.slice(0, 12)}.${ext}`;
      await writeFile(path.join(output, name), data);
      await writeFile(
        path.join(output, `${name}.provenance.json`),
        JSON.stringify(
          { ...asset, sha256, acquiredAt: new Date().toISOString() },
          null,
          2,
        ),
      );
      results.push({
        id: asset.id,
        status: "imported",
        file: `/media/imported/${name}`,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (e) {
      results.push({
        id: asset.id,
        status: "failed",
        reason: (e as Error).message,
      });
    }
  }
  console.log(JSON.stringify(results, null, 2));
  if (results.some((r) => r.status === "failed")) process.exitCode = 1;
}
main().catch((e) => {
  console.error((e as Error).message);
  process.exitCode = 1;
});
