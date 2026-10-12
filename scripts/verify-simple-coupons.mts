import assert from "node:assert/strict";
import {priceLines} from "../src/server/checkout-pricing";
import type {Repository} from "../src/server/db";
process.env.MONGODB_URI="";
process.env.CHECKOUT_TAX_INCLUSIVE="true";
process.env.PAYMENT_PROVIDER="razorpay";
const actualNow=Date.now;
let coupon={id:"check",code:"WELCOME10",status:"Active",discountType:"percentage",value:10,endDate:"2026-12-31",oneTimePerUser:true,usedBy:[] as string[]};
const repo={get:async()=>undefined,find:async(collection:string)=>collection==="coupons"?[coupon]:collection==="products"?[{id:"test",freeShipping:true,variants:[{sku:"TEST"}]}]:[]} as unknown as Repository;
const quote=()=>priceLines([{sku:"TEST",name:"Test",color:"Black",price:1000000,quantity:1,image:"",slug:"test"}],1,{shippingMethod:"standard",promoCode:"WELCOME10",customerEmail:"check@example.com"},repo);
try{
 Date.now=()=>Date.parse("2026-12-31T23:58:00+05:30");
 assert.equal((await quote()).discount,100000);
 coupon={...coupon,discountType:"fixed",value:500};assert.equal((await quote()).discount,50000);
 coupon={...coupon,usedBy:["check@example.com"]};await assert.rejects(quote,/already used/);
 coupon={...coupon,usedBy:[]};Date.now=()=>Date.parse("2027-01-01T00:00:00+05:30");await assert.rejects(quote,/expired/);
 console.log("Verified percentage/fixed discounts, end-of-day IST expiry and one-use rule; no database or order changes.");
}finally{Date.now=actualNow;}
