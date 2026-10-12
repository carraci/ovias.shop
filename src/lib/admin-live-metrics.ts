import type { Order } from "./types";

export function storedOrderSummary(order: Order) {
  const quote = order.checkoutQuote;
  return {
    subtotal: (quote?.subtotal ?? order.lines.reduce((sum,line)=>sum+line.price*line.quantity,0))/100,
    shipping: (quote?.shipping ?? 0)/100,
    discount: (quote?.discount ?? 0)/100,
    tax: quote ? quote.tax/100 : null,
    total: order.total/100,
  };
}

export function buildStoredSalesReport(orders: Order[], products: {category?:string;variants?:{sku:string}[]}[], type: string, range: string, now = new Date()) {
  const today = new Date(now.toLocaleDateString("en-CA", {timeZone:"Asia/Kolkata"})+"T00:00:00Z");
  const start = new Date(today);
  if (range === "last_7_days") start.setUTCDate(start.getUTCDate()-6);
  else if (range === "last_quarter") { start.setUTCMonth(start.getUTCMonth()-3); }
  else if (range === "ytd") {start.setUTCMonth(3,1);if(start>today)start.setUTCFullYear(start.getUTCFullYear()-1);}
  else start.setUTCDate(start.getUTCDate()-29);
  const from=start.toISOString().slice(0,10),to=today.toISOString().slice(0,10);
  const paid=orders.filter(order=>order.status==="paid" && order.provider!=="demo" && (()=>{const date=new Date(order.createdAt).toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"});return date>=from && date<=to;})());
  let grossSales=0,discounts=0,returns=0,shippingCharges=0,taxesCollected=0,missingTaxRecords=0;
  const categories=new Map<string,{category:string;unitsSold:number;grossRevenue:number;refundRate:string}>();
  const skuCategory=new Map(products.flatMap(product=>(product.variants||[]).map(variant=>[variant.sku,product.category || "Uncategorized"] as const)));
  for(const order of paid) {
    const summary=storedOrderSummary(order);
    grossSales+=summary.total;discounts+=summary.discount;shippingCharges+=summary.shipping;
    if(summary.tax===null)missingTaxRecords++;else taxesCollected+=summary.tax;
    returns+=(order.refunds||[]).filter(refund=>refund.status==="Refunded").reduce((sum,refund)=>sum+refund.amount/100,0);
    for(const line of order.lines){const category=skuCategory.get(line.sku)||"Uncategorized";const row=categories.get(category)||{category,unitsSold:0,grossRevenue:0,refundRate:"Not attributed"};row.unitsSold+=line.quantity;row.grossRevenue+=line.price*line.quantity/100;categories.set(category,row);}
  }
  return {type,range,from,to,generatedAt:now.toISOString(),source:"stored-orders",metrics:{grossSales,netSales:grossSales-returns,discounts,returns,shippingCharges,taxesCollected,totalOrders:paid.length,averageOrderValue:paid.length ? grossSales/paid.length : 0},breakdown:[...categories.values()],taxSummary:{cgst:null,sgst:null,igst:null,totalTax:taxesCollected,missingTaxRecords,hsnBreakdown:[]},notes:"Paid orders created in the selected date range; refunds are confirmed refunds attached to those orders. Tax totals include recorded checkout quotes only. Tax splits and product refund attribution are not recorded."};
}
