import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function test() {
  const url = "https://www.rimowa.com/on/demandware.static/-/Sites-rimowa-master-catalog-final/default/dwf3976cb9/images/medium/92553004_1.png";
  const destDir = path.join(process.cwd(), "public", "uploads", "products", "luggage", "cabin");
  await mkdir(destDir, { recursive: true });

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": "https://www.rimowa.com/"
    }
  });
  console.log("Fetch status:", res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  const webp = await sharp(buf).webp({ quality: 88 }).toBuffer();
  const filePath = path.join(destDir, "ovia-cabin-001-main.webp");
  await writeFile(filePath, webp);
  console.log("Written successfully:", filePath, "size:", webp.length);
}

test().catch(console.error);
