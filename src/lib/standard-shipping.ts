export const defaultShippingRules={standardShippingFee:199,freeShippingThreshold:5000};
export function standardShippingCost(subtotalPaise:number,allProductsFree:boolean,rules=defaultShippingRules):number {
  return allProductsFree || subtotalPaise>=Math.round(rules.freeShippingThreshold*100)?0:Math.round(rules.standardShippingFee*100);
}
