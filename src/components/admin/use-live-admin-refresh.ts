"use client";
import {useEffect,useRef} from "react";

/** Refresh list data without resetting forms or remounting the page. */
export function useLiveAdminRefresh(refresh:()=>void|Promise<void>,intervalMs=5000) {
  const callback=useRef(refresh);
  useEffect(()=>{callback.current=refresh;},[refresh]);
  useEffect(()=>{
    let running=false;
    const update=async()=>{if(running || document.visibilityState!=="visible")return;running=true;try{await callback.current();}catch(error){console.error("Live refresh failed",error);}finally{running=false;}};
    const timer=setInterval(()=>void update(),intervalMs);
    window.addEventListener("focus",update);document.addEventListener("visibilitychange",update);
    return()=>{clearInterval(timer);window.removeEventListener("focus",update);document.removeEventListener("visibilitychange",update);};
  },[intervalMs]);
}
