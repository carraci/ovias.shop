import {test,expect} from "./helpers/mocked-ui";
import {renderOrderDocument} from "../../src/lib/order-document";
import type {Order} from "../../src/lib/types";
for(const scenario of ["active","cancelled","refunded","unpaid","multi-item"]) {
  test(`A4 print preview ${scenario}`,async({page},testInfo)=>{
    const order:Order={id:"fixture",owner:"fixture",idempotencyKey:"fixture",status:scenario==="unpaid"?"pending":scenario==="cancelled"||scenario==="refunded"?"cancelled":"paid",provider:"razorpay",total:100,address:{name:"Print test",email:"fixture@example.test",line1:"Fixture address",city:"City",region:"Region",postalCode:"000000",country:"IN"},createdAt:"2026-10-01T12:00:00Z",expiresAt:"2026-10-02T12:00:00Z",lines:Array.from({length:scenario==="multi-item"?80:1},(_,i)=>({name:`Item ${i}`,sku:`SKU-${i}`,color:"Black",quantity:1,price:100,image:"",slug:"item"}))};
    if(scenario==="refunded")order.refunds=[{id:"refund",paymentId:"payment",amount:100,status:"Refunded",reason:"Fixture",actor:"test",requestedAt:order.createdAt,updatedAt:order.createdAt}];
    await page.setContent(renderOrderDocument(order));
    await page.emulateMedia({media:"print"});
    await expect(page.locator(".toolbar")).toBeHidden();
    await expect(page.locator("tbody tr")).toHaveCount(order.lines.length);
    await expect(page.locator("body")).not.toContainText("internal shop notes");
    if(scenario==="cancelled")await expect(page.locator(".statuses")).not.toContainText("Refunded");
    if(scenario==="refunded")await expect(page.locator(".statuses")).toContainText("Refunded");
    await page.screenshot({path:testInfo.outputPath(`${scenario}.png`),fullPage:true});
    if(testInfo.project.name.includes("chromium"))await page.pdf({path:testInfo.outputPath(`${scenario}.pdf`),preferCSSPageSize:true});
  });
}
