import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { filterProducts, slugify } from '../src/lib/catalog';
import { csvImportFixture } from './helpers/csv-import-fixture';
import { catalogFacets } from '../src/lib/catalog-facets';
const sources=JSON.parse(fs.readFileSync('data/bags-csv-sources.json','utf8'));
let products: import('../src/lib/catalog').Product[];
let bags: import('../src/lib/catalog').Product[];
before(async()=>{ products=await csvImportFixture('bags'); bags=products.filter(p=>p.department==='bags'); });

test('bag imports preserve all rows, prices and distinct image variations',()=>{
  assert.equal(bags.filter(p=>p.importSources?.some(s=>sources.some((input: {file:string})=>input.file===s.file))).length,195);
  assert.equal(products.filter(p=>p.department==='luggage').length,380);
  assert.equal(new Set(products.map(p=>p.id)).size,products.length);
  assert.equal(new Set(products.map(p=>p.slug)).size,products.length);
  let rows=0;
  for(const input of sources)for(const row of input.rows){
    const p=bags.find(p=>p.importSources?.some(s=>s.file===input.file&&s.row===row.web_scraper_order));
    assert.ok(p,`${input.file} ${row.web_scraper_order}`);
    assert.ok(p.catalogCategories?.includes(input.category));
    assert.ok(p.slug.startsWith('ovia-'));assert.ok(fs.existsSync(`public${p.image}`));
    assert.equal(p.price,Math.round(Number(row.price.replace(/[^\d.]/g,''))*100));
    assert.ok(!/^\([\d.]+[Kk]?\)$/.test(p.collection));
    rows++;
  }
  assert.equal(rows,262);
});

test('bag category routes match their CSV memberships without name-based leakage',()=>{
  for(const category of ['Duffle Bags','Briefcases','Crossbodies','Totes']){
    const expected=new Set(bags.filter(p=>p.catalogCategories?.includes(category)).map(p=>p.id));
    const result=filterProducts(products,{department:'bags',category:slugify(category),limit:'999'});
    assert.deepEqual(new Set(result.items.map(p=>p.id)),expected);
    const base={department:'bags',category:slugify(category)};
    const facets=catalogFacets(products,base,base);
    for(const [key,options]of [['material',facets.materials],['color',facets.colors],['collection',facets.collections]]as const)
      for(const option of options)assert.ok(filterProducts(products,{...base,[key]:option.value}).total>0);
  }
  assert.equal(filterProducts(products,{department:'bags',category:'backpacks'}).total,0);
});
