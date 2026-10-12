import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { authorizeAdminApi } from "@/server/admin-auth";
import { readRepository } from "@/server/db";
import type { Order } from "@/lib/types";
import { renderOrderDocument } from "@/lib/order-document";
import { verifiedShipment } from "@/server/logistics";
export const runtime = "nodejs";
export async function GET(req:NextRequest,ctx:{params:Promise<{id:string}>}) {
  const auth=await authorizeAdminApi(req);
  if(!auth.authorized)return auth.response;
  const type=req.nextUrl.searchParams.get("type") || "summary";
  if(!["summary","packing","invoice"].includes(type))return NextResponse.json({error:"Unknown document type"},{status:400});
  try {
    const {id}=await ctx.params;
    const order=await readRepository(repo=>repo.get<Order>("orders",id));
    if(!order)return NextResponse.json({error:"Order not found"},{status:404});
    if(type==="invoice")return NextResponse.json({error:"GST invoice unavailable: verified seller details, invoice number, and GST breakdown are not recorded. Use Order Summary."},{status:409});
    const nonce=randomUUID();
    return new NextResponse(renderOrderDocument({...order,shipping:verifiedShipment(order)?order.shipping:undefined},type==="packing",nonce),{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-store","Content-Security-Policy":`default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`,"X-Content-Type-Options":"nosniff"}});
  }catch{return NextResponse.json({error:"Order document unavailable. Please retry."},{status:503});}
}
