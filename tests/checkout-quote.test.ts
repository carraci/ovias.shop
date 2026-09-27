import { test } from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../src/lib/catalog';
import { quote } from '../src/server/commerce';

test('checkout uses the selected variant image and server price', () => {
  const product = { ...products[0], image: '/main.jpg', variants: [{ ...products[0].variants[0], stock: 3, image: '/selected-colour.jpg', price: 12300 }] };
  const [line] = quote([{ sku: product.variants[0].sku, quantity: 2 }], [product]);
  assert.equal(line.image, '/selected-colour.jpg');
  assert.equal(line.price, 12300);
  assert.equal(line.quantity, 2);
  assert.throws(() => quote([{ sku: product.variants[0].sku, quantity: 4 }], [product]));
  product.variants[0].image = '';
  assert.equal(quote([{ sku: product.variants[0].sku, quantity: 1 }], [product])[0].image, '/main.jpg');
});
