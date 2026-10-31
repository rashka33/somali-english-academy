/* Run with Playwright installed: node tests/ui.cjs. Optional CHROMIUM_PATH. */
const {chromium}=require('playwright');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const entry=[{word:'hello',phonetic:'/həˈləʊ/',phonetics:[],meanings:[{partOfSpeech:'interjection',definitions:[{definition:'Used as a greeting.',example:'Hello, Sam!'}]}],sourceUrls:['https://en.wiktionary.org/wiki/hello'],license:{name:'CC BY-SA 3.0',url:'https://creativecommons.org/licenses/by-sa/3.0'}}];
const root=path.resolve(__dirname,'..');
const server=createServer(async(req,res)=>{
  try{
    const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
    const body=await readFile(file);res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':'image/png');res.end(body);
  }catch{res.writeHead(404).end()}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://static.cloudflareinsights.com/**',r=>r.fulfill({status:200,body:''}));
 await page.route('**/audio/index.json',r=>r.fulfill({json:{clips:{},bundles:[]}}));
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.waitForFunction(()=>window.S&&window.LESSONS&&window.AcademyDictionary);
 await page.evaluate(()=>{S.profile.onboarded=true;S.profile.name='Ayaan';S.profile.theme='light';save();setNav('home');render()});
 await page.locator('#academyContinue').waitFor();assert.equal(await page.title(),'Somali English Academy — Baro Ingiriisi');
 assert.equal(await page.locator('.academy-lesson').count(),10);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:'/tmp/academy-home-mobile.png',fullPage:false});
 await page.locator('#academyContinue').click();await page.waitForFunction(()=>view==='lesson');assert.ok((await page.locator('#app').innerText()).length>100);
 await page.locator('#lesBack').click();
 await page.locator('#mainNav [data-view="dict"]').click();
 let mode='success',requests=0;
 await page.route('https://api.dictionaryapi.dev/**',async r=>{requests++;if(mode==='offline')return r.abort();if(mode==='missing')return r.fulfill({status:404,json:{title:'No Definitions Found'}});return r.fulfill({json:entry})});
 await page.route('https://en.wiktionary.org/api/rest_v1/page/definition/**',async r=>{requests++;if(mode==='offline')return r.abort();if(mode==='missing')return r.fulfill({status:404,json:{title:'Not found'}});return r.fulfill({json:r.request().url().endsWith('/biyo')?{so:[{language:'Somali',partOfSpeech:'Noun',definitions:[{definition:'water'}]}]}:{en:[{language:'English',partOfSpeech:'Noun',definitions:[{definition:'hello'}]}]}})});
 await page.locator('#dictionaryQuery').fill('hello');assert.equal(requests,0);
 await page.locator('#dictionaryForm button').click();await page.locator('.live-entry').waitFor();
 assert.match(await page.locator('.live-entry').innerText(),/Used as a greeting/);
 assert.match(await page.locator('.dictionary-attribution').innerText(),/CC BY-SA 3.0/);
 await page.locator('.live-entry [data-save-word]').click();assert.equal(await page.locator('.live-entry [data-save-word]').getAttribute('aria-pressed'),'true');
 await page.screenshot({path:'/tmp/academy-dictionary-mobile.png',fullPage:false});
 await page.locator('[data-dictionary-tab="saved"]').click();assert.match(await page.locator('#dictionaryResults').innerText(),/hello/);
 await page.locator('#dictionaryQuery').fill('');await page.locator('[data-define="hello"]').click();await page.locator('.live-entry').waitFor();assert.equal(await page.locator('#dictionaryQuery').inputValue(),'hello');
 await page.reload();await page.waitForFunction(()=>window.S&&S.profile.onboarded);await page.locator('#mainNav [data-view="dict"]').click();await page.locator('[data-dictionary-tab="saved"]').click();assert.match(await page.locator('#dictionaryResults').innerText(),/hello/);
 await page.locator('[data-dictionary-tab="results"]').click();mode='offline';await page.locator('#dictionaryQuery').fill('hello');await page.locator('#dictionaryForm button').click();await page.getByText('Kaydsan / Showing a previously downloaded definition.').waitFor();
 await page.locator('#dictionaryQuery').fill('uncachedword');await page.locator('#dictionaryForm button').click();await page.getByText('Qaamuuska lama xiriiri karo / Dictionary unavailable').waitFor();
 mode='missing';await page.locator('#dictionaryQuery').fill('unfindableword');await page.locator('#dictionaryForm button').click();await page.getByText('Qeexid lama helin / No live definition found').waitFor();
 await page.locator('#dictionaryQuery').fill('tufaax');assert.ok(await page.locator('.dictionary-entry').count()>0);
 await page.setViewportSize({width:1440,height:1000});await page.locator('#mainNav [data-view="home"]').click();await page.screenshot({path:'/tmp/academy-home-desktop.png',fullPage:false});
 await page.locator('#academyAllLessons').click();await page.locator('#academyUnit').waitFor();await page.locator('#academyUnit').selectOption('1');assert.equal(await page.locator('.academy-lesson').first().getAttribute('data-academy-lesson'),'11');
 await page.locator('#mainNav [data-view="dict"]').click();mode='success';await page.locator('#dictionaryQuery').fill('hello');await page.locator('#dictionaryForm button').click();await page.locator('.live-entry').waitFor();await page.screenshot({path:'/tmp/academy-dictionary-desktop.png',fullPage:false});
 await page.locator('#dictionaryQuery').fill('biyo');await page.locator('#dictionaryForm button').click();await page.getByText('Soomaali → English · Wiktionary').waitFor();assert.match(await page.locator('.live-entry').last().innerText(),/water/);
 await page.evaluate(()=>{S.profile.theme='dark';render()});assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.screenshot({path:'/tmp/academy-dictionary-dark.png',fullPage:false});
 await page.setViewportSize({width:320,height:740});await page.evaluate(()=>{S.profile.largeText=true;render()});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 for(const view of ['practice','watch','profile']){await page.locator('#mainNav [data-view="'+view+'"]').click();assert.ok((await page.locator('#app').innerText()).length>100);await page.screenshot({path:'/tmp/academy-'+view+'.png',fullPage:false})}
 assert.deepEqual(errors,[]);console.log('PASS: mobile + desktop, lesson launch, course navigation, bilingual search, live definitions, attribution, bookmarks persisted, cached offline result, network error, missing word, dark theme, 320px large text, practice/watch/profile, no uncaught errors.');
 await context.close();
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
