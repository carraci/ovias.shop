import {NextRequest,NextResponse} from "next/server";
import {authorizeAdminApi} from "@/server/admin-auth";
import {storefrontCatalog} from "@/server/storefront-catalog";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){const auth=await authorizeAdminApi(req);if(!auth.authorized)return auth.response;const products=await storefrontCatalog();return NextResponse.json({products:products.map(({id,name,slug,collection,category,department})=>({id,name,slug,collection,category,department}))},{headers:{"Cache-Control":"no-store"}});}
