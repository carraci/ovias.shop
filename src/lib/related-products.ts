import type { Product } from './catalog';

function productType(p: Product) {
  const title = p.name.toLowerCase();
  const patterns = p.department === 'luggage'
    ? ['trunk', 'check[ -]?in', 'cabin']
    : ['backpack', 'duff[el]+', 'briefcase', 'crossbody|cross body', 'tote', 'shoulder'];
  return patterns.find(pattern => new RegExp(pattern).test(title)) || p.subcategory || p.category;
}

export function relatedProductsFor(product: Product, catalog: Product[], limit = 12) {
  const type = productType(product);
  return catalog.filter(candidate => candidate.id !== product.id && candidate.department === product.department && candidate.status !== 'Draft' && candidate.variants.length > 0)
    .map(candidate => ({candidate, score:
      (productType(candidate) === type ? 100 : 0) +
      (candidate.category === product.category ? 10 : 0) +
      (candidate.collection === product.collection ? 5 : 0) +
      (candidate.material && candidate.material === product.material ? 2 : 0)}))
    .sort((a,b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name))
    .slice(0,limit).map(item => item.candidate);
}
