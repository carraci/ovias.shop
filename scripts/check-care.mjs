import {chromium} from '@playwright/test';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const [slug,path] of [['help','/help'],['heritage','/heritage'],['signup','/account/register'],['privacy','/privacy'],['preferences','/preferences']]){await page.goto('http://localhost:3000'+path);await page.locator('main h1').waitFor();await page.screenshot({path:`artifacts/${slug}-upgrade.png`});}
await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3000/account/register');await page.screenshot({path:'artifacts/signup-upgrade-mobile.png',fullPage:true});console.log(JSON.stringify({errors}));await browser.close();
