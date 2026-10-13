import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { filterProducts, slugify } from '../src/lib/catalog';
import { csvImportFixture } from './helpers/csv-import-fixture';
let products: import('../src/lib/catalog').Product[];
let initialProducts: import('../src/lib/catalog').Product[];
before(async()=>{
  products=await csvImportFixture('luggage');
  initialProducts=products.filter(p=>p.importSources?.some(s=>source.some((input: {file:string})=>input.file===s.file)));
});
import { catalogFacets } from '../src/lib/catalog-facets';

const source = JSON.parse(fs.readFileSync('data/luggage-csv-sources.json','utf8').replace(/^\uFEFF/,''));
const categories = ['Trunk','Check-In','Cabin','Luggage','Cabin Bags'];

test('every CSV row is represented in exactly its assigned category membership', () => {
  assert.equal(initialProducts.length,213);
  assert.equal(initialProducts.reduce((count,p)=>count+(p.importSources?.filter(s=>source.some((input: {file:string})=>input.file===s.file)).length || 0),0),300);
  assert.equal(new Set(products.map(p=>p.slug)).size,products.length);
  assert.equal(new Set(products.flatMap(p=>p.variants.map(v=>v.sku))).size,products.length);
  for (const [index,set] of source.entries()) {
    const category = categories[index];
    const expected = new Set<string>();
    for (const row of set.rows) {
      const product = products.find(p=>p.importSources?.some(s=>s.file===set.file && s.row===row.web_scraper_order));
      assert.ok(product,`${set.file}: ${row.web_scraper_order}`);
      assert.ok(product.catalogCategories?.includes(category));
      assert.equal(product.department,'luggage');
      assert.ok(product.slug.startsWith('ovia-'));
      assert.equal(product.variants[0].price,Math.round(Number(row.price.replace(/[^\d.]/g,''))*100));
      assert.ok(fs.existsSync(`public${product.image}`));
      expected.add(product.id);
    }
    const result=filterProducts(initialProducts,{department:'luggage',category:slugify(category),limit:'999'});
    assert.deepEqual(new Set(result.items.map(p=>p.id)),expected);
  }
});

test('facets yield results in each subcategory, with matching API-style filters and sorting', () => {
  for(const category of categories) {
    const base={department:'luggage',category:slugify(category)};
    const facets=catalogFacets(products,base,base);
    for(const [key,options] of [['material',facets.materials],['color',facets.colors],['collection',facets.collections]] as const) {
      for(const option of options) assert.ok(filterProducts(products,{...base,[key]:option.value}).total>0,`${category}: ${key} ${option.value}`);
    }
    const ascending=filterProducts(products,{...base,sort:'price-asc',limit:'999'}).items;
    assert.ok(ascending.every((p,i)=>!i || p.price!>=ascending[i-1].price!));
    const page1=filterProducts(products,{...base,page:'1'});
    const page2=filterProducts(products,{...base,page:'2'});
    assert.ok(!page2.items.some(p=>page1.items.some(other=>p.id===other.id)));
  }
});
