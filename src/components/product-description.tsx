import { Fragment } from "react";

export function ProductDescription({text}:{text:string}) {
  const inline=(line:string)=>line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part,index)=>part.startsWith("**")?<strong key={index}>{part.slice(2,-2)}</strong>:part.startsWith("*")?<em key={index}>{part.slice(1,-1)}</em>:<Fragment key={index}>{part}</Fragment>);
  return <>{text.split("\n").map((line,index)=>line.startsWith("## ")?<strong key={index} style={{display:"block",fontSize:"1.1em",marginTop:8}}>{inline(line.slice(3))}</strong>:<span key={index} style={{display:"block",minHeight:line?undefined:"0.6em"}}>{inline(line.startsWith("- ")?`• ${line.slice(2)}`:line)}</span>)}</>;
}
