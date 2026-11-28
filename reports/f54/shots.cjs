// node reports/f54/shots.cjs <outdir> [port]  — the five F54 report screenshots at phone width (390 px, 2x)
const { chromium } = require('playwright');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const out=process.argv[2],port=process.argv[3]||'8778';const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,reducedMotion:'reduce',serviceWorkers:'block'});
await c.route(/cloudflareinsights|ytimg|youtube/,r=>r.abort());const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const shot=async n=>{await sleep(700);await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:out+'/'+n+'.png'})};
await p.goto('http://127.0.0.1:'+port+'/academy.html');await sleep(1800);await shot('1_welcome');
await p.click('#welcomeStart');await sleep(1200);await shot('3_lesson1_first_screen');
await p.evaluate(()=>{step=8;exIdx=0;phase='ex';renderLesson()});await sleep(500);await shot('4_lesson_player_mid_activity');
await p.evaluate(()=>{S.completed.L1={score:90,date:todayStr()};save();setNav('home');render()});await sleep(900);await shot('2_home');
await p.evaluate(()=>{setNav('simpleLessons');render()});await sleep(800);await shot('5_library');
console.log(JSON.stringify({out,errs}));await b.close()})();
