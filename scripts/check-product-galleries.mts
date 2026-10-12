import nextEnv from '@next/env';nextEnv.loadEnvConfig(process.cwd());
const {catalog,mongo}=await import('../src/server/db');
const {productMedia}=await import('../src/lib/product-media');
const {isProductPhoto}=await import('../src/components/product-photo');
const all=await catalog();
const matches=all.map(p=>({slug:p.slug,images:productMedia(p,p.variants[0]).gallery.filter(g=>isProductPhoto(g.src)).length})).filter(p=>p.images>1);
console.log(JSON.stringify(matches.slice(0,3)));console.log('Products with additional photos: '+matches.length);
await (await mongo()).close();
