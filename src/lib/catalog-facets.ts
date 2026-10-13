import { filterProducts, type Filters } from './catalog-filter';
import { slugify, bagCategoryNames, luggageCategoryNames, canonicalCategory } from './catalog-helpers';
import type { Product } from './catalog';

const knownValue = (value: string) => value && !['not provided', 'as pictured', '—'].includes(value.toLowerCase());
const unique = (values: string[]) => [...new Set(values.filter(knownValue))].sort((a, b) => a.localeCompare(b));
const options = (values: string[]) => unique(values).map(value => ({label:value,value}));

// Facets stay within the route's category; each facet ignores its own selection.
export function catalogFacets(products: Product[], base: Filters, filters: Filters) {
  const scoped = filterProducts(products, {...base, limit:String(products.length || 1), page:'1'}).items;
  const facetProducts = (key: keyof Filters) => {
    const other = {...filters, limit:String(products.length || 1), page:'1'};
    delete other[key];
    if (base[key]) other[key] = base[key];
    return filterProducts(products,other).items;
  };
  const categoryScope = base.tag ? filterProducts(products,{...base,category:undefined,subcategory:undefined,limit:String(products.length || 1),page:'1'}).items : products;
  const departmentProducts = categoryScope.filter(p => !base.department || p.department === base.department);
  const categories = (department:string) => {
    const labels = department === 'bags' ? bagCategoryNames
      : department === 'luggage' ? luggageCategoryNames
      : unique(departmentProducts.filter(p=>p.department===department).flatMap(p=>p.catalogCategories || [p.category]));
    return labels.map(label=>({label,value:slugify(label)})).filter(option=>
      filterProducts(departmentProducts,{department,category:option.value,limit:'1'}).total>0
    );
  };
  const knownCategoryNames = base.department === 'bags' ? bagCategoryNames : base.department === 'luggage' ? luggageCategoryNames : [];
  const subCategoryValues = unique(scoped.flatMap(p=>p.catalogCategories || [p.subcategory || p.category]));
  const subCategories = knownCategoryNames.length ? knownCategoryNames.filter(label=>subCategoryValues.some(value=>canonicalCategory(value)===canonicalCategory(label))).map(label=>({label,value:slugify(label)})) : subCategoryValues.map(label=>({label,value:slugify(label)}));
  const colorProducts = facetProducts('color');
  const colorHex = new Map(colorProducts.flatMap(p=>p.variants.map(v=>[v.color,v.hex] as const)));
  const colors = unique(colorProducts.flatMap(p=>p.colors?.length ? p.colors : p.variants.map(v=>v.color))).map(value=>({label:value,value,hex:colorHex.get(value) || colorProducts.flatMap(p=>p.variants).find(v=>v.color.toLowerCase().includes(value.toLowerCase()))?.hex || '#888888'}));
  return {
    categories: {luggage:[{label:'All Luggage',value:''},...categories('luggage')],bags:[{label:'All Bags',value:''},...categories('bags')],accessories:categories('accessories')},
    subCategories,
    materials:options(facetProducts('material').flatMap(p=>[p.material,...(p.materials || [])])),
    collections:options(facetProducts('collection').map(p=>p.collection)),
    colors,
    sorts:[{label:'Featured',value:''},{label:'Price: low to high',value:'price-asc'},{label:'Price: high to low',value:'price-desc'},{label:'Name',value:'name'}],
  };
}
