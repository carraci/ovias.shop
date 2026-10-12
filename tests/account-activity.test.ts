import test from "node:test";
import assert from "node:assert/strict";
import { recordAccountActivity } from "../src/server/account-activity";
import type { Repository } from "../src/server/db";
import type { Order, Session, User } from "../src/lib/types";
import type { CareTicket } from "../src/lib/care";
import type { AccountActivity } from "../src/lib/account-activity";
function fixture() {
  const records = new Map<string,{id:string}>();
  const repo:Repository = {get:async <T extends {id:string}>(c:string,id:string)=>records.get(c+id) as T|undefined,find:async <T extends {id:string}>()=>[...records.values()] as T[],put:async(c,v)=>{records.set(c+v.id,v);},remove:async(c,id)=>{records.delete(c+id);}};
  return {repo,items:()=>[...records.entries()].filter(([key])=>key.startsWith("account_notifications")).map(([,v])=>v as AccountActivity)};
}
test("activity deduplicates provider refunds and preserves read state",async()=>{
  const {repo,items}=fixture();
  const order={id:"order-1",userId:"u1",provider:"razorpay",status:"paid",createdAt:"2026-10-01T10:00:00Z",refunds:[{id:"r1",status:"Refunded",amount:499900,updatedAt:"2026-10-02T10:00:00Z"}]} as Order;
  await recordAccountActivity(repo,"orders",order);
  const notification=items().find(item=>item.title==="Refund processed")!;
  assert.match(notification.href, /order-1\?section=payment#refund-r1$/);
  assert.doesNotMatch(notification.description,/credited/i);
  await repo.put("account_notifications",{...notification,readAt:"2026-10-03T10:00:00Z"});
  await recordAccountActivity(repo,"orders",order);
  assert.equal(items().length,2);
  assert.equal(items().find(item=>item.id===notification.id)?.readAt,"2026-10-03T10:00:00Z");
});
test("support activity excludes customer text and targets exact conversation",async()=>{
  const {repo,items}=fixture();
  const ticket={id:"t1",userId:"u1",subject:"raw customer test text",category:"Return",status:"Open",createdAt:"2026-10-01T10:00:00Z",updatedAt:"2026-10-01T10:00:00Z",messages:[{id:"m1",author:"support",text:"private reply",createdAt:"2026-10-02T10:00:00Z"}]} as CareTicket;
  await recordAccountActivity(repo,"tickets",ticket);
  assert.equal(items().length,2);
  assert.ok(items().every(item=>item.href==="/account/support?request=tickets%3At1"));
  assert.doesNotMatch(JSON.stringify(items()),/raw customer test text|private reply/);
});
test("simulated deliveries and demo orders never create notifications",async()=>{
  const {repo,items}=fixture();
  const order={id:"o1",userId:"u1",provider:"razorpay",status:"pending",createdAt:"2026-10-01T10:00:00Z",shipping:{events:[{isSimulated:true,status:"DELIVERED",timestamp:"2026-10-02T10:00:00Z"}]}} as Order;
  await recordAccountActivity(repo,"orders",order);
  assert.equal(items().length,1);
  await recordAccountActivity(repo,"orders",{...order,id:"demo",provider:"demo"} as Order);
  assert.equal(items().length,1);
});

test("new sign-ins create one security notification targeting that device session", async () => {
  const {repo,items}=fixture();
  const session={id:"device-session",userId:"u1",createdAt:"2026-10-12T10:00:00Z",expiresAt:"2026-10-19T10:00:00Z"} as Session;
  await recordAccountActivity(repo,"sessions",session);
  await recordAccountActivity(repo,"sessions",session);
  await recordAccountActivity(repo,"sessions",{...session,lastActiveAt:"2026-10-12T11:00:00Z"} as Session,session);
  assert.equal(items().length,1);
  assert.equal(items()[0].category,"Security");
  assert.equal(items()[0].href,"/account/security#session-device-session");
});

test("password and email changes create separate events without leaking credentials", async () => {
  const {repo,items}=fixture();
  const before={id:"u1",email:"old@example.test",passwordHash:"old-private-hash"} as User;
  const after={...before,email:"new@example.test",passwordHash:"new-private-hash"};
  await recordAccountActivity(repo,"users",after,before);
  await recordAccountActivity(repo,"users",after,before);
  assert.deepEqual(items().map(item=>item.title).sort(),["Email changed","Password changed"]);
  assert.ok(items().every(item=>item.href==="/account/security"));
  assert.doesNotMatch(JSON.stringify(items()),/old-private-hash|new-private-hash|old@example|new@example/);
});

test("ordinary profile edits do not produce duplicate security events", async () => {
  const {repo,items}=fixture();
  const before={id:"u1",email:"customer@example.test",passwordHash:"unchanged"} as User;
  await recordAccountActivity(repo,"users",{...before,name:"Updated Traveler"} as User,before);
  assert.equal(items().length,0);
});
