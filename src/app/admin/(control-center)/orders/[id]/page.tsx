"use client";
import {use,useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {CourierPractice} from "@/components/admin/courier-practice";
import {OrderProgress} from "@/components/admin/order-progress";
import styles from "./order-detail.module.css";
import type {OrderShipping} from "@/lib/shipping/types";
type Detail={id:string;rawId:string;amount:number;itemsCount:number;date:string;customer:{name:string;email:string;phone:string};address:{shipping:string};lines:{sku:string;name:string;color:string;quantity:number;price:number;image:string}[]};
type Workflow={stage:string;payment:string;canPack:boolean;canCancel:boolean;canRequestReturn:boolean;delivered:boolean;dispatched:boolean;shipment?:OrderShipping;operation?:{status:string;message?:string};refunds:{status:string;amount:number}[];returnRequest?:{status:string}};
const money=(value:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(value);
export default function OrderDetails({params}:{params:Promise<{id:string}>}) {
 const {id}=use(params);const [order,setOrder]=useState<Detail|null>(null);const [workflow,setWorkflow]=useState<Workflow|null>(null);const [error,setError]=useState("");const [busy,setBusy]=useState(false);const [panel,setPanel]=useState<""|"pack"|"cancel"|"return"|"tracking">("");const [reason,setReason]=useState("Out of stock");const [parcel,setParcel]=useState({weightGrams:"",length:"",width:"",height:""});const [message,setMessage]=useState("");const loading=useRef(false);
 const load=useCallback(async()=>{if(loading.current)return;loading.current=true;try{const response=await fetch(`/api/admin/orders/${encodeURIComponent(id)}`,{cache:"no-store",signal:AbortSignal.timeout(30000)});const data=await response.json();if(!response.ok)throw new Error(data.error);setOrder(data.order);setWorkflow(data.workflow);setError("");}catch(cause){setError(cause instanceof Error?cause.message:"Order unavailable");}finally{loading.current=false;}},[id]);
 useEffect(()=>{void load();const timer=setInterval(()=>{if(document.visibilityState==="visible")void load();},10000);return()=>clearInterval(timer);},[load]);
 useEffect(()=>{
  if(!order?.rawId || !workflow?.shipment?.awb || workflow.delivered)return;
  let running=false;const controller=new AbortController();
  const sync=async()=>{if(running||window.document.visibilityState!=="visible")return;running=true;try{const response=await fetch(`/api/admin/orders/${encodeURIComponent(order.rawId)}/tracking`,{method:"POST",signal:controller.signal});if(!response.ok)throw new Error("Courier tracking refresh failed. Last stored status is shown.");await load();}catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Tracking unavailable");}finally{running=false;}};
  const timer=setInterval(()=>void sync(),60000);return()=>{clearInterval(timer);controller.abort();};
 },[order?.rawId,workflow?.shipment?.awb,workflow?.delivered,load]);
 async function act(action:"pack"|"cancel"|"return"|"tracking") {
  if(!order||busy)return;setBusy(true);setError("");setMessage("");
  try{const base=`/api/admin/orders/${encodeURIComponent(order.rawId)}`;const url=action==="return"?`${base}/return-request`:action==="tracking"?`${base}/tracking`:`${base}/shipment`;
   const payload=action==="pack"?{action:"approve",confirmed:true,package:Object.fromEntries(Object.entries(parcel).map(([key,value])=>[key,Number(value)]))}:action==="cancel"?{confirmed:true,reason}:action==="return"?{confirmed:true,reason}:{confirmed:true};
   const response=await fetch(url,{method:action==="cancel"?"DELETE":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error);
   setMessage(action==="return"?"Request saved. Courier approval is pending; contact the courier with the AWB to arrange return.":result.operation?.message || "Saved. Courier and refund statuses below show confirmed progress.");setPanel("");await load();
  }catch(cause){setError(cause instanceof Error?cause.message:"Action failed");await load();}finally{setBusy(false);}
 }
 function openDocument(type="summary"){if(order)window.open(`/api/admin/orders/${encodeURIComponent(order.rawId)}/document?type=${type}`,"_blank","noopener,noreferrer");}
 if(!order)return <section className={styles.paper}><h1>Order details</h1><p role="status">{error||"Loading live order…"}</p>{error&&<button onClick={()=>void load()}>Retry</button>}</section>;
 const stage=workflow?.stage.replaceAll("_"," ")||"Not confirmed";
 return <section className={styles.paper} aria-busy={busy}><div className={styles.brand}><Link href="/admin/orders">OVIA</Link><span>Live order data</span></div><p className={styles.subtitle}>Order &amp; Delivery</p><div className={styles.viewTabs}><span>Shop Owner</span><span>Customer &amp; delivery</span></div><header><div><small>ORDER {order.id}</small><h1>{money(order.amount)}</h1><p>{order.itemsCount} items · {workflow?.payment||"Payment not confirmed"}</p></div><span>{stage}</span></header>
 {error&&<p role="alert" className={styles.error}>{error}</p>}{message&&<p role="status">{message}</p>}
 <section className={styles.section}><h2>Customer & delivery</h2><p>{order.customer.name}<br/>{order.address.shipping}<br/>{order.customer.email} · {order.customer.phone}</p></section>
 <ul className={styles.items}>{order.lines.map((line,index)=><li key={`${line.sku}-${index}`}><div>{line.image&&<img src={line.image} alt="" loading="lazy"/>}<span>{line.name} · {line.color}<small>{line.sku}</small></span></div><span>×{line.quantity}</span></li>)}</ul>
 {workflow?.operation&&<p role="status">{workflow.operation.status}: {workflow.operation.message || "Logistics operation recorded"}</p>}
 {workflow?.refunds.map((refund,index)=><p key={index}>Refund: {refund.status} · {money(refund.amount/100)}</p>)}
 <section className={styles.section}><h2>{workflow?.canPack?"Prepare this order":workflow?.shipment?.awb?"Courier & delivery":"Order status"}</h2><p>{workflow?.canPack?"Pack the items and confirm the parcel measurements. Courier booking and tracking use the live provider.":workflow?.delivered?"Delivery confirmed by courier.":workflow?.shipment?.awb?`${workflow.shipment.courier} · AWB ${workflow.shipment.awb}`:workflow?.stage==="CANCELLED"?"This order is cancelled. Payment and refund statuses above reflect stored records.":"Shipping will be available after payment is confirmed."}</p>
 {workflow?.canPack?<button className={styles.primary} disabled={busy} onClick={()=>setPanel("pack")}>Mark as Packed →</button>:workflow?.shipment?.awb?<button className={styles.primary} onClick={()=>window.open(`/api/admin/orders/${encodeURIComponent(order.rawId)}/shipping-label`,"_blank","noopener,noreferrer")}>Print Shipping Label →</button>:null}
 {workflow&&!workflow.dispatched&&!workflow.delivered&&<button disabled={busy||!workflow.canCancel} title={workflow.canCancel?"Cancel this order":"Cancellation is unavailable for the current order status"} onClick={()=>setPanel("cancel")}>{workflow.stage==="CANCELLED"?"Order Cancelled":"Cancel Order"}</button>}
 {workflow?.canRequestReturn&&!workflow.returnRequest&&<button disabled={busy} onClick={()=>setPanel("return")}>Request Return to Seller</button>}{workflow?.returnRequest&&<p>Return request: {workflow.returnRequest.status}</p>}
 </section>
 {(panel==="pack"||panel==="cancel"||panel==="return")&&<form className={styles.confirm} onSubmit={event=>{event.preventDefault();void act(panel);}}><h2>{panel==="pack"?"Confirm packed parcel":panel==="cancel"?"Cancel Order":"Request return to seller?"}</h2><p>{panel==="pack"?"Enter measured weight and dimensions. Confirm books the courier shipment and pickup.":panel==="cancel"?"Cancellation must be checked against the current shipment status. Eligible shipping will be stopped and any due refund handled by the payment service.":"This records a request pending courier approval. It does not confirm a return or refund."}</p>{panel==="pack"?<div className={styles.fields}>{Object.entries(parcel).map(([key,value])=><label key={key}>{key==="weightGrams"?"Weight (g)":`${key} (cm)`}<input type="number" required min="1" max={key==="weightGrams"?100000:300} step={key==="weightGrams"?1:"any"} value={value} onChange={event=>setParcel({...parcel,[key]:event.target.value})}/></label>)}</div>:<label>Reason<select value={reason} onChange={event=>setReason(event.target.value)}><option>Customer requested</option><option>Wrong address</option><option>Out of stock</option><option>Other</option></select></label>}<div className={styles.actions}><button type="button" disabled={busy} onClick={()=>setPanel("")}>Back</button><button className={panel==="pack"?styles.primary:styles.danger} disabled={busy || (panel==="cancel"&&!workflow?.canCancel)}>{busy?"Working…":"Confirm"}</button></div></form>}
 {workflow&&<OrderProgress payment={workflow.payment} stage={stage} shipment={workflow.shipment} operation={workflow.operation} refunds={workflow.refunds}/> }
 <CourierPractice key={order.rawId}/>
 <footer><button onClick={()=>openDocument()}>Print Order</button><button onClick={()=>setPanel(panel==="tracking"?"":"tracking")}>Tracking Details</button><button onClick={()=>openDocument("packing")}>Packing Slip</button></footer>
 {panel==="tracking"&&<section className={styles.section}><h2>Delivery timeline</h2>{workflow?.shipment?<><p>{workflow.shipment.status.replaceAll("_"," ")} · Estimated delivery: {workflow.shipment.estimatedDelivery||"Not confirmed"}</p><ol>{workflow.shipment.events?.filter(event=>!event.isSimulated).map((event,index)=><li key={index}>{event.description} · {event.location} · {event.timestamp}</li>)}</ol><button disabled={busy} onClick={()=>void act("tracking")}>Refresh Courier Tracking</button></>:<p>No verified courier shipment recorded.</p>}</section>}
 </section>;
}







