/* Browser integration suite. Run with Playwright installed; optional CHROMIUM_PATH. */
const {chromium}=require('playwright');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const entry=[{word:'hello',phonetic:'/həˈləʊ/',phonetics:[],meanings:[{partOfSpeech:'interjection',definitions:[{definition:'Used as a greeting.',example:'Hello, Sam!'},{definition:'An expression of surprise.'}]}],sourceUrls:['https://en.wiktionary.org/wiki/hello'],license:{name:'CC BY-SA 3.0',url:'https://creativecommons.org/licenses/by-sa/3.0'}}];
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
  assert.equal(await page.locator('#simpleStart').count(),1,'First visit should offer one short start form');
  assert.equal(await page.locator('#app input').count(),1,'First visit asks only for an optional name');
  await page.locator('#simpleName').fill('Ayaan');await page.locator('#simpleStart').click();await page.locator('#academyContinue').waitFor();assert.equal(await page.evaluate(()=>S.profile.name),'Ayaan');
  await page.evaluate(()=>{S.profile.onboarded=true;S.profile.name='Ayaan';S.profile.theme='light';S.profile.ui='en';save();setNav('home');render()});
  assert.equal(await page.title(),'Somali English Academy — Baro Ingiriisi');
  assert.deepEqual(await page.locator('#mainNav button').allTextContents(),['Home','Dictionary','Profile']);
  assert.equal(await page.locator('#academyContinue').count(),1); assert.equal(await page.locator('#communicationLessons').count(),1);
  assert.equal(await page.locator('.simple-lesson').count(),0);
  assert.doesNotMatch(await page.locator('#app').innerText(),/XP|streak|Academies|\/ Continue/);
  await page.screenshot({path:'/tmp/minimal-home-mobile.png',fullPage:false});
  await page.locator('#academyContinue').click();await page.waitForFunction(()=>view==='lesson');
  assert.equal(await page.locator('#lesNext').innerText(),'Continue');await page.locator('#simpleResources summary').click();await page.locator('#simpleSpeakPractice').click();await page.waitForFunction(()=>step===4);await page.locator('#backPath').click();await page.waitForFunction(()=>view==='simpleLessons');
  await page.locator('#simpleBack').click();await page.locator('#academyAllLessons').click();await page.locator('#academyUnit').selectOption('1');assert.equal(await page.locator('.simple-lesson').first().getAttribute('data-academy-lesson'),'11');assert.equal(await page.locator('.simple-lesson').first().isDisabled(),true);
  await page.locator('#mainNav [data-view="dict"]').click();assert.equal(await page.locator('#dictionaryResults').innerText(),'');assert.equal(await page.locator('.dictionary-tabs').count(),0);
  let mode='success',requests=0;
  await page.route('https://api.dictionaryapi.dev/**',async r=>{requests++;if(mode==='offline')return r.abort();if(mode==='missing')return r.fulfill({status:404,json:{title:'No Definitions Found'}});return r.fulfill({json:entry})});
  await page.route('https://en.wiktionary.org/api/rest_v1/page/definition/**',async r=>{requests++;if(mode==='offline')return r.abort();if(mode==='missing')return r.fulfill({status:404,json:{title:'Not found'}});return r.fulfill({json:r.request().url().endsWith('/biyo')?{so:[{language:'Somali',partOfSpeech:'Noun',definitions:[{definition:'water'}]}]}:{en:[{language:'English',partOfSpeech:'Noun',definitions:[{definition:'hello'}]}]}})});
  await page.locator('#dictionaryQuery').fill('hello');assert.equal(requests,0);
  await page.locator('#dictionaryForm button').click();await page.getByText('Used as a greeting.',{exact:true}).waitFor();
  assert.equal(await page.getByText('An expression of surprise.',{exact:true}).isVisible(),false,'Extra meanings stay collapsed');
  await page.getByText('More meanings',{exact:true}).click();assert.equal(await page.getByText('An expression of surprise.',{exact:true}).isVisible(),true);
  await page.getByText('More meanings',{exact:true}).click();
  assert.match(await page.locator('.dictionary-attribution').first().innerText(),/CC BY-SA 3.0/);
  await page.locator('.live-entry').first().locator('[data-save-word]').click();assert.equal(await page.locator('.live-entry').first().locator('[data-save-word]').getAttribute('aria-pressed'),'true');
  await page.screenshot({path:'/tmp/minimal-dictionary-mobile.png',fullPage:false});
  await page.locator('#mainNav [data-view="profile"]').click();assert.equal(await page.locator('.simple-profile-rows>.simple-row').count(),8);await page.screenshot({path:'/tmp/minimal-profile-mobile.png',fullPage:false});
  await page.locator('#simpleSaved').click();await page.locator('[data-define="hello"]').click();await page.getByText('Used as a greeting.',{exact:true}).waitFor();assert.equal(await page.locator('#dictionaryQuery').inputValue(),'hello');
  await page.reload();await page.waitForFunction(()=>window.S&&S.profile.onboarded);await page.locator('#mainNav [data-view="profile"]').click();await page.locator('#simpleSaved').click();assert.match(await page.locator('#app').innerText(),/hello/);
  await page.locator('#mainNav [data-view="dict"]').click();mode='offline';await page.locator('#dictionaryQuery').fill('hello');await page.locator('#dictionaryForm button').click();await page.getByText('Saved definition · offline',{exact:true}).waitFor();
  await page.locator('#dictionaryQuery').fill('uncachedword');await page.locator('#dictionaryForm button').click();await page.getByText('Unable to connect. Please try again.',{exact:true}).waitFor();
  mode='missing';await page.locator('#dictionaryQuery').fill('unfindableword');await page.locator('#dictionaryForm button').click();await page.getByText('Word not found. Check the spelling.',{exact:true}).waitFor();
  await page.locator('#dictionaryQuery').fill('tufaax');assert.ok(await page.locator('.dictionary-course-row').count()>0);
  mode='success';await page.locator('#dictionaryQuery').fill('biyo');await page.locator('#dictionaryForm button').click();await page.getByText('Soomaali → English',{exact:true}).waitFor();assert.match(await page.locator('.live-entry').first().innerText(),/water/);
  await page.locator('#mainNav [data-view="profile"]').click();await page.locator('#simpleLanguageRow').click();await page.locator('[data-language="so"]').click();assert.equal(await page.locator('h1').innerText(),'Luqadda');assert.deepEqual(await page.locator('#mainNav button').allTextContents(),['Hoyga','Qaamuus','Boggaaga']);
  await page.locator('#mainNav [data-view="home"]').click();assert.doesNotMatch(await page.locator('#app').innerText(),/Continue learning|Browse lessons|Lesson 1/);await page.screenshot({path:'/tmp/minimal-home-somali.png',fullPage:false});
  await page.locator('#simpleLanguage').click();assert.equal(await page.locator('#academyContinue').innerText(),'Continue learning');
  await page.locator('#mainNav [data-view="profile"]').click();await page.locator('#simpleAppearance').click();await page.locator('[data-theme-option="dark"]').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.locator('#simpleLargeText').check();assert.equal(await page.locator('html').getAttribute('class').then(x=>x.includes('largetext')),true);
  await page.setViewportSize({width:320,height:740});for(const destination of ['home','dict','profile']){await page.locator('#mainNav [data-view="'+destination+'"]').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)}
  await page.screenshot({path:'/tmp/minimal-profile-dark-small.png',fullPage:false});
  await page.evaluate(()=>{S.profile.largeText=false;S.profile.theme='light';render()});
  await page.locator('#simpleTools').click();await page.locator('#simplePractice').click();await page.waitForFunction(()=>view==='practice');await page.locator('#simpleLegacyBack').click();await page.locator('#simpleReview').click();await page.waitForFunction(()=>view==='review');await page.locator('#simpleLegacyBack').click();await page.locator('#simpleVideos').click();await page.waitForFunction(()=>view==='watch');await page.locator('#simpleLegacyBack').click();
  await page.locator('#mainNav [data-view="profile"]').click();await page.locator('#simpleMore').click();await page.locator('#fRowSave').click();assert.ok((await page.locator('#app').innerText()).length>100);await page.locator('#simpleBack').click();
  await page.evaluate(()=>{S.completed.L1={score:100};save();setNav('home');render()});await page.locator('#academyContinue').click();await page.waitForFunction(()=>cur.n===2);await page.locator('#backPath').click();
  await page.setViewportSize({width:1440,height:1000});await page.locator('#mainNav [data-view="home"]').click();await page.screenshot({path:'/tmp/minimal-home-desktop.png',fullPage:false});
  await page.locator('#mainNav [data-view="profile"]').click();await page.screenshot({path:'/tmp/minimal-profile-desktop.png',fullPage:false});
  await page.locator('#mainNav [data-view="dict"]').click();await page.locator('#dictionaryQuery').fill('hello');await page.locator('#dictionaryForm button').click();await page.getByText('Used as a greeting.',{exact:true}).waitFor();await page.screenshot({path:'/tmp/minimal-dictionary-desktop.png',fullPage:false});
  await page.locator('#mainNav [data-view="home"]').click();
  await page.locator('#communicationLessons').click();assert.equal(await page.locator('#app .simple-row').count(),100);
  await page.locator('#app .simple-row').last().click();assert.match(await page.locator('h1').innerText(),/accessibility/);await page.locator('#commBack').click();await page.locator('#app .simple-row').first().click();assert.equal(await page.locator('#commDialogue p').count(),8);assert.equal(await page.locator('#commForm').count(),0);
  await page.locator('#commStartTest').click();assert.equal(await page.locator('#commDialogue').count(),0);assert.equal(await page.locator('#commListen').count(),0);assert.doesNotMatch(await page.locator('#app').innerText(),/Could you say that again, please/);
  await page.locator('#commAnswer').fill('say');await page.locator('#commForm button').click();await page.locator('#commAnswer').fill('Please repeat that.');await page.locator('#commTestBack').click();assert.equal(await page.locator('#commAnswer').inputValue(),'say');await page.locator('#commForm button').click();await page.locator('#commAnswer').fill('Please repeat that.');await page.locator('#commForm button').click();await page.getByText('Correct. Saved!',{exact:true}).waitFor();await page.locator('#commNext').click();assert.match(await page.locator('h1').innerText(),/Book a medical/);
  await page.reload();await page.waitForFunction(()=>S&&S.communication&&S.communication[0]);
  await page.evaluate(()=>{S.profile.ui='en';setNav('home');render()});await page.locator('.simple-details').first().locator('summary').click();
  await page.getByRole('button',{name:'Find my level · Placement test',exact:true}).click();await page.locator('[data-plopt]').first().waitFor();
  await page.locator('#plBack').click();await page.locator('#mainNav [data-view="home"]').click();await page.locator('.simple-details').first().locator('summary').click();
  await page.locator('#homeAiTutor').click();assert.equal(await page.locator('#academyTutor').getAttribute('open'),'');
  await page.route('https://somali-academy-tutor.rashkaa33.workers.dev',r=>r.fulfill({json:{answer:'A helpful explanation.'}}));
  await page.locator('#academyTutor textarea').fill('Explain hello');await page.locator('#academyTutor button').click();await page.getByText('A helpful explanation.',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);console.log('PASS: three destinations; focused home; lesson launch, unlocks and next lesson; unit browsing; lesson resources; collapsed definitions; live English and Somali; attribution; saved words and reload; offline/error states; single-language UI; language/appearance/large text; 320px mobile + desktop; practice/review/videos and backup accessible; no uncaught errors.');
  await context.close();
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
