import assert from "node:assert/strict";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const {catalog,mongo}=await import("../src/server/db");
const client=await mongo();
try {
  const publicProducts=await catalog();
  const stored=await client.db(process.env.MONGODB_DB || "ovia").collection("products").find({}).toArray();
  const byId=new Map(stored.map((product)=>[product.id,product]));
  for(const product of publicProducts){
    const saved=byId.get(product.id);assert.ok(saved,"Public product must exist in database");
    assert.notEqual(saved.status,"Draft");assert.notEqual(saved.status,"Archived");
    assert.equal(product.name,saved.name);assert.equal(product.description,saved.description);
    assert.deepEqual(product.gallery,saved.gallery);assert.deepEqual(product.features,saved.features);
    assert.deepEqual(product.variants.map((variant)=>({sku:variant.sku,color:variant.color,hex:variant.hex,image:variant.image})),saved.variants.map((variant:any)=>({sku:variant.sku,color:variant.color,hex:variant.hex,image:variant.image})));
  }
  console.log(`Public product sync verified for ${publicProducts.length} products; no database changes made.`);
}finally{await client.close();}
