import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const {products}=await import('../src/lib/catalog');
const {mongo,isDemo,transaction}=await import('../src/server/db');
let inserted=0;
if(!isDemo()) {
 const client=await mongo();const collection=client.db(process.env.MONGODB_DB || 'ovia').collection('products');
 const result=await collection.bulkWrite(products.map(p=>({updateOne:{filter:{id:p.id},update:{$setOnInsert:p},upsert:true}})));
 inserted=result.upsertedCount;console.log(JSON.stringify({database:'MongoDB',inserted,catalogProducts:products.length}));await client.close();
} else {
 await transaction(async repo=>{for(const p of products)if(!await repo.get('products',p.id)){await repo.put('products',p);inserted++;}});
 console.log(JSON.stringify({database:'local development store',inserted,catalogProducts:products.length}));
}
