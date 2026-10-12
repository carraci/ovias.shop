import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const { catalog, mongo } = await import('../src/server/db');
const { relatedProductsFor } = await import('../src/lib/related-products');
const all = await catalog();
for (const department of ['bags','luggage']) {
 const p = all.find(p => p.department === department)!;
 const response = await fetch(`http://localhost:3000/api/products/${p.slug}?includeRelated=1`);
 const served = await response.json();
 const expected = relatedProductsFor(p,all);
 if (!response.ok || served.relatedProducts.some((x:any) => x.department !== department || x.id === p.id) || JSON.stringify(served.relatedProducts.map((x:any)=>x.id)) !== JSON.stringify(expected.map(x=>x.id))) throw Error('Related product mismatch');
 if (served.relatedProducts.some((x:any) => x.variants[0].price !== all.find(p=>p.id===x.id)?.variants[0].price)) throw Error('Price mismatch');
 console.log(department+': database recommendations and prices verified ('+expected.length+')');
}
await (await mongo()).close();
