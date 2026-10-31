const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function client(fetch, storage){
  const ctx={fetch,localStorage:storage,AbortController,setTimeout,clearTimeout,URL};
  ctx.window=ctx;vm.createContext(ctx);
  if(fs.existsSync('dictionary-client.js'))vm.runInContext(fs.readFileSync('dictionary-client.js','utf8'),ctx);
  assert.ok(ctx.AcademyDictionary,'The live dictionary client must be available');
  return ctx.AcademyDictionary;
}
const entry=[{word:'hello',phonetic:'/həˈləʊ/',phonetics:[{audio:'https://example.org/hello.mp3'}],meanings:[{partOfSpeech:'interjection',definitions:[{definition:'Used as a greeting.',example:'Hello, Sam!'}]}],sourceUrls:['https://en.wiktionary.org/wiki/hello'],license:{name:'CC BY-SA 3.0',url:'https://creativecommons.org/licenses/by-sa/3.0'}}];
test('live results retain definitions, pronunciation and attribution',async()=>{
  const c=client(async url=>{assert.equal(url,'https://api.dictionaryapi.dev/api/v2/entries/en/hello');return {ok:true,json:async()=>entry}});
  const r=await c.lookup(' Hello ');assert.equal(r.entries[0].meanings[0].definitions[0].definition,'Used as a greeting.');assert.equal(r.entries[0].phonetics[0].audio,'https://example.org/hello.mp3');assert.equal(r.entries[0].license.name,'CC BY-SA 3.0');assert.equal(r.cached,false);
});
test('successful lookups remain available offline after recreating the client',async()=>{
  const data={};const storage={getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=v};
  await client(async()=>({ok:true,json:async()=>entry}),storage).lookup('hello');
  const r=await client(async()=>{throw Error('offline')},storage).lookup('hello');assert.equal(r.entries[0].word,'hello');assert.equal(r.cached,true);
});
test('missing words and connection failures have different outcomes',async()=>{
  const missing=await client(async()=>({ok:false,status:404})).lookup('qwerty');assert.equal(missing.status,'not-found');
  const offline=await client(async()=>{throw Error('offline')}).lookup('hello');assert.equal(offline.status,'unavailable');
});
test('malformed responses and unsafe external links are never used',async()=>{
  const bad=await client(async()=>({ok:true,json:async()=>({error:'bad'})})).lookup('hello');assert.equal(bad.status,'unavailable');
  const c=client(async()=>({ok:true,json:async()=>entry}));assert.equal(c.safeURL('javascript:alert(1)'), '');assert.equal(c.safeURL('http://example.org/x'),'');assert.equal(c.safeURL('https://example.org/x'),'https://example.org/x');
});
test('storage failure does not prevent a live result',async()=>{
  const r=await client(async()=>({ok:true,json:async()=>entry}),{getItem(){throw Error('denied')},setItem(){throw Error('full')}}).lookup('hello');assert.equal(r.entries[0].word,'hello');
});
test('Somali lookup uses only the Somali section, never same-spelling words in other languages',async()=>{
  const c=client(async url=>{assert.equal(url,'https://en.wiktionary.org/api/rest_v1/page/definition/biyo');return {ok:true,json:async()=>({other:[{language:'Central Bikol',definitions:[{definition:'complete'}]}],so:[{language:'Somali',partOfSpeech:'Noun',definitions:[{definition:'water'}]}]})}});
  assert.equal(typeof c.lookupSomali,'function');const r=await c.lookupSomali('biyo');assert.equal(r.entries[0].meanings[0].definitions[0].definition,'water');assert.equal(r.entries[0].language,'so');assert.match(r.entries[0].sourceUrls[0],/#Somali$/);
});
test('Somali lookup reports a missing Somali entry even when another language has the word',async()=>{
  const c=client(async()=>({ok:true,json:async()=>({en:[{partOfSpeech:'Noun',definitions:[{definition:'a test'}]}]})}));assert.equal(typeof c.lookupSomali,'function');assert.equal((await c.lookupSomali('test')).status,'not-found');
});
