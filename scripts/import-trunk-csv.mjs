import fs from "node:fs/promises";
import crypto from "node:crypto";

const rows = JSON.parse((await fs.readFile("csv-import-source.json", "utf8")).replace(/^\uFEFF/, ""));
const seen = new Set();
const products = [];
const failures = [];
await fs.mkdir("public/media/imported", { recursive: true });
for (const [index, row] of rows.entries()) {
  const name = row["Product Name"]?.trim();
  if (!name) continue;
  const asin = row["Product URL"]?.match(/\/dp\/([A-Z0-9]{10})/)?.[1];
  const key = asin || crypto.createHash("sha256").update(row["Product URL"] || name).digest("hex").slice(0, 12);
  if (seen.has(key)) continue;
  seen.add(key);
  const first = asin === "B0DN1FF366";
  const slug = first ? "mokobara-aisle-trunk-black" : `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80).replace(/-$/, "")}-${key.toLowerCase()}`;
  const image = `/media/imported/${first ? "mokobara-aisle-trunk-black" : key.toLowerCase()}.jpg`;
  const brand = row["Brand Name"]?.trim() || "Not provided";
  const colours = (row["Available Colors"] || "").split(/\\n|\n/).map(x => x.trim()).filter(Boolean);
  const dimensions = name.match(/\b\d+(?:\.\d+)?\s*cm\b/i)?.[0] || "Not provided";
  const capacity = name.match(/\b\d+(?:\.\d+)?\s*L\b/i)?.[0] || "Not provided";
  const material = /polycarbonate/i.test(name) ? "Polycarbonate" : /polypropylene/i.test(name) ? "Polypropylene" : /alumini?um/i.test(name) ? "Aluminium" : /ABS\b/.test(name) ? "ABS" : "Not provided";
  const specifications = { Brand: brand };
  for (const [label, value] of Object.entries(row)) if (value && !["Product Name", "Product Image", "Product URL", "Brand Name"].includes(label)) specifications[`Source ${label}`] = value.replaceAll("\\n", ", ");
  products.push({id:first?"imported-mokobara-aisle-trunk-black":`csv-${key.toLowerCase()}`,slug,name,collection:brand,department:"luggage",category:"Trunk",subcategory:"Trunk",material,description:name,dimensions,capacity,weight:"Not provided",tags:["trunk"],variants:[{sku:`CSV-TRUNK-${key}`,color:first?"Black":"As pictured",hex:"#333333",price:100,stock:0,image}],image,gallery:[image],imageKind:"photograph",featured:false,sourceId:key,sourceUrl:asin?`https://www.amazon.in/dp/${asin}`:row["Product URL"],currency:"INR",availability:"Stock not confirmed",specifications,features:name.split("|").slice(1).map(x=>x.trim()),searchTags:colours.join(", ")});
}
let cursor = 0;
await Promise.all(Array.from({length:6},async()=>{while(cursor<products.length){const product=products[cursor++];const row=rows.find(row=>row["Product URL"]?.includes(product.sourceId) || row["Product Name"]===product.name);const dest=`public${product.image}`;try{await fs.access(dest);continue;}catch{}try{const response=await fetch(row["Product Image"],{signal:AbortSignal.timeout(20000)});if(!response.ok||!response.headers.get("content-type")?.startsWith("image/"))throw Error(`HTTP ${response.status}`);const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>12000000)throw Error("Image too large");await fs.writeFile(dest,bytes);}catch(error){failures.push({name:product.name,error:error.message});product.image="";product.gallery=[];product.variants[0].image="";}}}));
await fs.writeFile("src/lib/imported-products.ts",`import type { Product } from "./catalog";\n// Imported from the supplied CSV. Source ratings, prices and delivery dates are\n// marketplace reference data, not OVIA reviews, stock or delivery promises.\nexport const importedProducts: Product[] = ${JSON.stringify(products,null,2)};\n`);
await fs.writeFile("csv-import-report.json",JSON.stringify({rows:rows.length,products:products.length,duplicates:rows.length-products.length,imageFailures:failures},null,2));
console.log(JSON.stringify({rows:rows.length,products:products.length,duplicates:rows.length-products.length,imageFailures:failures.length}));
