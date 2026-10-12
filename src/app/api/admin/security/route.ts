import {NextRequest,NextResponse} from "next/server";
import {jwtVerify} from "jose";
import {authorizeAdminApi,recordAuditEvent} from "@/server/admin-auth";
import {getAdminAuditLogs} from "@/server/admin-service";
import {transaction} from "@/server/db";
import {authSigningKey} from "@/server/auth";
import {hash} from "@/server/http";
import type {Session} from "@/lib/types";
export const runtime="nodejs";
async function currentSessionId(req:NextRequest) {
 const {payload}=await jwtVerify(req.cookies.get("ovia_session")?.value || req.headers.get("authorization")?.replace(/^Bearer /,"") || "",authSigningKey(),{algorithms:["HS256"],issuer:"ovia",audience:"ovia-store"});
 return hash(payload.jti || "");
}
export async function GET(req:NextRequest) {
 const auth=await authorizeAdminApi(req);if(!auth.authorized)return auth.response;
 const current=await currentSessionId(req);
 const [auditLogs,sessions]=await Promise.all([getAdminAuditLogs(50),transaction(repo=>repo.find<Session>("sessions",{userId:auth.user.id}))]);
 const activeSessions=sessions.filter(session=>Date.parse(session.expiresAt)>Date.now()).map(session=>({id:session.id,device:session.device || session.userAgent || "Device not recorded",ip:session.ip || "Not recorded",location:session.location || "Not recorded",lastActive:session.lastActiveAt || session.createdAt || "Not recorded",current:session.id===current}));
 return NextResponse.json({success:true,securityOverview:{activeSessions},auditLogs},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(req:NextRequest) {
 const origin=req.headers.get("origin");if(origin && origin!==req.nextUrl.origin && origin!==new URL(process.env.APP_ORIGIN || req.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 const auth=await authorizeAdminApi(req);if(!auth.authorized)return auth.response;
 const current=await currentSessionId(req);
 const revoked=await transaction(async repo=>{const sessions=await repo.find<Session>("sessions",{userId:auth.user.id});let count=0;for(const session of sessions){if(session.id!==current){await repo.remove("sessions",session.id);count++;}}return count;});
 await recordAuditEvent({actor:auth.user.email,action:"OWNER_SESSIONS_REVOKED",resource:"sessions",resourceId:auth.user.id,details:{revoked}});
 return NextResponse.json({success:true,revoked});
}
