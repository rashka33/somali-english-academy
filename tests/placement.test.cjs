const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
function setup(){const source=fs.readFileSync('index.html','utf8');const context={S:{profile:{unlock:1},completed:{}},todayStr:()=> '2026-11-01'};vm.createContext(context);let a=source.indexOf('function plApplyPlacement(r){'),b=source.indexOf('\nfunction obFinish',a);vm.runInContext(source.slice(a,b),context);const unlock=source.match(/function isUnlocked\(n\)\{[^\n]+/)[0];vm.runInContext(unlock,context);return context}
test('higher placement opens starting lesson, retains earlier review, locks next lesson',()=>{const c=setup();c.plApplyPlacement({startLesson:301,correct:20,asked:50});assert(c.isUnlocked(301));assert(c.isUnlocked(100));assert.equal(c.isUnlocked(302),false);assert.equal(Object.values(c.S.completed).filter(v=>v.placed).length,300);c.S.completed.L301={score:90};assert(c.isUnlocked(302));assert.equal(c.isUnlocked(303),false)});
test('retaking placement never removes earned progress or moves learner backward',()=>{const c=setup();c.S.completed.L10={score:100};c.plApplyPlacement({startLesson:301,correct:20,asked:50});c.plApplyPlacement({startLesson:1,correct:0,asked:50});assert.equal(c.S.profile.placedLesson,301);assert.equal(c.S.completed.L10.score,100)});

function placementContext(storage, persisted){
 const c={S:persisted||{profile:{ui:'en'},completed:{}},ROOT:{activeId:'p1'},window:{},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},renderHome:()=>{},openLesson:n=>c.opened=n,isUnlocked:()=>true,guestMode:false,render:()=>{},view:'home',norm:s=>String(s).toLowerCase(),save:()=>new Promise(()=>{}),plPickQ:n=>({q:'q'+n,ans:'a',opts:['a'],stage:0})};
 vm.createContext(c);const src=fs.readFileSync('academy-ui.js','utf8');vm.runInContext(src.slice(src.indexOf('/* Fifty-question placement:')),c);c.plScreenRender=()=>{c.view='placement'};return c;
}
test('reload resumes all three answers even before IndexedDB commit finishes',()=>{
 const storage={};let c=placementContext(storage);c.plBegin();for(let i=0;i<3;i++)c.plAnswer('a');
 c=placementContext(storage);c.plBegin();assert.equal(c.plState.idx,3);assert.equal(c.plState.answers.length,3);assert(c.plState.answers.every(a=>a.ok));
});
test('unfinished placement never intercepts Lesson 1',()=>{const c=placementContext({});c.plBegin();c.openLesson(1);assert.equal(c.opened,1)});
test('a pending answer save does not reopen placement after leaving',async()=>{const c=placementContext({});let resolve;c.save=()=>new Promise(r=>resolve=r);c.plBegin();const saving=c.plAnswer('a');c.view='home';resolve();await saving;assert.equal(c.view,'home')});
test('reload journal is isolated to its learner',()=>{const storage={};const c=placementContext(storage);c.plBegin();c.plAnswer('a');const other=placementContext(storage);other.ROOT.activeId='p2';other.plBegin();assert.equal(other.plState.idx,0)});
