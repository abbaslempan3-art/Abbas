import {test,expect} from '@playwright/test';
const path='/Abbas/affiliate-autopilot/';
test('subpath, legacy data, CRUD, export/import, prompt, review and mobile',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('aa_products',JSON.stringify([{name:'legacy',link:'https://s.shopee.co.th/old'}])));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(path);await expect(page.locator('#rows')).toContainText('legacy');
 await page.locator('#name').fill('new');await page.locator('#link').fill('https://shopee.co.th/new');await page.locator('#save').click();
 await expect(page.locator('#count')).toHaveText('2');
 await page.locator('#rows tr').last().getByText('แก้ไข').click();await page.locator('#name').fill('<img src=x onerror=alert(1)>');await page.locator('#save').click();
 await expect(page.locator('#rows img')).toHaveCount(0);
 await page.locator('#script').click();await page.locator('#enqueue').click();await expect(page.locator('#queue')).toContainText('รอตรวจด้วยคน');
 page.on('dialog',d=>d.accept());await page.locator('#queue').getByText('อนุมัติหลังตรวจ', {exact:false}).click();await expect(page.locator('#queue')).toContainText('ตรวจแล้วด้วยคน');
 await page.locator('#rows tr').first().getByText('แก้ไข').click();await page.locator('#name').fill('legacy revised');await page.locator('#save').click();await expect(page.locator('#queue')).toContainText('รอตรวจด้วยคน');
 await page.locator('#makePrompt').click();await expect(page.locator('#aiPrompt')).toContainText('Affiliate');
 const download=page.waitForEvent('download');await page.locator('#exportJson').click();expect((await download).suggestedFilename()).toBe('affiliate-products.json');
 await page.locator('#importFile').setInputFiles({name:'products.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,products:[{name:'imported',link:'https://shopee.co.th/imported'}]}))});await page.locator('#confirmImport').click();await expect(page.locator('#count')).toHaveText('3');
 await page.locator('#rows tr').last().getByText('ลบ',{exact:true}).click();await expect(page.locator('#count')).toHaveText('2');
 await page.setViewportSize({width:320,height:700});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('corrupt storage and concurrent edits are never overwritten',async({page})=>{
 await page.goto(path);await page.evaluate(()=>localStorage.setItem('aa_products','broken'));await page.reload();await expect(page.locator('#notice')).toContainText('หยุดการเขียน');
 await page.locator('#name').fill('x');await page.locator('#link').fill('https://shopee.co.th/');await page.locator('#save').click();expect(await page.evaluate(()=>localStorage.getItem('aa_products'))).toBe('broken');
 await page.evaluate(()=>localStorage.removeItem('aa_products'));await page.reload();await page.evaluate(()=>localStorage.setItem('aa_products','[]'));
 await page.locator('#name').fill('x');await page.locator('#link').fill('https://shopee.co.th/');await page.locator('#save').click();await expect(page.locator('#notice')).toContainText('แท็บอื่น');
});
