"use client";
import {useState} from "react";
export function CourierPractice(){
 const [step,setStep]=useState(0);
 const stages=["Awaiting pickup","Picked Up","In Transit","Out for Delivery","Delivered"];
 const actions=["Simulate Pickup Scan","Simulate Transit Scan","Simulate Out for Delivery","Simulate Delivery Scan"];
 return <details style={{marginTop:20,border:"1px solid #ddd",borderRadius:10,padding:14}}><summary style={{cursor:"pointer",fontWeight:600}}>Courier Event Tester · Practice only</summary><p style={{fontSize:12,color:"#666",marginTop:12}}>Presentation demo only. In production, courier events arrive from Delhivery automatically. This practice does not change the order, payment, refund, or live delivery progress.</p><div role="status" aria-live="polite" style={{marginBottom:12}}>Practice stage: <strong>{stages[step]}</strong></div><ol aria-label="Practice courier timeline" style={{paddingLeft:20}}>{stages.slice(1).map((stage,index)=><li key={stage} style={{color:step>index?"#111":"#888",padding:"4px 0"}}>{step>index?"✓ ":"○ "}{stage} · simulated</li>)}</ol>{step<actions.length&&<button type="button" style={{width:"100%",marginTop:10}} onClick={()=>setStep(previous=>Math.min(previous+1,4))}>{actions[step]}</button>}<button type="button" style={{width:"100%",marginTop:10}} onClick={()=>setStep(0)}>Reset Practice</button></details>;
}
