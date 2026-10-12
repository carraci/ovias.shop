import type {Product} from './catalog';
const colorWords=/\b(black|grey|gray|silver|blue|navy|green|yellow|red|pink|purple|orange|brown|beige|white|teal|turquoise|olive|maroon|champagne|taupe|tan|graphite|charcoal)\b/gi;
const modelKey=(p:Product)=>p.name.toLowerCase().replace(colorWords,'').replace(/[^a-z0-9]+/g,' ').trim();
export function productColorOptions(product:Product,products:Product[]){
 const matching=products.filter(p=>p.id===product.id || (p.collection===product.collection&&p.department===product.department&&p.material===product.material&&modelKey(p)===modelKey(product)));
 const options=matching.flatMap(p=>p.variants.filter(v=>v.color&&v.color!=='As pictured').map(v=>({color:v.color,hex:v.hex,sku:v.sku,slug:p.slug,image:v.image || p.image})));
 // Prefer the current record when the same colour is listed more than once.
 options.sort((a,b)=>Number(b.slug===product.slug)-Number(a.slug===product.slug));
 return options.filter((option,index)=>options.findIndex(other=>other.color.toLowerCase()===option.color.toLowerCase())===index);
}
