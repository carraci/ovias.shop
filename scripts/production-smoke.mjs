import { chromium } from '@playwright/test';
const origin='http://127.0.0.1:3001';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));const results=[];
for(const route of ['/','/luggage','/products/meridian-cabin','/account/sign-in','/services/faq']){const response=await page.goto(origin+route,{waitUntil:'networkidle'});if(response.status()!==200)throw new Error(`Unexpected ${response.status()} on ${route}`);results.push({route,status:response.status(),heading:await page.locator('h1').first().textContent()});}
const catalog=await (await fetch(origin+'/api/v1/products')).json();if(catalog.data.total!==76)throw new Error('Catalog count mismatch');const cart=await fetch(origin+'/api/v1/cart');if(cart.status!==503)throw new Error('Production writes should require configured MongoDB');console.log(JSON.stringify({pages:results,catalog:catalog.data.total,unconfiguredProductionCart:cart.status,browserErrors:errors},null,2));await browser.close();if(errors.length)process.exitCode=1;

