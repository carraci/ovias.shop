import {NextRequest,NextResponse} from "next/server";
import {authorizeAdminApi} from "@/server/admin-auth";
import {originCheck} from "@/server/http";
import {transaction} from "@/server/db";
import type {Order} from "@/lib/types";
import {orderWorkflow} from "@/lib/order-workflow";
import {verifiedShipment} from "@/server/logistics";
export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}) {
  const auth=await authorizeAdminApi(req);if(!auth.authorized)return auth.response;
  try {
    originCheck(req);const input=await req.json();
    if(input.confirmed!==true || typeof input.reason!=="string" || !input.reason.trim() || input.reason.length>200)return NextResponse.json({error:"Confirm the request and enter a reason."},{status:400});
    const {id}=await ctx.params;
    const result=await transaction(async repo=>{
      const order=await repo.get<Order>("orders",id);
      if(!order || !verifiedShipment(order)||!orderWorkflow(order).canRequestReturn)throw new Error("Return request is not available for this order stage.");
      const prior=await repo.get<{id:string;status:string}>("order_return_requests",id);if(prior)return prior;
      const request={id,orderId:id,status:"Pending courier approval",reason:input.reason.trim(),actor:auth.user.email,createdAt:new Date().toISOString()};
      await repo.put("order_return_requests",request);return request;
    });return NextResponse.json({success:true,request:result});
  }catch{return NextResponse.json({error:"Return request could not be saved. Check the order stage and retry."},{status:409});}
}
