import assert from 'node:assert/strict';
import nextEnv from '@next/env';
import {buildProductTaxonomy} from '../src/server/product-taxonomy';
const saved=[{id:'bags',name:'Bags',parent:null,status:'Active'},{id:'luggage',name:'Luggage',parent:null,status:'Active'},{id:'empty',name:'New Category',parent:null,status:'Active'},{name:'Backpacks',parent:'bags',status:'Active'},{name:'Cabin',parent:'Luggage',status:'Active'},{name:'Retired',parent:'Bags',status:'Inactive'}];
const productLabels=[{department:'bags',category:'Bags',subcategory:'Duffle Bags'},{department:'luggage',category:'Luggage',subcategory:'Trunk'},{department:'bags',category:'Bags',subcategory:'Retired'}];
const first=buildProductTaxonomy(saved,productLabels);
assert.ok(first.some(c=>c.name==='New Category' && !c.parent));
assert.ok(first.some(c=>c.name==='Backpacks' && c.parent==='Bags'));
assert.ok(first.some(c=>c.name==='Trunk' && c.parent==='Luggage'));
assert.ok(!first.some(c=>c.name==='Retired'));
const next=buildProductTaxonomy([...saved,{name:'Live Addition',parent:'Bags',status:'Active'}],productLabels);
assert.ok(next.some(c=>c.name==='Live Addition' && c.parent==='Bags'));
assert.ok(!first.some(c=>c.name==='Live Addition'));
nextEnv.loadEnvConfig(process.cwd());
const {mongo}=await import('../src/server/db');const client=await mongo();
try {
 const db=client.db(process.env.MONGODB_DB || 'ovia');
 const [categories,products]=await Promise.all([db.collection('categories').find({}).toArray(),db.collection('products').find({},{projection:{department:1,category:1,subcategory:1,catalogCategories:1}}).toArray()]);
 const live=buildProductTaxonomy(categories,products);
 const roots=live.filter(c=>!c.parent).map(c=>c.name);
 assert.ok(roots.includes('Bags'));assert.ok(roots.includes('Luggage'));
 console.log(JSON.stringify({checks:'empty categories, parent IDs, inactive exclusion and additions passed',roots,subcategories:live.filter(c=>c.parent).length,sourceCategories:categories.length,sourceProducts:products.length}));
}finally{await client.close();}
