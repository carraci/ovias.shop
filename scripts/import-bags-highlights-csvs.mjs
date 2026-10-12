import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const catalogPath = 'src/lib/imported-products.ts';
const baselinePath = 'data/import-backups/imported-products-before-highlights.txt';
const currentText = await fs.readFile(catalogPath,'utf8');
let baselineText;
try { baselineText = await fs.readFile(baselinePath,'utf8'); }
catch { baselineText = currentText; await fs.writeFile(baselinePath,currentText); }
const original = JSON.parse(baselineText.slice(baselineText.indexOf('= [')+2).trim().replace(/;$/,''));
const inputs = JSON.parse((await fs.readFile('data/bags-highlights-csv-sources.json','utf8')).replace(/^\uFEFF/,''));
const normalize = value => value.toLowerCase().replace(/\s+/g,' ').trim();
const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const palette = {black:'#222222',grey:'#777777',silver:'#c0c0c0',blue:'#2451a1',navy:'#152747',green:'#426346',yellow:'#e3c743',red:'#a32f35',pink:'#d4a5b3',purple:'#7a5a92',orange:'#dc7b30',brown:'#795d42',beige:'#c3b394',white:'#eeeeee',teal:'#347979',turquoise:'#4ba6aa',olive:'#6d7242',maroon:'#762936',champagne:'#cebba2',taupe:'#91877b'};
const travelTags = ['long-haul','long-journeys','short-trips','business-selection','business-bags'];
const products = new Map(original.map(p=>[p.id,{...p,tags:[...p.tags],variants:p.variants.map(v=>({...v})),catalogCategories:[...(p.catalogCategories || [p.category])],importSources:[...(p.importSources || [])]}]));
const report = {rows:0,newProducts:0,duplicates:0,files:[],imageFailures:[],priceDifferences:[],materialConflicts:[],missingPrices:[]};
const downloads = [];
for(const input of inputs) {
  const expectedTravel = input.file.includes('(16)')?'new-arrivals':input.file.includes('(17)')?'best-sellers':'everyday-mobility';
  const category = 'Bags';
  let added=0,existingCount=0;
  for(const row of input.rows) {
    const title=row.data?.trim();
    const explicitBrand = input.file.includes('(17)') ? '' : row.data2?.trim();
    const knownBrand = title?.match(/^(HAMMONDS FLYCATCHER|American Tourister|MOKOBARA|WENGER|BRAND LEATHER|IRHA|RARE RABBIT|VANDU|Arctic Hunter|F Gear|FUR JADEN|Skybags|Safari|Lavie Signature|Lavie|ZOUK|Tommy Hilfiger|Wildcraft)\b/i)?.[1];
    const brand = explicitBrand && !/^[\d().Kk,+\s]+$/.test(explicitBrand) ? explicitBrand : knownBrand || "";
    if(!title) throw Error(`Missing title: ${input.file} ${row.web_scraper_order}`);
    const name=brand&&!title.toLowerCase().startsWith(brand.toLowerCase())?`${brand} ${title}`:title;
    const asset = row.image?.match(/\/images\/I\/([^._/]+)/)?.[1] || '';
    const key=`bags|${normalize(name)}|${asset}`,hash=crypto.createHash('sha256').update(key).digest('hex').slice(0,10);
    const price=Math.round(Number((row.price || '').replace(/[^\d.]/g,''))*100);
    if(!price) report.missingPrices.push({name,file:input.file});
    const material=/faux leather|vegan leather|\bPU\b/i.test(title + ' ' + (row.title || ''))?'Faux Leather':/polypropylene|\bPP\b/i.test(title)?'Polypropylene':/polycarbonate|\bPC\b/i.test(title)?'Polycarbonate':/alumini?um/i.test(title)?'Aluminium':/\bABS\b/i.test(title)?'ABS':/polyester/i.test(title)?'Polyester':/nylon/i.test(title)?'Nylon':/leather/i.test(title)?'Leather':/canvas/i.test(title)?'Canvas':'';
    let product=products.get(key) || [...products.values()].find(p=>p.department==='bags' && normalize(p.name)===normalize(name) && p.id==='ovia-import-'+hash);
    if(!product) {
      const colors=[...new Set([...title.matchAll(/\b(black|grey|gray|silver|blue|navy|green|yellow|red|pink|purple|orange|brown|beige|white|teal|turquoise|olive|maroon|champagne|taupe)\b/gi)].map(m=>m[1].toLowerCase().replace('gray','grey')))];
      const color=colors.length?colors.map(c=>c[0].toUpperCase()+c.slice(1)).join(' & '):'As pictured';
      const dimensions=title.match(/\b\d+(?:\.\d+)?\s*(?:[x×]\s*\d+(?:\.\d+)?\s*){2}cm\b/i)?.[0] || title.match(/\b\d+(?:\.\d+)?\s*cm\b/i)?.[0] || '';
      
      const slug=`ovia-${slugify(title.split('|')[0]).slice(0,70).replace(/-$/,'')}-${hash}`;
      const image=`/media/imported/ovia-${hash}.jpg`;
      product={id:`ovia-import-${hash}`,slug,slugAliases:[],name,collection:brand || 'OVIA',department:'bags',category,subcategory:category,catalogCategories:[category],material,description:name,dimensions,capacity:title.match(/\b\d+(?:\.\d+)?\s*L\b/i)?.[0] || '',weight:title.match(/\b\d+(?:\.\d+)?\s*kg\b/i)?.[0] || '',tags:[slugify(category)],travelTypes:[],variants:[{sku:`OVIA-${hash.toUpperCase()}`,color,hex:palette[colors[0]] || '#888888',price,stock:0,image}],image,gallery:[image],imageKind:'photograph',featured:false,price,priceOnRequest:!price,currency:'INR',colors:colors.map(c=>c[0].toUpperCase()+c.slice(1)),specifications:{},features:title.split('|').slice(1).map(x=>x.trim()).filter(Boolean),availability:'Stock not confirmed',importSources:[]};
      products.set(product.id,product);downloads.push({product,url:row.image});added++;report.newProducts++;
    } else {
      existingCount++;report.duplicates++;
      if(price!==product.price)report.priceDifferences.push({name,existing:product.price,incoming:price,file:input.file});
      if(material) {
        if(product.material && product.material!==material)report.materialConflicts.push({name,existing:product.material,incoming:material});
        else product.material=material;
      }
    }
    product.catalogCategories ||= [product.category];
    const assigned=['Bags'];
    if(/shoulder/i.test(title)) assigned.push('Shoulder Bags');
    if(/hand[ -]?carry|handbag|hand bag|top[ -]?handle|handheld/i.test(title)) assigned.push('Hand Carry');
    if(/tote/i.test(title)) assigned.push('Totes');
    if(/travel|weekend|overnight|duff[el]+/i.test(title)) assigned.push('Travel Bags');
    if(/cabin|carry[ -]?on/i.test(title)) assigned.push('Cabin Bags');
    for(const label of assigned) if(!product.catalogCategories.includes(label))product.catalogCategories.push(label);
    if(expectedTravel&&!product.tags.includes(expectedTravel))product.tags.push(expectedTravel);
    product.importSources.push({file:input.file,row:row.web_scraper_order,category});
    report.rows++;
  }
  report.files.push({file:input.file,category,rows:input.rows.length,newProducts:added,existingProducts:existingCount});
}
let cursor=0;
await Promise.all(Array.from({length:6},async()=>{
 while(cursor<downloads.length) {
  const {product,url}=downloads[cursor++];const dest=`public${product.image}`;
  try{await fs.access(dest);continue;}catch{}
  for(let attempt=0;attempt<2;attempt++)try{
    if(!url?.startsWith('https://m.media-amazon.com/images/I/'))throw Error('Invalid image source');
    const response=await fetch(url,{signal:AbortSignal.timeout(25000)});
    if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw Error(`HTTP ${response.status}`);
    const bytes=Buffer.from(await response.arrayBuffer());
    if(bytes.length<100||bytes.length>12000000)throw Error('Invalid image size');
    await fs.writeFile(dest,bytes);break;
  }catch(e){if(attempt===1)report.imageFailures.push({name:product.name,error:e.message});}
 }
}));
const list=[...products.values()];
for(const p of list.filter(p=>p.department==='bags')) {
 p.catalogCategories ||= [p.category];
 const title=p.name;
 for(const [label,pattern] of [['Bags',/./],['Shoulder Bags',/shoulder/i],['Hand Carry',/hand[ -]?carry|handbag|hand bag|top[ -]?handle|handheld/i],['Travel Bags',/travel|weekend|overnight|duff[el]+/i],['Cabin Bags',/cabin|carry[ -]?on/i]]) if(pattern.test(title)&&!p.catalogCategories.includes(label))p.catalogCategories.push(label);
}
report.totalProducts=list.length;
report.collectionCounts=Object.fromEntries(['new-arrivals','best-sellers','everyday-mobility'].map(tag=>[tag,list.filter(p=>p.tags.includes(tag)).length]));
report.categoryCounts=Object.fromEntries(['Shoulder Bags','Hand Carry','Bags','Totes','Travel Bags','Cabin Bags'].map(category=>[category,list.filter(p=>p.department==='bags'&&p.catalogCategories.includes(category)).length]));
report.materialCounts=Object.fromEntries(['Polycarbonate','Polypropylene'].map(material=>[material,list.filter(p=>p.material===material).length]));
await fs.writeFile('data/bags-highlights-import-report.json',JSON.stringify(report,null,2));
if(report.imageFailures.length||report.materialConflicts.length)throw Error('Import validation failed; current catalog preserved.');
await fs.writeFile(catalogPath,`import type { Product } from './catalog';\n// Imported luggage and bags with source-assigned categories and travel collections.\n// Prices are in paise; source reviews and availability are not OVIA stock or reviews.\nexport const importedProducts: Product[] = ${JSON.stringify(list,null,2)};\n`);
console.log(JSON.stringify({...report,priceDifferences:report.priceDifferences.length},null,2));
