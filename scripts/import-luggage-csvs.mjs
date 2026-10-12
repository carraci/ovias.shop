import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const inputs = JSON.parse((await fs.readFile('data/luggage-csv-sources.json', 'utf8')).replace(/^\uFEFF/, ''));
const categories = ['Trunk', 'Check-In', 'Cabin', 'Luggage', 'Cabin Bags'];
const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const assetId = value => value?.match(/\/images\/I\/([^._/]+)/)?.[1] || value;
const money = value => Math.round(Number(String(value || '').replace(/[^\d.]/g, '')) * 100);
const palette = {black:'#222222', grey:'#777777', gray:'#777777', silver:'#c0c0c0', blue:'#2451a1', navy:'#152747', green:'#426346', yellow:'#e3c743', red:'#a32f35', pink:'#d4a5b3', purple:'#7a5a92', orange:'#dc7b30', brown:'#795d42', beige:'#c3b394', white:'#eeeeee', teal:'#347979', turquoise:'#4ba6aa', olive:'#6d7242', maroon:'#762936', champagne:'#cebba2', taupe:'#91877b'};
const legacyText = await fs.readFile('src/lib/imported-products.ts','utf8');
let originalText = legacyText;
try { originalText = await fs.readFile('data/import-backups/imported-products-before-2026-10-03-five-csvs.txt','utf8'); } catch {}
const legacy = JSON.parse(originalText.slice(originalText.indexOf('= [')+2).trim().replace(/;$/, ''));
let oldRows = [];
try { oldRows = JSON.parse((await fs.readFile('csv-import-source.json','utf8')).replace(/^\uFEFF/,'')); } catch {}
const legacyAssets = new Map(oldRows.map(row => [assetId(row['Product Image']), legacy.find(p => p.sourceId && row['Product URL']?.includes(p.sourceId))]).filter(([,p]) => p));
const products = new Map();
const report = { files: [], rows: 0, duplicates: 0, imageFailures: [], priceConflicts: [], missingPrices: [], mappings: categories };
for (const [index, input] of inputs.entries()) {
  let added = 0, duplicates = 0;
  for (const row of input.rows) {
    const title = (index === 3 ? row.data2 : row.data)?.trim();
    const brand = (index === 3 ? row.data : row.data2)?.trim();
    if (!title) throw new Error(`Missing title in ${input.file}: ${row.web_scraper_order}`);
    const name = brand && !title.toLowerCase().startsWith(brand.toLowerCase()) ? `${brand} ${title}` : title;
    const identity = name.toLowerCase().replace(/\s+/g,' ').trim();
    const hash = crypto.createHash('sha256').update(identity).digest('hex').slice(0,10);
    const category = categories[index];
    const existing = products.get(identity);
    const price = money(row.price);
    if (existing) {
      if (!existing.catalogCategories.includes(category)) existing.catalogCategories.push(category);
      existing.importSources.push({file:input.file,row:row.web_scraper_order,category});
      if (price && price !== existing.price) report.priceConflicts.push({name, first:existing.price, other:price, file:input.file});
      duplicates++; continue;
    }
    const colorNames = [...new Set([...title.matchAll(/\b(black|grey|gray|silver|blue|navy|green|yellow|red|pink|purple|orange|brown|beige|white|teal|turquoise|olive|maroon|champagne|taupe)\b/gi)].map(m => m[1].toLowerCase().replace('gray','grey')))];
    const color = colorNames.length ? colorNames.map(c => c[0].toUpperCase()+c.slice(1)).join(' & ') : 'As pictured';
    const material = /polypropylene/i.test(title) ? 'Polypropylene' : /polycarbonate|\bPC\b/i.test(title) ? 'Polycarbonate' : /alumini?um/i.test(title) ? 'Aluminium' : /\bABS\b/i.test(title) ? 'ABS' : /polyester/i.test(title) ? 'Polyester' : /nylon/i.test(title) ? 'Nylon' : /leather/i.test(title) ? 'Leather' : /canvas/i.test(title) ? 'Canvas' : '';
    const dimensions = title.match(/\b\d+(?:\.\d+)?\s*(?:[x×]\s*\d+(?:\.\d+)?\s*){2}cm\b/i)?.[0] || title.match(/\b\d+(?:\.\d+)?\s*cm\b/i)?.[0] || '';
    const capacity = title.match(/\b\d+(?:\.\d+)?\s*L\b/i)?.[0] || '';
    const weight = title.match(/\b\d+(?:\.\d+)?\s*kg\b/i)?.[0] || '';
    const slug = `ovia-${slugify(title.split('|')[0]).slice(0,70).replace(/-$/,'')}-${hash}`;
    const image = `/media/imported/ovia-${hash}.jpg`;
    const candidate = legacyAssets.get(assetId(row.image));
    const old = candidate && candidate.name.split('|')[0].toLowerCase().replace(/\s+/g,' ').trim() === name.split('|')[0].toLowerCase().replace(/\s+/g,' ').trim() ? candidate : undefined;
    if (!price) report.missingPrices.push({file:input.file,name});
    const product = {id:old?.id || `ovia-import-${hash}`, slug, slugAliases:[...(old ? [old.slug] : [])], name, collection:brand || 'OVIA', department:'luggage', category, subcategory:category, catalogCategories:[category], material, description:name, dimensions, capacity, weight, tags:[slugify(category), ...(category==='Cabin' || category==='Cabin Bags' ? ['short-trips'] : category==='Trunk'||category==='Check-In'?['long-haul','long-journeys']:[])], variants:[{sku:old?.variants[0]?.sku || `OVIA-${hash.toUpperCase()}`,color,hex:palette[colorNames[0]] || '#888888',price,stock:old?.variants[0]?.stock || 0,image}], image,gallery:[image],imageKind:'photograph',featured:false,price,currency:'INR',colors:colorNames.map(c=>c[0].toUpperCase()+c.slice(1)),specifications:{},features:title.split('|').slice(1).map(x=>x.trim()).filter(Boolean), availability:'Stock not confirmed',importSources:[{file:input.file,row:row.web_scraper_order,category}],sourceImage:row.image};
    products.set(identity, product); added++;
  }
  report.files.push({file:input.file,category:categories[index],rows:input.rows.length,newProducts:added,duplicates});
  report.rows += input.rows.length; report.duplicates += duplicates;
}
await fs.mkdir('public/media/imported', {recursive:true});
const list = [...products.values()];
let cursor = 0;
await Promise.all(Array.from({length:6}, async () => {
  while(cursor < list.length) {
    const product = list[cursor++];
    const dest = `public${product.image}`;
    try { await fs.access(dest); continue; } catch {}
    for (let attempt=0;attempt<2;attempt++) {
      try {
        if (!product.sourceImage?.startsWith('https://m.media-amazon.com/images/I/')) throw Error('Invalid source image URL');
        const res = await fetch(product.sourceImage, {signal:AbortSignal.timeout(25000)});
        if(!res.ok || !res.headers.get('content-type')?.startsWith('image/')) throw Error(`HTTP ${res.status}`);
        const bytes = Buffer.from(await res.arrayBuffer());
        if(bytes.length > 12000000 || bytes.length < 100) throw Error('Invalid image size');
        await fs.writeFile(dest,bytes); break;
      } catch(error) {
        if(attempt===1) report.imageFailures.push({name:product.name,error:error.message});
      }
    }
  }
}));
for (const product of list) delete product.sourceImage;
report.products = list.length;
report.categoryCounts = Object.fromEntries(categories.map(c=>[c,list.filter(p=>p.catalogCategories.includes(c)).length]));
await fs.mkdir('data/import-backups',{recursive:true});
const backup = 'data/import-backups/imported-products-before-2026-10-03-five-csvs.txt';
try { await fs.access(backup); } catch { await fs.writeFile(backup,legacyText); }
if(report.imageFailures.length || report.missingPrices.length) {
  await fs.writeFile('data/luggage-import-report.json',JSON.stringify(report,null,2));
  throw Error(`Import blocked: ${report.imageFailures.length} images and ${report.missingPrices.length} prices missing. Existing catalog preserved.`);
}
await fs.writeFile('src/lib/imported-products.ts', `import type { Product } from './catalog';\n// Imported from the five supplied CSVs. Category membership follows the supplied file mapping.\n// Prices are in paise. Marketplace availability and ratings are not OVIA stock or reviews.\nexport const importedProducts: Product[] = ${JSON.stringify(list,null,2)};\n`);
await fs.writeFile('data/luggage-import-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,imageFailures:report.imageFailures.length,priceConflicts:report.priceConflicts.length},null,2));

