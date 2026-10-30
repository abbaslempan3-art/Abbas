import {test} from 'node:test';
import assert from 'node:assert/strict';
import {products,safeLink,parseImport,queue,csv,scriptFor,PUBLISH_ENABLED,CLOUD_ENABLED} from '../model.js';
const p={name:'sample',link:'https://s.shopee.co.th/example'};
test('legacy data preserved and imports validated without unknown fields',()=>{
 assert.deepEqual(products([p]),[p]);assert.deepEqual(parseImport(JSON.stringify([p])),[p]);
 assert.deepEqual(parseImport(JSON.stringify({version:1,products:[p]})),[p]);
 for(const v of ['{}','null','{"version":2,"products":[]}','[{"name":"x","link":"javascript:alert(1)"}]','[{"name":"x","link":"https://shopee.co.th/","token":"secret"}]'])assert.throws(()=>parseImport(v));
 assert.throws(()=>parseImport(' '.repeat(1000001)));
});
test('URL rejects executable, credentials, spoofed host and token URLs',()=>{
 for(const u of ['javascript:alert(1)','http://shopee.co.th','https://evilshopee.co.th/','https://shopee.co.th.evil.org/','https://user:pass@shopee.co.th/','https://shopee.co.th/?token=x','https://shopee.co.th/#secret','https://shopee.co.th:444/'])assert.throws(()=>safeLink(u));
 assert.equal(safeLink(p.link),p.link);
});
test('CSV formula injection neutralized and scripts disclose affiliate relationship',()=>{
 assert.match(csv([{...p,name:'=HYPERLINK("bad")'}]),/"'=HYPERLINK/);
 assert.match(scriptFor(p,'overview'),/Affiliate/);assert.throws(()=>scriptFor(null));
 assert.equal(PUBLISH_ENABLED,false);assert.equal(CLOUD_ENABLED,false);
});
test('queue validates review states and retains text as data',()=>{
 assert.equal(queue([{...p,script:'<script>not executable</script>',status:'pending'}]).length,1);
 assert.throws(()=>queue([{...p,script:'x',status:'published'}]));
});
