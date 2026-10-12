"use client";
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Keep existing text nodes intact so React can continue updating live products.
export function PageTranslation({locale}:{locale:string}) {
  const pathname=usePathname();
  const [error,setError]=useState('');
  useEffect(()=>{
    setError('');
    if(locale.startsWith('en') || /^\/(admin|account|checkout|cart|contact)/.test(pathname || '')) {
      document.documentElement.lang='en';document.documentElement.dir='ltr';return;
    }
    const originals=new Map<Text,{source:string;translated:string}>();
    const translations=new Map<string,string>();
    const controller=new AbortController();
    let timer:ReturnType<typeof setTimeout>;let running=false;let stopped=false;
    const skip='script,style,noscript,input,textarea,select,[contenteditable],.notranslate,[translate="no"],[role="dialog"],#translation-status';
    async function translate() {
      if(running || stopped) return;
      running=true;
      try {
        const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
        const nodes:Text[]=[];let node:Node|null;
        while((node=walker.nextNode())) {
          const text=node as Text;
          if(!text.parentElement || text.parentElement.closest(skip)) continue;
          const current=text.data.trim();const prior=originals.get(text);
          if(prior && current===prior.translated.trim()) continue;
          if(!/[a-zA-Z]{2}/.test(current) || current.length>3000 || /@|https?:\/\//.test(current)) continue;
          nodes.push(text);
        }
        for(let start=0;start<nodes.length;) {
          const batch:Text[]=[];let size=0;
          while(start<nodes.length && batch.length<80 && size<2500) {const text=nodes[start++];batch.push(text);size+=text.data.length;}
          const sources=batch.map(text=>text.data.trim());
          const missing=[...new Set(sources.filter(text=>!translations.has(text)))];
          if(missing.length) {
            const response=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({target:locale,texts:missing}),signal:controller.signal});
            const result=await response.json();
            if(!response.ok) throw new Error(result.error || 'Translation unavailable.');
            missing.forEach((source,index)=>translations.set(source,result.translations[index]));
          }
          if(stopped) return;
          observer.disconnect();
          batch.forEach((text,index)=>{
            const source=text.data;const translated=translations.get(sources[index]);
            if(!text.isConnected || !translated || source.trim()!==sources[index]) return;
            const value=source.replace(source.trim(),translated);
            originals.set(text,{source,translated:value});text.data=value;
          });
          observer.observe(document.body,{subtree:true,childList:true,characterData:true});
          document.documentElement.lang=locale;document.documentElement.dir=locale==='ar'?'rtl':'ltr';
        }
      } catch(e) {if(!controller.signal.aborted) {setError((e as Error).message);stopped=true;}}
      finally {running=false;}
    }
    const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>void translate(),300);});
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    void translate();
    return ()=>{stopped=true;controller.abort();observer.disconnect();clearTimeout(timer);originals.forEach(({source,translated},node)=>{if(node.isConnected && node.data===translated)node.data=source;});document.documentElement.lang='en';document.documentElement.dir='ltr';};
  },[locale,pathname]);
  return error ? <div id="translation-status" role="status" translate="no" style={{position:'fixed',bottom:12,left:12,zIndex:1000,background:'white',border:'1px solid #ddd',padding:12,fontSize:12,maxWidth:340}}>{error}</div>:null;
}
