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

test("valid private request sends to Gemini and returns assistant text (mocked)",async()=>{
  process.env.ABBAS_AI_ACCESS_TOKEN=access;
  process.env.GEMINI_API_KEY="test-only-key";
  const original=globalThis.fetch;
  let called=0;
  globalThis.fetch=async(url,options)=>{
    called++;
    assert.ok(String(url).includes("gemini-2.5-flash:generateContent"));
    assert.equal(options.headers["x-goog-api-key"],"test-only-key");
    const payload=JSON.parse(options.body);
    assert.equal(payload.contents[0].role,"user");
    assert.equal(payload.contents[0].parts[0].text,"สวัสดี");
    return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:"สวัสดีค่ะเจ้านาย"}]}}]})};
  };
  try {
    const result=await invoke({token:access,ip:"198.51.100.25",body:{messages:[{role:"user",text:"สวัสดี"}]}});
    assert.equal(result.statusCode,200);
    assert.equal(result.body.text,"สวัสดีค่ะเจ้านาย");
    assert.equal(called,1);
  } finally {globalThis.fetch=original;}
});
test("Gemini quota error maps to safe 429 response (mocked)",async()=>{
  process.env.ABBAS_AI_ACCESS_TOKEN=access;
  process.env.GEMINI_API_KEY="test-only-key";
  const original=globalThis.fetch;
  globalThis.fetch=async()=>({ok:false,status:429});
  try{
    const result=await invoke({token:access,ip:"198.51.100.26",body:{messages:[{role:"user",text:"hello"}]}});
    assert.equal(result.statusCode,429);
    assert.equal(result.body.error,"QUOTA_EXCEEDED");
  } finally {globalThis.fetch=original;}
});

test("per-instance throttle blocks sixth authenticated request without provider call (mocked)",async()=>{
  process.env.ABBAS_AI_ACCESS_TOKEN=access;
  process.env.GEMINI_API_KEY="test-only-key";
  const original=globalThis.fetch;
  let calls=0;
  globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:"ok"}]}}]})};};
  try{
    const ip="198.51.100.190";
    for(let i=0;i<5;i++){
      const result=await invoke({token:access,ip,body:{messages:[{role:"user",text:"hello"}]}});
      assert.equal(result.statusCode,200);
    }
    const blocked=await invoke({token:access,ip,body:{messages:[{role:"user",text:"hello"}]}});
    assert.equal(blocked.statusCode,429);
    assert.equal(blocked.body.error,"RATE_LIMITED");
    assert.equal(calls,5);
  } finally {globalThis.fetch=original;}
});

test("Gemini 404 tries successive catalog-listed Flash models (mocked)", async () => {
  process.env.ABBAS_AI_ACCESS_TOKEN=access;
  process.env.GEMINI_API_KEY="test-only-key";
  const original=globalThis.fetch;
  const urls=[];
  globalThis.fetch=async (url) => {
    urls.push(String(url));
    if (String(url).includes("pageSize=100")) return {ok:true,json:async()=>({models:[
      {name:"models/gemini-2.5-flash-lite",supportedGenerationMethods:["generateContent"]},
      {name:"models/gemini-2.0-flash",supportedGenerationMethods:["generateContent"]}
    ]})};
    if (String(url).includes("gemini-2.0-flash:generateContent")) return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:"ตอบได้ค่ะ"}]}}]})};
    return {ok:false,status:404};
  };
  try {
    const result=await invoke({token:access,ip:"198.51.100.201",body:{messages:[{role:"user",text:"สวัสดี"}]}});
    assert.equal(result.statusCode,200);
    assert.equal(result.body.text,"ตอบได้ค่ะ");
    assert.equal(urls.length,4);
  } finally {globalThis.fetch=original;}
});
