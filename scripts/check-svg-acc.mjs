import { products } from '../src/lib/catalog.ts';

const svgAcc = products.filter(p => p.image.includes('accessories.svg'));
console.log('SVG accessories in catalog.ts products:', svgAcc.length);
svgAcc.forEach(p => console.log('  -', p.id, p.name, p.department, p.category));
