import { luggageProducts } from '../src/lib/luggage-collection.ts';

console.log('Total luggage products in luggage-collection.ts:', luggageProducts.length);

const categories = {};
const materials = {};
const collections = {};

luggageProducts.forEach(p => {
  categories[p.category] = (categories[p.category] || 0) + 1;
  materials[p.material] = (materials[p.material] || 0) + 1;
  collections[p.collection] = (collections[p.collection] || 0) + 1;
});

console.log('Categories:', categories);
console.log('Materials:', materials);
console.log('Collections:', collections);

// Check variants and images
let totalVariants = 0;
let totalImages = 0;
luggageProducts.forEach(p => {
  totalVariants += p.variants.length;
  p.variants.forEach(v => {
    if (v.image) totalImages++;
  });
});
console.log('Total variants:', totalVariants);
console.log('Total variant images:', totalImages);
console.log('Sample product:', JSON.stringify(luggageProducts[0], null, 2));
