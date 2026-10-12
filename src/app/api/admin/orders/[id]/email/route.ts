import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { authorizeAdminApi } from "@/server/admin-auth";
import { readRepository } from "@/server/db";
import { originCheck } from "@/server/http";
import { sendAccountEmail } from "@/server/mail";
import { orderPaymentStatus } from "@/lib/order-document";
import type { Order } from "@/lib/types";
export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}) {
  const auth=await authorizeAdminApi(req);if(!auth.authorized)return auth.response;
  try {
    originCheck(req);
    const {id}=await ctx.params;
    const order=await readRepository(repo=>repo.get<Order>("orders",id));
    if(!order?.address?.email)return NextResponse.json({error:"Order recipient unavailable"},{status:404});
    await sendAccountEmail({id:randomUUID(),to:order.address.email,subject:`OVIA — Order ${order.orderNumber || order.id}`,text:["OVIA",`Order: ${order.orderNumber || order.id}`,`Status: ${order.status}`,`Payment: ${orderPaymentStatus(order)}`,...order.lines.map(line=>`${line.name} / ${line.sku} / ${line.color} × ${line.quantity}`),`Total: INR ${(order.total/100).toFixed(2)}`,...(order.refunds||[]).map(refund=>`Refund: ${refund.status} / INR ${(refund.amount/100).toFixed(2)}`)].join("\n")});
    return NextResponse.json({success:true});
  }catch{return NextResponse.json({error:"Email delivery failed. Check the configured email service."},{status:503});}
}
