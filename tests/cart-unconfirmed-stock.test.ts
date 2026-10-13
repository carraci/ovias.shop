import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quote} from '../src/server/commerce';
import {products} from '../src/lib/catalog';
test('unconfirmed stock can be saved in cart but cannot be quoted for checkout',()=>{
 const product={...products[0],availability:'Stock not confirmed',variants:[{...products[0].variants[0],stock:0}]};
 const lines=[{sku:product.variants[0].sku,quantity:1}];
 assert.equal(quote(lines,[product],true)[0].quantity,1);
 assert.throws(()=>quote(lines,[product]),/unavailable/);
 assert.throws(()=>quote([{...lines[0],quantity:11}],[product],true),/unavailable/);
 assert.throws(()=>quote(lines,[{...product,availability:'Out of stock'}],true),/unavailable/);
});
