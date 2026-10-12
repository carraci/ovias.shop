export type AdminDateRange={from:string;to:string;label:string};
export function adminToday(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}
export function presetRange(label:string):AdminDateRange {
 const today=adminToday();const now=new Date(today+'T00:00:00Z');const start=new Date(now);let to=today;
 if(label==='Yesterday'){start.setUTCDate(start.getUTCDate()-1);to=start.toISOString().slice(0,10);}
 else if(label.startsWith('Last ') && label.includes('days'))start.setUTCDate(start.getUTCDate()-Number(label.split(' ')[1])+1);
 else if(label==='This Month')start.setUTCDate(1);
 else if(label==='Last Month'){start.setUTCDate(1);start.setUTCMonth(start.getUTCMonth()-1);to=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),0)).toISOString().slice(0,10);}
 else if(label==='This Quarter'){start.setUTCDate(1);start.setUTCMonth(Math.floor(start.getUTCMonth()/3)*3);}
 else if(label==='Year to Date'){start.setUTCMonth(0,1);}
 return {from:start.toISOString().slice(0,10),to,label};
}
