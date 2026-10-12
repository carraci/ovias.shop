import {test,expect} from "@playwright/test";
import {build} from "esbuild";
test("preview and edit open inside the selected post",async({page})=>{
 const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {BlogManager} from './src/components/admin/blog-manager';createRoot(document.getElementById('root')).render(<BlogManager/>);`,resolveDir:process.cwd(),loader:"tsx"},bundle:true,write:false,platform:"browser",jsx:"automatic",define:{"process.env.NODE_ENV":'"production"'}});
 await page.route("**/blog-manager-test",route=>route.fulfill({contentType:"text/html",body:'<html><body><div id="root"></div></body></html>'}));
 await page.route("**/api/admin/articles",route=>route.fulfill({json:{posts:[{id:"fixture",title:"Preview test",slug:"fixture",status:"draft",excerpt:"Excerpt",thumbnail:"",updatedAt:"2026-10-11T00:00:00Z",content:"Article preview body"}]}}));
 await page.goto("/blog-manager-test");await page.addScriptTag({content:bundle.outputFiles[0].text});
 const post=page.locator("article");await post.getByRole("button",{name:"Preview",exact:true}).click();await expect(post.getByText("Article preview body",{exact:true})).toBeVisible();
 await post.getByRole("button",{name:"Edit",exact:true}).click();await expect(post.getByRole("heading",{name:"Edit Blog Post"})).toBeVisible();await expect(post.getByLabel("Title",{exact:true})).toHaveValue("Preview test");await expect(post.getByLabel("Content")).toHaveValue("Article preview body");await expect(post.getByRole("button",{name:"Close preview"})).toHaveCount(0);
});
