"use client";
import { useEffect, useRef, type ReactNode } from "react";

function useReveal(selector: string | null, delay: number, y: number, duration: number, stagger = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || matchMedia("(prefers-reduced-motion: reduce), (max-width: 768px)").matches) return;
    const animations: Animation[] = [];
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      const nodes = selector ? root.querySelectorAll<HTMLElement>(selector.trim().startsWith(">") ? `:scope ${selector.trim()}` : selector) : [root];
      nodes.forEach((node, index) => animations.push(node.animate([
        { opacity: 0, transform: `translateY(${y}px)` },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: duration * 1000, delay: (delay + index * stagger) * 1000, easing: "ease-out" })));
    }, { rootMargin: "0px 0px -12% 0px" });
    observer.observe(root);
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); };
  }, [selector, delay, y, duration, stagger]);
  return ref;
}
export function Reveal({children,className="",delay=0,y=32,duration=.85}:{children:ReactNode;className?:string;delay?:number;y?:number;duration?:number}) {
  const ref = useReveal(null,delay,y,duration);
  return <div ref={ref} className={`gsap-reveal ${className}`}>{children}</div>;
}
export function RevealGroup({children,className="",selector=":scope > *",stagger=.12,y=36,duration=.85}:{children:ReactNode;className?:string;selector?:string;stagger?:number;y?:number;duration?:number}) {
  const ref = useReveal(selector,0,y,duration,stagger);
  return <div ref={ref} className={`reveal-group ${className}`}>{children}</div>;
}
export function HeroMotion({children}:{children:ReactNode}) { return <div className="hero-motion">{children}</div>; }
