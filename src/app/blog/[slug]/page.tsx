import { redirect } from "next/navigation";
export default async function BlogArticle({params}:{params:Promise<{slug:string}>}) {const {slug}=await params;redirect(`/journal/${encodeURIComponent(slug)}`);}
