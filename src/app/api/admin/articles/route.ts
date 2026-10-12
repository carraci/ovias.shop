import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { transaction, readRepository } from "@/server/db";
import type {Story} from "@/lib/types";
import { originCheck } from "@/server/http";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
export const runtime = "nodejs";
export async function GET(req:NextRequest){
 const auth=await authorizeAdminApi(req);if(!auth.authorized)return auth.response;
 try{const stories=await readRepository(repo=>repo.find<Story>("stories"));return NextResponse.json({posts:stories.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(post=>({id:post.id,title:post.title,slug:post.slug,status:post.status,excerpt:post.excerpt,thumbnail:post.thumbnail,updatedAt:post.updatedAt,content:post.content || post.contentBlocks.map(block=>block.text||"").filter(Boolean).join("\n\n")}))},{headers:{"Cache-Control":"private, no-store"}});}catch{return NextResponse.json({error:"Stored posts could not be loaded."},{status:503});}
}
export async function PATCH(req:NextRequest){
 const auth=await authorizeAdminApi(req);if(!auth.authorized)return auth.response;
 try{originCheck(req);const input=await req.json();if(typeof input.id!=="string"||typeof input.title!=="string"||!input.title.trim()||input.title.length>200||typeof input.content!=="string"||!input.content.trim()||input.content.length>200000||!["draft","published"].includes(input.status))return NextResponse.json({error:"Enter a valid title, content and status."},{status:400});
 const post=await transaction(async repo=>{const current=await repo.get<Story>("stories",input.id);if(!current)return null;const next={...current,title:input.title.trim(),content:input.content.trim(),excerpt:input.content.trim().slice(0,160),status:input.status,updatedAt:new Date().toISOString(),publishedAt:input.status==="published"?(current.publishedAt||new Date().toISOString()):current.publishedAt,contentBlocks:input.content.split(/\n\s*\n/).filter(Boolean).map((text:string)=>({id:randomUUID(),type:"paragraph" as const,text}))};await repo.put("stories",next);return next;});if(!post)return NextResponse.json({error:"Article not found"},{status:404});revalidatePath("/journal");revalidatePath(`/journal/${post.slug}`);revalidatePath("/");return NextResponse.json({success:true});
 }catch{return NextResponse.json({error:"Article update failed. Please retry."},{status:503});}
}
export async function DELETE(req:NextRequest){
 const auth=await authorizeAdminApi(req);if(!auth.authorized)return auth.response;
 try{originCheck(req);const input=await req.json();if(typeof input.id!=="string")return NextResponse.json({error:"Article ID required"},{status:400});const post=await transaction(async repo=>{const post=await repo.get<Story>("stories",input.id);if(post)await repo.remove("stories",input.id);return post;});if(!post)return NextResponse.json({error:"Article not found"},{status:404});revalidatePath("/journal");revalidatePath(`/journal/${post.slug}`);revalidatePath("/");return NextResponse.json({success:true});}catch{return NextResponse.json({error:"Article deletion failed. Please retry."},{status:503});}
}
export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  try {
    originCheck(req);
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await req.formData(); const file = form.get("file");
      if (!(file instanceof File) || file.size > 10 * 1024 * 1024) return NextResponse.json({error:"Choose a PDF, DOCX or TXT file under 10 MB."},{status:400});
      const buffer = Buffer.from(await file.arrayBuffer()); let text = "";
      const extension = file.name.split(".").at(-1)?.toLowerCase();
      if (extension === "txt") text = buffer.toString("utf8");
      else if (extension === "docx") { const {extractRawText} = await import("mammoth"); text = (await extractRawText({buffer})).value; }
      else if (extension === "pdf") { const {PDFParse} = await import("pdf-parse"); const parser = new PDFParse({data:buffer}); try {text = (await parser.getText()).text;} finally {await parser.destroy();} }
      else return NextResponse.json({error:"Only PDF, DOCX and TXT files are supported."},{status:400});
      text = text.trim(); if (!text) return NextResponse.json({error:"No readable text found. Scanned PDFs need text recognition before upload."},{status:400});
      if (text.length > 200000) return NextResponse.json({error:"Article text is too long."},{status:400});
      return NextResponse.json({title:text.split(/\r?\n/).find(line=>line.trim())?.slice(0,200), content:text});
    }
    const data = await req.json(); const title = String(data.title || "").trim(); const content = String(data.content || "").trim();
    const slug = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,180);
    if (!title || title.length>200 || !slug || !content || content.length>200000 || !["draft","published"].includes(data.status)) return NextResponse.json({error:"Enter a title and article content."},{status:400});
    const now=new Date().toISOString();
    const story = {id:randomUUID(),title,slug,content,excerpt:content.slice(0,160),category:"Travel",heroImage:"",thumbnail:"",gallery:[],relatedProducts:[],tags:[],status:data.status,publishedAt:now,createdAt:now,updatedAt:now,featured:false,author:auth.user.name,readingTime:`${Math.max(1,Math.ceil(content.split(/\s+/).length/200))} min read`,contentBlocks:content.split(/\n\s*\n/).filter(Boolean).map(text=>({id:randomUUID(),type:"paragraph",text}))};
    await transaction(async repo=>{ if ((await repo.find<any>("stories",{slug})).length) throw new Error("An article with this title URL already exists."); await repo.put("stories",story); });
    revalidatePath("/journal"); revalidatePath(`/journal/${slug}`);
    return NextResponse.json({success:true,slug,status:data.status});
  } catch (error) {return NextResponse.json({error:error instanceof Error && error.message.includes("already exists") ? error.message : "Article could not be processed or saved. Please retry."},{status:503});}
}
