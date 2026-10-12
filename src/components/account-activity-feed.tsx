"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, Package, RotateCcw, MessageCircle, ShieldCheck, ChevronRight } from "lucide-react";
import type { AccountActivity } from "@/lib/account-activity";
import { request, useStore } from "./store-provider";
import { useSupportRealtime } from "./use-support-realtime";
import styles from "./account-activity-feed.module.css";
const filters = ["All", "Orders", "Returns & refunds", "Support", "Security"];
export function AccountActivityFeed() {
  const {user} = useStore();
  const [items,setItems] = useState<AccountActivity[]>([]), [filter,setFilter] = useState("All");
  const [loading,setLoading] = useState(true), [error,setError] = useState(""), [busy,setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try { setItems(await request<AccountActivity[]>("account/activity", "GET", undefined, AbortSignal.timeout(30000))); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load activity."); }
    finally { setLoading(false); }
  }, [user?.id]);
  useSupportRealtime(() => void refresh(), !!user);
  useEffect(() => { if (!user) return; void refresh(); const timer = setInterval(() => {if (!document.hidden) void refresh();},10000); return () => clearInterval(timer); },[refresh,user?.id]);
  const unread = items.filter(item => !item.readAt);
  async function mark(ids: string[]) {
    if (!ids.length || busy) return; setBusy(true);
    try {
      for (let index=0;index<ids.length;index+=500) {
        const batch=ids.slice(index,index+500);
        const result = await request<{readAt:string}>("account/activity","PATCH",{ids:batch});
        setItems(current => current.map(item => batch.includes(item.id) ? {...item,readAt:result.readAt} : item));
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to mark activity as read."); }
    finally {setBusy(false);}
  }
  if (!user) return <Link href="/account/sign-in">Sign in to view account activity</Link>;
  return <section className={styles.page}>
    <p className={styles.eyebrow}>MY OVIA / ACCOUNT ACTIVITY</p>
    <header><div><h1>Account activity.</h1><p>Updates about your orders and account.</p></div><Bell aria-hidden="true" size={20}/></header>
    <div className={styles.readBar}><span>{unread.length} unread</span><button disabled={busy || !unread.length} onClick={() => void mark(unread.map(item=>item.id))}>Mark all as read</button></div>
    <nav aria-label="Activity filters">{filters.map(value => <button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{value}</button>)}</nav>
    {error && <p role="alert">{error} <button onClick={()=>void refresh()}>Try again</button></p>}
    {loading ? <p role="status">Loading activity…</p> : <div className={styles.list}>{items.filter(item=>filter==="All"||item.category===filter).map(item => {
      const Icon = item.category === "Orders" ? Package : item.category === "Returns & refunds" ? RotateCcw : item.category === "Support" ? MessageCircle : ShieldCheck;
      return <Link key={item.id} className={styles.row} href={item.href} onClick={()=>{if(!item.readAt) void mark([item.id]);}}>
        <span className={styles.icon}><Icon size={17}/></span><div><strong>{item.title}{!item.readAt&&<span className={styles.dot} aria-label="Unread"/>}</strong><p>{item.description}</p><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit"})}</time></div><ChevronRight size={17}/>
      </Link>;
    })}{!items.some(item=>filter==="All"||item.category===filter)&&<p>No activity in this category.</p>}</div>}
  </section>;
}
