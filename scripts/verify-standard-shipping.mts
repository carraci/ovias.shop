import assert from "node:assert/strict";
import { priceLines } from "../src/server/checkout-pricing";
import type { Repository } from "../src/server/db";
process.env.CHECKOUT_TAX_INCLUSIVE="true";
process.env.PAYMENT_PROVIDER="razorpay";
async function check(subtotal:number,free:boolean,expected:number,custom?:{standardShippingFee:number;freeShippingThreshold:number}) {
  const repo={get:async()=>custom?{id:"global",shipping:custom}:undefined,find:async()=>[{id:"test",freeShipping:free,variants:[{sku:"TEST"}]}]} as unknown as Repository;
  const quote=await priceLines([{sku:"TEST",name:"Test",color:"Black",price:subtotal*100,quantity:1,image:"",slug:"test"}],1,{shippingMethod:"standard"},repo);
  assert.equal(quote.shipping,expected*100);
  assert.equal(quote.total,(subtotal+expected)*100);
  assert.equal(quote.shippingOptions[0].cost,quote.shipping);
}
await check(4999,false,199);await check(5000,false,0);await check(5001,false,0);await check(1000,true,0);await check(1000,false,99,{standardShippingFee:99,freeShippingThreshold:3000});
console.log("Checkout shipping rule checks passed; no database or order changes made.");
