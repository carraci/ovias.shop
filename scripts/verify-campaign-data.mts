import assert from "node:assert/strict";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const {mongo}=await import("../src/server/db");
const {readCampaigns,activeCampaigns}=await import("../src/server/campaigns");
const {campaignStatus}=await import("../src/lib/campaigns");
const client=await mongo();
try{
 const saved=await client.db(process.env.MONGODB_DB||"ovia").collection("campaigns").find({}).toArray();
 const rows=await readCampaigns();
 assert.equal(rows.length,saved.length);
 for(const placement of ["homeHero","homeCollection","bags","luggage","editorial"]){
  const active=await activeCampaigns(placement);
  assert.deepEqual(active.map(c=>c.id).sort(),rows.filter(c=>c.status==="Active"&&c.placements.includes(placement as any)).map(c=>c.id).sort());
 }
 for(const row of rows){assert.equal(row.status,campaignStatus({...row,status:row.savedStatus}));assert.ok(row.impressions>=0&&row.clicks>=0&&row.conversions>=0&&row.revenue>=0);}
 console.log(`Verified ${rows.length} saved campaigns and all 5 storefront placements; no data changed.`);
}finally{await client.close();}
