window.__SEA_BUILD="sea-f13";
var _dsM=defaultState;
defaultState=function(){var d=_dsM();d.profile.sndNote=false;d.profile.placedLesson=0;d.profile.placedAsked=0;d.lessonPos={};return d};
var _epfM=ensureProfileFields;
ensureProfileFields=function(out){var r=_epfM(out);if(typeof r.profile.sndNote!=="boolean")r.profile.sndNote=false;if(typeof r.profile.placedLesson!=="number")r.profile.placedLesson=0;if(typeof r.profile.placedAsked!=="number")r.profile.placedAsked=0;if(!r.lessonPos||typeof r.lessonPos!=="object"||Array.isArray(r.lessonPos))r.lessonPos={};return r};
var SND_SO="Cod ma maqashay? Hubi in telefoonkaagu uusan aamusnayn (silent mode), codkana kor u qaad.";
var SND_EN="No sound? Check that your phone is not on silent mode, and turn the volume up.";
function sndDismiss(){if(S&&S.profile){S.profile.sndNote=true;save()}var b=document.getElementById("sndNoteBar");if(b)b.remove();var n=document.getElementById("sndNote");if(n)n.remove()}
var sndShownFor=null;
var _spkM=speak;
speak=function(text,slow,btn){_spkM(text,slow,btn);hSafe(function(){
 if(guestMode||view!=="lesson"||!S||!S.profile||!S.profile.onboarded||S.profile.sndNote)return;
 var pid=ROOT?ROOT.activeId:"p1";if(sndShownFor===pid)return;sndShownFor=pid;
 var bar=document.createElement("div");bar.id="sndNoteBar";bar.setAttribute("role","status");
 bar.innerHTML='<strong>'+uiIcon("mute")+' '+SND_SO+'</strong><br><span lang="en">'+SND_EN+'</span><br><button class="u-mt-3 btn secondary" id="sndBarOk">'+lng('Waan fahmay','Got it')+'</button>';
 document.body.appendChild(bar);
 document.getElementById("sndBarOk").addEventListener("click",function(){sndDismiss()});
})};
var plState=null,plCtx="ob";
function plPickQ(lessonN,si){
 var les=LESSONS[lessonN-1];if(!les)return null;
 var list=quizList(les);var pref=null,any=null;
 for(var i=0;i<list.length;i++){var e=list[i];if(e&&e.opts&&e.ans){if(e.type==="mcq"){pref=e;break}if(!any)any=e}}
 var e=pref||any;if(!e)return null;
 return{stage:si,q:e.q,qSo:e.qSo||"",opts:e.opts.slice(),ans:e.ans,speak:e.speak||"",type:e.type};
}
function plBuildQuestions(){
 var qs=[];
 for(var si=0;si<STAGES12.length;si++){var st=STAGES12[si];var a=st[2],b=st[2]+Math.floor((st[3]-st[2])/2);
  var qa=plPickQ(a,si),qb=plPickQ(b,si);
  if(qa)qs.push(qa);if(qb&&(!qa||qb.q!==qa.q))qs.push(qb)}
 return qs;
}
function plComputeResult(answers){
 var correct=0;answers.forEach(function(a){if(a.ok)correct++});
 var groups=[];answers.forEach(function(a){var g=groups[groups.length-1];if(!g||g.stage!==a.stage){g={stage:a.stage,ok:0,n:0};groups.push(g)}g.n++;if(a.ok)g.ok++});
 var cumOk=0,cumN=0,highest=0;
 for(var gi=0;gi<groups.length;gi++){var g=groups[gi];cumOk+=g.ok;cumN+=g.n;var pass=(g.ok===g.n)||(cumN>0&&cumOk/cumN>=0.7);if(pass)highest=g.stage+1}
 return{correct:correct,asked:answers.length,pct:answers.length?Math.round(correct/answers.length*100):0,highestPassed:highest,startLesson:highest>0?STAGES12[highest-1][2]:1};
}
function plBegin(ctx){
 plCtx=ctx;
 plState={qs:plBuildQuestions(),idx:0,answers:[],result:null,done:false};
 window.__plTest=plState;
 if(ctx==="ob"){obStep=1;renderOnboarding()}else{plScreenRender()}
}
function plAnswer(opt){
 if(!plState||plState.done)return;
 var q=plState.qs[plState.idx];if(!q){plFinishTest();return}
 var ok=norm(opt)===norm(q.ans);
 plState.answers.push({stage:q.stage,ok:ok});
 plState.idx++;
 var lastOfBand=(plState.idx>=plState.qs.length)||(plState.qs[plState.idx].stage!==q.stage);
 if(lastOfBand){
  var bandOk=0,bandN=0;plState.answers.forEach(function(a){if(a.stage===q.stage){bandN++;if(a.ok)bandOk++}});
  if(bandOk===0||plState.idx>=plState.qs.length){plFinishTest()}
 }
 if(plCtx==="ob")renderOnboarding();else plScreenRender();
}
function plFinishTest(){if(!plState||plState.done)return;plState.result=plComputeResult(plState.answers);plState.done=true;if(plCtx==="ob")obStep=2}
function plTestHTML(){
 if(!plState)return "";
 var q=plState.qs[plState.idx];if(!q)return plResultHTML();
 return '<h2>'+uiIcon("pen")+' '+lng('Imtixaanka meelaynta','Placement test')+'</h2>'
 +'<p class="pill">Su\'aal '+(plState.idx+1)+' / '+plState.qs.length+' · Marxaladda '+(q.stage+1)+' / Stage '+(q.stage+1)+'</p>'
 +'<div class="segprog" aria-hidden="true">'+plState.qs.map(function(x,i){return '<i class="'+(i<plState.idx?"on":"")+'"></i>'}).join("")+'</div>'
 +'<p class="u-t-lg">'+esc(q.q)+'</p>'+(q.qSo?'<p class="muted">'+esc(q.qSo)+'</p>':"")
 +(q.speak?'<p>'+speakBtn(q.speak)+' <span class="small muted">'+lng('Dhegeyso','Listen')+'</span></p>':"")
 +'<div class="opts">'+q.opts.map(function(o){return '<button class="opt" data-plopt="'+esc(o)+'">'+esc(o)+'</button>'}).join("")+'</div>'
 +'<p class="small muted">'+lng('Jawaabta saxda ah halkan lama muujinayo — waa qiimeyn, ma aha cashir.','The correct answer is not shown here — this is an assessment, not a lesson.')+'</p>';
}
function plResultHTML(){
 var r=plState&&plState.result;if(!r)return "";
 var stIdx=0;for(var i=0;i<STAGES12.length;i++){if(r.startLesson>=STAGES12[i][2]&&r.startLesson<=STAGES12[i][3])stIdx=i}
 var st=STAGES12[stIdx];var les=LESSONS[r.startLesson-1];var title=les?les.titleEn:pathwayLesson(r.startLesson).title;
 return '<h2>'+lng('Imtixaankii wuu dhammaaday!','The test is done')+'</h2>'
 +'<p class="u-t-lg"><strong>'+lng('Heerkaaga','Your level:')+'</strong> Marxaladda '+(stIdx+1)+' / Stage '+(stIdx+1)+': '+esc(st[1])+' / '+esc(st[0])+' · CEFR '+esc(cefrFor(r.startLesson))+'</p>'
 +'<p class="u-t-lg"><strong>'+lng('Dhibcahaaga','Your score:')+' '+r.correct+' / '+r.asked+' ('+r.pct+'%)</strong></p>'
 +'<p class="u-t-lg">Waxaad ka bilaabi doontaa <strong>Casharka '+r.startLesson+'</strong> / You will start at <strong>Lesson '+r.startLesson+'</strong> — '+esc(title)+'</p>'
 +(r.startLesson>1?'<p class="small muted">Cashirrada 1–'+(r.startLesson-1)+' waxaa loo calaamadeeyay “meelayn / placed” — horumarkaaga way ku jiraan, waa furan yihiin oo dib ayaad u ciyaari kartaa, laakiin meelayntu XP ma bixiso. / Lessons 1–'+(r.startLesson-1)+' are marked “placed” — they count toward your progress and stay open to replay, but placement itself awards no XP.</p>':'<p class="small muted">'+lng('Waxaad ka bilaabaysaa bilowga — tallaabo tallaabo.','You start at the very beginning — step by step.')+'</p>')
 +'<button class="u-w-full btn" id="plStartThere">'+lng('Halkaas ka bilow','Start there')+'</button>'
 +'<button class="u-w-full u-mt-3 btn secondary" id="plStartOne">'+lng('Casharka 1 ka bilow','Start from Lesson 1 instead')+'</button>';
}
function plApplyPlacement(r){
 if(!r)return;
 if(S.profile.placedLesson&&S.profile.placedLesson>r.startLesson)return;
 for(var n=1;n<r.startLesson;n++){if(!S.completed["L"+n])S.completed["L"+n]={score:0,placed:true,date:todayStr()}}
 if(r.startLesson>1)S.profile.unlock=Math.max(S.profile.unlock||1,r.startLesson);
 S.profile.placedLesson=r.startLesson;S.profile.placement=r.correct;S.profile.placedAsked=r.asked;
}
function obFinish(usePlacement){
 S.profile.onboarded=true;S.profile.name=obName.trim();S.profile.goal=obGoal;S.profile.mainGoal=obMainGoal;S.profile.studyMinutes=obMinutes;S.profile.voiceURI=obVoice;S.profile.voiceSpeed=obSpeed;S.profile.literacy=obLiteracy;
 if(usePlacement&&plState&&plState.result)plApplyPlacement(plState.result);
 save().then(function(){setNav(pendingView||"home");pendingView=null;render()});
}
function plApplyChoice(usePlacement){
 if(plCtx==="profile"){
  if(usePlacement&&plState&&plState.result)plApplyPlacement(plState.result);
  save().then(function(){setNav(usePlacement?"home":"profile");render()});
  return;
 }
 obFinish(usePlacement);
}
function plWireResult(){
 var a=document.getElementById("plStartThere");if(a)a.addEventListener("click",function(){plApplyChoice(true)});
 var b=document.getElementById("plStartOne");if(b)b.addEventListener("click",function(){plApplyChoice(false)});
}
function plScreenRender(){
 setNav("placement");
 app.innerHTML='<button class="btn ghost" id="plBack">'+lng('← Boggaaga','Profile')+'</button><div class="u-mx-auto u-measure card">'+(plState&&plState.done?plResultHTML():plTestHTML())+'</div>';
 bindSpeak(app);
 app.querySelectorAll("[data-plopt]").forEach(function(b){b.addEventListener("click",function(){plAnswer(b.dataset.plopt)})});
 plWireResult();
 var bk=document.getElementById("plBack");if(bk)bk.addEventListener("click",function(){setNav("profile");render()});
 window.scrollTo(0,0);
}
var _rpM=renderProfile;
renderProfile=function(){_rpM();hSafe(function(){
 var vs=document.getElementById("pfSpeed");
 if(vs&&!document.getElementById("sndPfNote"))vs.insertAdjacentHTML("afterend",'<p class="u-mt-2 small" id="sndPfNote">'+uiIcon("mute")+' '+SND_SO+'<br><span lang="en">'+SND_EN+'</span></p>');
 if(!S||!S.profile||!S.profile.onboarded||guestMode||document.getElementById("plCard"))return;
 var done=Object.keys(S.completed||{}).length;
 var h='<div class="u-mt-4 card" id="plCard"><h2>'+uiIcon("pen")+' '+lng('Imtixaanka meelaynta','Placement test')+'</h2>';
 if(S.profile.placedLesson)h+='<p>'+lng('Meelayntaadii','Your placement: waxaad ka bilowday')+' <strong>Casharka '+S.profile.placedLesson+' / Lesson '+S.profile.placedLesson+'</strong> · '+lng('Dhibcaha','Score:')+' <strong>'+(S.profile.placement||0)+' / '+(S.profile.placedAsked||0)+'</strong>. Cashirradii ka horreeyay waa “meelayn” — waa furan yihiin, dib ayaad u ciyaari kartaa. / You started at Lesson '+S.profile.placedLesson+'. Earlier lessons are marked as placed — they stay open to replay.</p>';
 if(done===0)h+='<p>Horay Ingiriisi ma u taqaannaa? Imtixaanka qaado (24 su\'aalood) si aad uga booddo cashirrada aad taqaanno. / Already know some English? Take the test (24 questions) to skip the lessons you already know.</p><button class="btn" id="plStartBtn">'+lng('Bilow imtixaanka','Start the placement test')+'</button>';
 h+='</div>';
 app.insertAdjacentHTML("beforeend",h);
 var b=document.getElementById("plStartBtn");if(b)b.addEventListener("click",function(){plBegin("profile")});
})};
var setLog=[],setPanel=null;
function showSetResult(kind){
 var old=document.getElementById("lesNav");if(old)old.remove();
 var entries=setLog.slice();setLog=[];
 var first=0,second=0,missed=[];
 entries.forEach(function(e){if(e.first)first++;else if(e.second)second++;else missed.push(e)});
 var N=entries.length,pct=N?Math.round(first/N*100):0,tot=first+second*0.5,totPct=N?Math.round(tot/N*100):0;
 setPanel={kind:kind,first:first,second:second,total:N,pct:pct,tot:tot,totPct:totPct,missed:missed.length};
 window.__setPanel=setPanel;
 var isEx=kind==="ex";
 var h='<button class="btn ghost" id="setResPath">'+lng('← Jidka','Path')+'</button><div class="card"><h2>'+(isEx?lng("Natiijada layliga","Exercise result"):""+uiIcon("pen")+" "+lng("Natiijada hubinta","Quiz result")+"")+'</h2>'
 +'<p class="u-t-xl u-mt-1 u-mb-1"><strong>'+first+' / '+N+' sax / correct ('+pct+'%)</strong></p>'
 +(second?'<p>'+lng('Jawaabo labaad','Second try:')+' <strong>'+second+'</strong> (½ dhibic midkiiba / half credit each) → Wadarta / Total: <strong>'+(Math.round(tot*10)/10)+' / '+N+' ('+totPct+'%)</strong></p>':"")
 +(missed.length?'<h3 class="u-mt-4">'+lng('Kuwa aad khaladay','The ones you missed')+'</h3>'+missed.map(function(m){return '<div class="u-mt-2 feedback bad"><p class="u-mt-1 u-mb-1"><strong>'+esc(m.q)+'</strong></p><p class="u-mt-1 u-mb-1">'+lng('Jawaabta saxda ah','Correct answer:')+' <strong>'+esc(m.ans)+'</strong></p>'+(m.why?'<p class="u-mt-1 u-mb-1 small">'+esc(m.why)+'</p>':"")+'</div>'}).join("")+'<p class="u-mt-3 small muted">'+lng('Kuwani waxay ku jiraan safka Dib-u-eegistaada — halkaas ayaad ku saxaysaa.','These are queued in your Review — you can fix them there.')+'</p>'+(guestMode?"":'<button class="u-mt-2 btn secondary" id="setResReview">'+uiIcon("repeat")+' '+lng('Tag Dib-u-eegista','Go to Review')+'</button>'):'<p>'+lng('Dhammaan waad saxday!','You got them all')+'</p>')
 +'<button class="u-mt-4 u-w-full btn continue" id="setResGo">'+(isEx?lng("Sii wad hubinta","Continue to the quiz →"):lng("Sii wad","Continue →"))+'</button></div>';
 app.innerHTML=h;window.scrollTo(0,0);
 var g=document.getElementById("setResGo");if(g)g.addEventListener("click",function(){if(isEx){step=9;renderLesson()}else{step=10;renderLesson()}});
 var rv=document.getElementById("setResReview");if(rv)rv.addEventListener("click",function(){setNav("review");render()});
 var bp=document.getElementById("setResPath");if(bp)bp.addEventListener("click",function(){if(guestMode){exitGuest();return}setNav("path");render()});
}
var guestPos=null;
function lesNavAfter(){
 if(view!=="lesson"||!cur||!S)return;
 document.body.classList.add("inLesson");
 if(!guestMode&&S){if(!S.lessonPos||typeof S.lessonPos!=="object")S.lessonPos={};var k=String(cur.n);var lp=S.lessonPos[k]||(S.lessonPos[k]={step:0,far:0});lp.step=step;if(step>lp.far)lp.far=step;save()}
 var ns=document.getElementById("nextStep");if(ns)ns.remove();
 var ps=document.getElementById("prevStep");if(ps)ps.remove();
 var foot=app.querySelector(".lessonfoot");if(foot){foot.classList.remove("lessonfoot");if(!foot.querySelector("button"))foot.style.display="none"}
 var old=document.getElementById("lesNav");if(old)old.remove();
 var showNext=true,nextLabel=lng("Sii wad","Next →");
 if(step===8&&exIdx<8)showNext=false;
 if(step===9&&!(guidedPending&&!guidedShown)&&qIdx<quizTotal(cur))showNext=false;
 if(typeof repeatMode!=="undefined"&&repeatMode)showNext=false;
 if(step===10)nextLabel=lng("Dhammee","Finish ✓");
 var bar=document.createElement("div");bar.id="lesNav";bar.className="lesnav";
 bar.innerHTML='<div class="lesnav-in"><button class="btn secondary navback" id="lesBack">'+lng('← Dib','Back')+'</button><span class="navind">'+lng('Qayb '+(step+1)+' / '+STEPS.length,'Section '+(step+1)+' of '+STEPS.length)+'</span>'+(showNext?'<button class="btn navnext" id="lesNext">'+nextLabel+'</button>':"")+'</div>';
 document.body.appendChild(bar);
 document.getElementById("lesBack").addEventListener("click",function(){
  if(typeof repeatMode!=="undefined"&&repeatMode){repeatMode=false;hintQueue=[];hintServed=0}
  if(step===10){step=9;qIdx=0;qCorrect=0;setLog=setLog.filter(function(e){return e.kind!=="quiz"});renderLesson();window.scrollTo(0,0);return}
  if(step===9&&qIdx>=quizTotal(cur)){qIdx=0;qCorrect=0;setLog=setLog.filter(function(e){return e.kind!=="quiz"});renderLesson();window.scrollTo(0,0);return}
  if(step===9){step=8;exIdx=0;exCorrect=0;setLog=setLog.filter(function(e){return e.kind!=="ex"});renderLesson();window.scrollTo(0,0);return}
  if(step===8&&exIdx>=8){exIdx=0;exCorrect=0;setLog=setLog.filter(function(e){return e.kind!=="ex"});renderLesson();window.scrollTo(0,0);return}
  if(step>0){step--;renderLesson();window.scrollTo(0,0)}
  else{if(guestMode){exitGuest();return}setNav("home");render()}
 });
 var nx=document.getElementById("lesNext");if(nx)nx.addEventListener("click",function(){
  if(step===10){var fb=document.getElementById("finishBtn");if(fb){fb.click();return}finishLesson();return}
  if(step===9&&guidedPending&&!guidedShown){guidedShown=true;renderLesson();window.scrollTo(0,0);return}
  if(step===8){step=9;renderLesson();window.scrollTo(0,0);return}
  if(step===9){step=10;renderLesson();window.scrollTo(0,0);return}
  step++;renderLesson();window.scrollTo(0,0);
 });
}
var _rlNav=renderLesson;
renderLesson=function(){_rlNav();hSafe(lesNavAfter)};
var _olNav=openLesson;
openLesson=function(n){
 var want=0;
 if(!guestMode&&S){if(!S.lessonPos||typeof S.lessonPos!=="object")S.lessonPos={};var lp0=S.lessonPos[String(n)];if(lp0&&!(S.completed&&S.completed["L"+n]))want=Math.min(lp0.step||0,9)}
 _olNav(n);
 if(guestMode){guestPos={step:0,far:0};return}
 if(want&&want!==step){step=want;renderLesson()}
};
var _rNav=render;
render=function(){_rNav();hSafe(function(){
 document.body.classList.toggle("inLesson",view==="lesson");
 if(view!=="lesson"){var b=document.getElementById("lesNav");if(b)b.remove()}
})};
var UI_PAIRS_M=[["No sound? Check that your phone is not on silent mode, and turn the volume up.","Cod ma maqashay? Hubi in telefoonkaagu uusan aamusnayn (silent mode), codkana kor u qaad."],["Got it","Waan fahmay"],["Placement test","Imtixaanka meelaynta"],["Start from Lesson 1","Bilow Casharka 1"],["Start from Lesson 1 instead","Casharka 1 ka bilow"],["You will start at Lesson","Waxaad ka bilaabi doontaa Casharka"],["Your level","Heerkaaga"],["Your score","Dhibcahaaga"],["Start there","Halkaas ka bilow"],["The test is done!","Imtixaankii wuu dhammaaday!"],["Exercise result","Natiijada layliga"],["Quiz result","Natiijada hubinta"],["Second try","Jawaabo labaad"],["half credit each","½ dhibic midkiiba"],["Total","Wadarta"],["The ones you missed","Kuwa aad khaladay"],["Go to Review","Tag Dib-u-eegista"],["Continue to the quiz","Sii wad hubinta"],["Section","Qayb"],["Finish","Dhammee"],["Start the placement test","Bilow imtixaanka"],["The correct answer is not shown here — this is an assessment, not a lesson.","Jawaabta saxda ah halkan lama muujinayo — waa qiimeyn, ma aha cashir."],["Already know some English? Most people know the easy parts — nobody has to start in the same place.","Horay Ingiriisi ma u taqaannaa? Dadka badankoodu waxay yaqaannaan waxyaabaha fudud — qof kastaa meel isku mid ah kama bilaabo."]];
var _auditM=bilingualAudit;
bilingualAudit=function(){var r=_auditM();var en=0,soF=0;function chk(e,s){if(e){en++;if(s&&String(s).trim())soF++}}UI_PAIRS_M.forEach(function(p){chk(p[0],p[1])});var out={};Object.keys(r).forEach(function(k){out[k]=r[k]});out.en=r.en+en;out.so=r.so+soF;out.gaps=(r.en+en)-(r.so+soF);out.stageM={en:en,so:soF,gaps:en-soF};return out};
