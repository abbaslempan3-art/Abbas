import test from "node:test";
import assert from "node:assert/strict";
import handler from "./chat.js";

async function invoke({method="POST",token,body,ip="127.0.0.1"}={}) {
  const req={method,headers:{"x-forwarded-for":ip,...(token?{"x-abbas-access-token":token}:{})},body,socket:{remoteAddress:ip}};
  const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;return this;},status(n){this.statusCode=n;return this;},json(data){this.body=data;return this;}};
  await handler(req,res);
  return res;
}
const access="a".repeat(32);
test("rejects non-POST without contacting provider",async()=>{
  const r=await invoke({method:"GET"});assert.equal(r.statusCode,405);
});
test("fails closed when access secret is absent",async()=>{
  const prior=process.env.ABBAS_AI_ACCESS_TOKEN;delete process.env.ABBAS_AI_ACCESS_TOKEN;
  try{const r=await invoke({token:access});assert.equal(r.statusCode,503);assert.equal(r.body.error,"ACCESS_NOT_CONFIGURED");}
  finally{if(prior===undefined)delete process.env.ABBAS_AI_ACCESS_TOKEN;else process.env.ABBAS_AI_ACCESS_TOKEN=prior;}
});
test("rejects wrong token before reading Gemini key",async()=>{
  process.env.ABBAS_AI_ACCESS_TOKEN=access;
  const r=await invoke({token:"b".repeat(32)});assert.equal(r.statusCode,401);
});
test("rejects invalid message payload before external request",async()=>{
  process.env.ABBAS_AI_ACCESS_TOKEN=access;
  process.env.GEMINI_API_KEY="test-only-key";
  const r=await invoke({token:access,body:{messages:[{role:"user",text:""}]}});assert.equal(r.statusCode,400);
});
test("rejects oversized conversation",async()=>{
  process.env.ABBAS_AI_ACCESS_TOKEN=access;
  process.env.GEMINI_API_KEY="test-only-key";
  const r=await invoke({token:access,body:{messages:Array.from({length:21},()=>({role:"user",text:"hello"}))}});assert.equal(r.statusCode,400);
});
