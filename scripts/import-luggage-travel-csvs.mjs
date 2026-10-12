import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const catalogPath = 'src/lib/imported-products.ts';
const baselinePath = 'data/import-backups/imported-products-before-travel-favourites.txt';
const currentText = await fs.readFile(catalogPath,'utf8');
let baselineText;
try { baselineText = await fs.readFile(baselinePath,'utf8'); }
catch { baselineText = currentText; await fs.writeFile(baselinePath,currentText); }
const original = JSON.parse(baselineText.slice(baselineText.indexOf('= [')+2).trim().replace(/;$/,''));
const inputs = JSON.parse((await fs.readFile('data/luggage-travel-csv-sources.json','utf8')).replace(/^\uFEFF/,''));
const normalize = value => value.toLowerCase().replace(/\s+/g,' ').trim();
const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const palette = {black:'#222222',grey:'#777777',silver:'#c0c0c0',blue:'#2451a1',navy:'#152747',green:'#426346',yellow:'#e3c743',red:'#a32f35',pink:'#d4a5b3',purple:'#7a5a92',orange:'#dc7b30',brown:'#795d42',beige:'#c3b394',white:'#eeeeee',teal:'#347979',turquoise:'#4ba6aa',olive:'#6d7242',maroon:'#762936',champagne:'#cebba2',taupe:'#91877b'};
const travelTags = ['long-haul','long-journeys','short-trips','business-selection','business-bags'];
const products = new Map(original.map(p=>[normalize(p.name),{...p,travelTypes:[],tags:p.tags.filter(tag=>!travelTags.includes(tag)),variants:p.variants.map(v=>({...v})),importSources:[...(p.importSources || [])]}]));
const report = {rows:0,newProducts:0,duplicates:0,files:[],imageFailures:[],priceDifferences:[],materialConflicts:[],missingPrices:[]};
const downloads = [];
for(const input of inputs) {
  const expectedTravel = input.travelType || '';
  let added=0,existingCount=0;
  for(const row of input.rows) {
    const title=row.data?.trim(),brand=row.data2?.trim();
    if(!title) throw Error(`Missing title: ${input.file} ${row.web_scraper_order}`);
    const name=brand&&!title.toLowerCase().startsWith(brand.toLowerCase())?`${brand} ${title}`:title;
    const key=normalize(name),hash=crypto.createHash('sha256').update(key).digest('hex').slice(0,10);
    const price=Math.round(Number((row.price || '').replace(/[^\d.]/g,''))*100);
    if(!price) report.missingPrices.push({name,file:input.file});
    const material=/polypropylene|\bPP\b/i.test(title)?'Polypropylene':/polycarbonate|\bPC\b/i.test(title)?'Polycarbonate':/alumini?um/i.test(title)?'Aluminium':/\bABS\b/i.test(title)?'ABS':/polyester/i.test(title)?'Polyester':/nylon/i.test(title)?'Nylon':/leather/i.test(title)?'Leather':/canvas/i.test(title)?'Canvas':'';
    let product=products.get(key);
    if(!product) {
      const colors=[...new Set([...title.matchAll(/\b(black|grey|gray|silver|blue|navy|green|yellow|red|pink|purple|orange|brown|beige|white|teal|turquoise|olive|maroon|champagne|taupe)\b/gi)].map(m=>m[1].toLowerCase().replace('gray','grey')))];
      const color=colors.length?colors.map(c=>c[0].toUpperCase()+c.slice(1)).join(' & '):'As pictured';
      const dimensions=title.match(/\b\d+(?:\.\d+)?\s*(?:[x×]\s*\d+(?:\.\d+)?\s*){2}cm\b/i)?.[0] || title.match(/\b\d+(?:\.\d+)?\s*cm\b/i)?.[0] || '';
      const category=/trunk/i.test(title)?'Trunk':/check[ -]?in/i.test(title)?'Check-In':/cabin|carry[ -]?on/i.test(title)?'Cabin':/backpack|duff[el]+|weekend/i.test(title)?'Cabin Bags':'Luggage';
      const slug=`ovia-${slugify(title.split('|')[0]).slice(0,70).replace(/-$/,'')}-${hash}`;
      const image=`/media/imported/ovia-${hash}.jpg`;
      product={id:`ovia-import-${hash}`,slug,slugAliases:[],name,collection:brand || 'OVIA',department:'luggage',category,subcategory:category,catalogCategories:[category],material,description:name,dimensions,capacity:title.match(/\b\d+(?:\.\d+)?\s*L\b/i)?.[0] || '',weight:title.match(/\b\d+(?:\.\d+)?\s*kg\b/i)?.[0] || '',tags:[slugify(category)],travelTypes:[],variants:[{sku:`OVIA-${hash.toUpperCase()}`,color,hex:palette[colors[0]] || '#888888',price,stock:0,image}],image,gallery:[image],imageKind:'photograph',featured:false,price,priceOnRequest:!price,currency:'INR',colors:colors.map(c=>c[0].toUpperCase()+c.slice(1)),specifications:{},features:title.split('|').slice(1).map(x=>x.trim()).filter(Boolean),availability:'Stock not confirmed',importSources:[]};
      products.set(key,product);downloads.push({product,url:row.image});added++;report.newProducts++;
    } else {
      existingCount++;report.duplicates++;
      if(price!==product.price)report.priceDifferences.push({name,existing:product.price,incoming:price,file:input.file});
      if(material) {
        if(product.material && product.material!==material)report.materialConflicts.push({name,existing:product.material,incoming:material});
        else product.material=material;
      }
    }
    if(expectedTravel&&!product.travelTypes.includes(expectedTravel))product.travelTypes.push(expectedTravel);
    if(expectedTravel&&!product.tags.includes(expectedTravel))product.tags.push(expectedTravel);
    product.importSources.push({file:input.file,row:row.web_scraper_order,category:expectedTravel || (input.file.includes('(2)')?'material-review':'Polycarbonate')});
    report.rows++;
  }
  report.files.push({file:input.file,travelType:expectedTravel || undefined,rows:input.rows.length,newProducts:added,existingProducts:existingCount});
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
report.totalProducts=list.length;
report.travelCounts=Object.fromEntries(['long-haul','short-trips','business-selection'].map(tag=>[tag,list.filter(p=>p.travelTypes.includes(tag)).length]));
report.materialCounts=Object.fromEntries(['Polycarbonate','Polypropylene'].map(material=>[material,list.filter(p=>p.material===material).length]));
await fs.writeFile('data/luggage-travel-import-report.json',JSON.stringify(report,null,2));
if(report.imageFailures.length||report.materialConflicts.length)throw Error('Import validation failed; current catalog preserved.');
await fs.writeFile(catalogPath,`import type { Product } from './catalog';\n// Imported luggage with source-assigned categories and travel collections.\n// Prices are in paise; source reviews and availability are not OVIA stock or reviews.\nexport const importedProducts: Product[] = ${JSON.stringify(list,null,2)};\n`);
console.log(JSON.stringify({...report,priceDifferences:report.priceDifferences.length},null,2));
