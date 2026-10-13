import {test,before} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {filterProducts} from '../src/lib/catalog';
import {csvImportFixture} from './helpers/csv-import-fixture';
let products: import('../src/lib/catalog').Product[];
before(async()=>{ products=await csvImportFixture('bags-highlights'); });
import {catalogFacets} from '../src/lib/catalog-facets';
const sources=JSON.parse(fs.readFileSync('data/bags-highlights-csv-sources.json','utf8'));
test('highlight imports retain source rows and exact curated collection memberships',()=>{
 assert.equal(products.length,862);assert.equal(new Set(products.map(p=>p.slug)).size,862);
 for(const [files,tag,count] of [[['(16)'],'new-arrivals',60],[['(17)'],'best-sellers',59],[['(18)','(19)'],'everyday-mobility',59]]as const){
 const expected=new Set<string>();
 for(const input of sources.filter((s:{file:string})=>files.some(file=>s.file.includes(file))))for(const row of input.rows){
 const p=products.find(p=>p.importSources?.some(s=>s.file===input.file&&s.row===row.web_scraper_order));assert.ok(p);expected.add(p.id);assert.ok(fs.existsSync('public'+p.image));assert.ok(p.slug.startsWith('ovia-'));assert.ok(!/delivery|bought in past month/i.test(p.collection));}
 const result=filterProducts(products,{tag,limit:'999'});assert.equal(result.total,count);assert.deepEqual(new Set(result.items.map(p=>p.id)),expected);
 const base={department:'bags',tag};const facets=catalogFacets(products,base,base);
 for(const [key,options] of [['category',facets.categories.bags],['material',facets.materials],['color',facets.colors],['collection',facets.collections]]as const)for(const option of options)assert.ok(filterProducts(products,{...base,[key]:option.value}).total>0);
 }
});
