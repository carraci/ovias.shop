import {test} from "node:test";
import assert from "node:assert/strict";
import {buildStoredSalesReport,storedOrderSummary} from "../src/lib/admin-live-metrics";
import type {Order} from "../src/lib/types";
const order=(changes:Partial<Order>={}):Order=>({id:"real-order",status:"paid",provider:"razorpay",total:95000,createdAt:"2026-10-08T12:00:00Z",lines:[{sku:"CABIN",price:100000,quantity:1}],...changes} as Order);
test("reports use stored paid orders, paise, actual categories and confirmed refunds",()=>{
 const paid=order({checkoutQuote:{subtotal:100000,discount:10000,shipping:5000,tax:14492,total:95000} as Order['checkoutQuote'],refunds:[{status:"Refunded",amount:15000},{status:"Failed",amount:20000}] as Order['refunds']});
 const report=buildStoredSalesReport([paid,order({id:"pending",status:"pending"}),order({id:"demo",provider:"demo"}),order({id:"old",createdAt:"2026-08-01T12:00:00Z"})],[{category:"Cabin bags",variants:[{sku:"CABIN"}]}],"sales","last_7_days",new Date("2026-10-08T12:00:00Z"));
 assert.equal(report.metrics.totalOrders,1);assert.equal(report.metrics.grossSales,950);assert.equal(report.metrics.returns,150);assert.equal(report.metrics.netSales,800);assert.equal(report.metrics.discounts,100);assert.equal(report.metrics.shippingCharges,50);assert.equal(report.metrics.taxesCollected,144.92);assert.equal(report.breakdown[0].category,"Cabin bags");assert.equal(report.breakdown[0].grossRevenue,1000);assert.equal(report.taxSummary.cgst,null);
});
test("empty data remains empty and missing tax is marked unrecorded",()=>{
 const report=buildStoredSalesReport([],[],"sales","last_30_days",new Date("2026-10-08T12:00:00Z"));assert.equal(report.metrics.totalOrders,0);assert.equal(report.metrics.grossSales,0);assert.deepEqual(report.breakdown,[]);
 assert.equal(storedOrderSummary(order()).tax,null);assert.equal(storedOrderSummary(order({total:9000})).total,90);
 const missing=buildStoredSalesReport([order()],[],"sales","last_7_days",new Date("2026-10-08T12:00:00Z"));assert.equal(missing.taxSummary.missingTaxRecords,1);
});
test("India dates include orders near midnight and financial year starts in April",()=>{
 const report=buildStoredSalesReport([order({createdAt:"2026-10-07T20:00:00Z"})],[],"sales","ytd",new Date("2026-10-08T12:00:00Z"));assert.equal(report.from,"2026-04-01");assert.equal(report.metrics.totalOrders,1);
});
