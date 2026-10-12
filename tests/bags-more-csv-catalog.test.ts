import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {products,filterProducts,slugify} from '../src/lib/catalog';
const sources=JSON.parse(fs.readFileSync('data/bags-more-csv-sources.json','utf8'));
test('additional bag imports retain previous products and every source row',()=>{
 const text=fs.readFileSync('data/import-backups/imported-products-before-more-bags.txt','utf8');
 const old=JSON.parse(text.slice(text.indexOf('= [')+2).trim().replace(/;$/,''));
 for(const prior of old){const p=products.find(p=>p.id===prior.id);assert.ok(p);assert.equal(p.slug,prior.slug);assert.equal(p.name,prior.name);assert.equal(p.price,prior.price);}
 for(const input of sources)for(const row of input.rows){const p=products.find(p=>p.importSources?.some(s=>s.file===input.file&&s.row===row.web_scraper_order));assert.ok(p);assert.ok(p.slug.startsWith('ovia-'));assert.ok(fs.existsSync('public'+p.image));}
 assert.ok(products.length>=764);assert.equal(new Set(products.map(p=>p.id)).size,products.length);
});
test('new bag category membership requires matching titles',()=>{
 for(const [label,pattern] of [['Shoulder Bags',/shoulder/i],['Hand Carry',/hand[ -]?carry|handbag|hand bag|top[ -]?handle|handheld/i],['Travel Bags',/travel|weekend|overnight|duff[el]+/i],['Cabin Bags',/cabin|carry[ -]?on/i]]as const){
 const result=filterProducts(products,{department:'bags',category:slugify(label),limit:'999'});assert.ok(result.total>0);for(const p of result.items)assert.match(p.name,pattern);
 }
 assert.equal(filterProducts(products,{department:'bags',category:'bags',limit:'999'}).total,products.filter(p=>p.department==='bags').length);
});
