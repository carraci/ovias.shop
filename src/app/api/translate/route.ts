import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { body, originCheck } from '@/server/http';
import { limit } from '@/server/http';
import { languages } from '@/lib/markets';
export const runtime = 'nodejs';
const cache = new Map<string,string>();
export async function POST(req:NextRequest) {
  try {
    originCheck(req);
    const deepLKey = process.env.DEEPL_API_KEY;
    const key = deepLKey || process.env.GOOGLE_TRANSLATE_API_KEY;
    if(!key) return NextResponse.json({error:'Translation is not configured. English content is shown.'},{status:503});
    await limit(req,'page-translation',60);
    const input=z.object({target:z.string().refine(value=>languages.some(([code])=>code===value)),texts:z.array(z.string().max(3000)).min(1).max(100)}).parse(await body(req));
    if(input.texts.join('').length>12000) return NextResponse.json({error:'Translation batch too large.'},{status:400});
    const missing=[...new Set(input.texts.filter(text=>!cache.has(input.target+'\0'+text)))];
    if(missing.length) {
      const target = input.target === 'zh-CN' ? 'ZH-HANS' : input.target === 'zh-TW' ? 'ZH-HANT' : input.target === 'pt' ? 'PT-PT' : input.target.toUpperCase();
      const response = deepLKey
        ? await fetch(`https://${deepLKey.endsWith(':fx') ? 'api-free' : 'api'}.deepl.com/v2/translate`, {method:'POST',headers:{'Content-Type':'application/json','Authorization':`DeepL-Auth-Key ${deepLKey}`},body:JSON.stringify({text:missing,target_lang:target,source_lang:'EN'}),signal:AbortSignal.timeout(15000)})
        : await fetch('https://translation.googleapis.com/language/translate/v2',{method:'POST',headers:{'Content-Type':'application/json','X-goog-api-key':key!},body:JSON.stringify({q:missing,target:input.target,source:'en',format:'text'}),signal:AbortSignal.timeout(15000)});
      if(!response.ok) throw new Error('Translation service unavailable. English content is shown.');
      const result=await response.json();
      const translated = deepLKey ? result.translations?.map((item:{text:string})=>item.text) : result.data?.translations?.map((item:{translatedText:string})=>item.translatedText);
      if(translated?.length!==missing.length) throw new Error('Translation service returned incomplete content.');
      if(cache.size>10000) cache.clear();
      missing.forEach((text,index)=>cache.set(input.target+'\0'+text,translated[index]));
    }
    return NextResponse.json({translations:input.texts.map(text=>cache.get(input.target+'\0'+text))},{headers:{'Cache-Control':'no-store'}});
  } catch {return NextResponse.json({error:'Translation service unavailable. English content is shown.'},{status:503});}
}

