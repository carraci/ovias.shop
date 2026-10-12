export type ProductSale = {enabled:boolean;price:number;startDate:string;endDate:string};
export function activeSalePrice(sale: ProductSale | undefined, basePrice:number, now=new Date()):number {
  if(!sale?.enabled || !Number.isFinite(sale.price) || sale.price<=0 || sale.price>=basePrice)return basePrice;
  const start=Date.parse(`${sale.startDate}T00:00:00+05:30`);
  const end=Date.parse(`${sale.endDate}T23:59:59.999+05:30`);
  return Number.isFinite(start)&&Number.isFinite(end)&&start<=end&&now.getTime()>=start&&now.getTime()<=end?sale.price:basePrice;
}
