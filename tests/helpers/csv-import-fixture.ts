import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import type { Product } from "../../src/lib/catalog";

/** Run the real historical importer against committed CSV evidence without changing the storefront. */
export async function csvImportFixture(name: "luggage" | "luggage-travel" | "bags" | "bags-more" | "bags-highlights"): Promise<Product[]> {
  const source = await fs.readFile(`scripts/import-${name}-csvs.mjs`, "utf8");
  const writes = new Map<string, string>();
  const root = process.cwd();
  const readablePath = (file: string) => {
    const absolute = path.resolve(root, file);
    if (!absolute.startsWith(root + path.sep)) throw new Error("Fixture file is outside the repository.");
    return absolute;
  };
  const fixtureFs = {
    readFile: (file: string, encoding: "utf8") => {
      // This optional local mapping is ignored by Git and absent on a clean CI checkout.
      if (file === "csv-import-source.json") throw Object.assign(new Error("Optional local mapping is unavailable."), { code: "ENOENT" });
      return fs.readFile(readablePath(file), encoding);
    },
    access: (file: string) => fs.access(readablePath(file)),
    mkdir: async () => undefined,
    writeFile: async (file: string, contents: string) => { writes.set(file, contents); },
  };
  // The script's imports are replaced only with this read-only fixture filesystem.
  // Missing committed images fail import validation; unit tests never download them.
  const body = source.replace(/^import .+;\r?\n/gm, "");
  const run = new Function("fs", "crypto", "fetch", "console", `return (async () => {${body}\n})();`);
  await run(fixtureFs, crypto, () => { throw new Error("CSV fixture cannot make network requests."); }, { log: () => undefined });
  const generated = writes.get("src/lib/imported-products.ts");
  if (!generated) throw new Error("Importer did not produce a validated catalog.");
  return JSON.parse(generated.slice(generated.indexOf("= [") + 2).trim().replace(/;$/, ""));
}
