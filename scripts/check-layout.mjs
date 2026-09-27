import { chromium } from '@playwright/test';
const browser=await chromium.launch();const page=await browser.newPage();
for(const width of [320,375,390,414,768,1024,1280,1440,1920]){await page.setViewportSize({width,height:900});await page.goto('http://localhost:3000/',{waitUntil:'networkidle'});console.log(JSON.stringify(await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)&&getComputedStyle(e).position!=='fixed';}).map(e=>({tag:e.tagName,class:e.className,right:e.getBoundingClientRect().right,text:e.textContent?.slice(0,50)})).slice(0,15)}))));}
await browser.close();
