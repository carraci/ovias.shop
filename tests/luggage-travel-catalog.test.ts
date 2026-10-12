import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { products, filterProducts } from '../src/lib/catalog';
import { catalogFacets } from '../src/lib/catalog-facets';
const sources=JSON.parse(fs.readFileSync('data/luggage-travel-csv-sources.json','utf8'));

test('all additional CSV rows are represented without duplicate product URLs or invented prices',()=>{
  const luggage = products.filter(p=>p.department==='luggage');
  assert.equal(luggage.length,380);
  assert.equal(new Set(products.map(p=>p.id)).size,products.length);
  assert.equal(new Set(products.map(p=>p.slug)).size,products.length);
  assert.equal(new Set(products.flatMap(p=>p.variants.map(v=>v.sku))).size,products.length);
  let rows=0;
  for(const input of sources)for(const row of input.rows){
    const p=products.find(p=>p.importSources?.some(s=>s.file===input.file&&s.row===row.web_scraper_order));
    assert.ok(p,`${input.file} ${row.web_scraper_order}`);
    assert.equal(p.department,'luggage');assert.ok(p.slug.startsWith('ovia-'));assert.ok(fs.existsSync(`public${p.image}`));
    if(row.price)assert.equal(p.price,Math.round(Number(row.price.replace(/[^\d.]/g,''))*100));
    else {assert.equal(p.priceOnRequest,true);assert.equal(p.variants[0].stock,0);}
    if(/polypropylene|\bPP\b/i.test(row.data))assert.equal(p.material,'Polypropylene');
    rows++;
  }
  assert.equal(rows,300);
});

test('travel collections match the CSV assignments exactly and support contextual filters',()=>{
  for(const tag of ['long-haul','short-trips','business-selection']){
    const expected=new Set(products.filter(p=>p.travelTypes?.includes(tag)).map(p=>p.id));
    const base={department:'luggage',tag};
    const result=filterProducts(products,{...base,limit:'999'});
    assert.equal(result.total,60);assert.deepEqual(new Set(result.items.map(p=>p.id)),expected);
    const facets=catalogFacets(products,base,base);
    for(const [key,options]of [['material',facets.materials],['color',facets.colors],['collection',facets.collections]]as const)
      for(const option of options)assert.ok(filterProducts(products,{...base,[key]:option.value}).total>0);
  }
});

test('material and colour favourites contain only matching luggage',()=>{
  for(const material of ['Polycarbonate','Polypropylene']){
    const result=filterProducts(products,{department:'luggage',material,limit:'999'});
    assert.ok(result.total>0);assert.ok(result.items.every(p=>p.material===material));
  }
  for(const color of ['Black','Blue']){
    const result=filterProducts(products,{department:'luggage',color,limit:'999'});
    assert.ok(result.total>0);
    assert.ok(result.items.every(p=>p.variants.some(v=>color==='Blue'?/blue|navy|indigo|midnight/i.test(v.color):/black|graphite/i.test(v.color))));
  }
});
