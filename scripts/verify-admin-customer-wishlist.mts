import assert from "node:assert/strict";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const {mongo,catalog}=await import("../src/server/db");
const {getAdminCustomerById}=await import("../src/server/admin-service");
const {resolveWishlistItems}=await import("../src/lib/account-wishlist");
const client=await mongo();
try {
 const users=await client.db(process.env.MONGODB_DB || "ovia").collection("users").find({}).toArray();
 const products=await catalog();
 let verified=0;
 const sample=[...users.filter(user=>user.accountWishlist?.length),...users.filter(user=>!user.accountWishlist?.length)].slice(0,3);
 for(const user of sample){
   const profile=await getAdminCustomerById(user.id);if(!profile)continue;
   assert.deepEqual(profile.wishlist,resolveWishlistItems(Array.isArray(user.accountWishlist)?user.accountWishlist:[],products));
   assert.deepEqual(profile.notes,Array.isArray(user.adminNotes)?user.adminNotes:[]);
   verified++;
 }
 console.log(`Wishlist and notes verified for ${verified} customer profiles; no data changed.`);
}finally{await client.close();}
