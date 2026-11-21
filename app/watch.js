var YT_CHANNEL_ID="UCg5zNdqR333HeqBi4kW3Ugg";
var YT_CHANNEL_URL="https://www.youtube.com/channel/"+YT_CHANNEL_ID;
var YT_UPLOADS_LIST="UUg5zNdqR333HeqBi4kW3Ugg";
var watchQuery="",watchLatestOpen=false,watchWord=null;
function epRange(ep){
 if(ep.lesson==null)return null;
 var m=/(\d+)\s*[–\-]\s*(\d+)/.exec(ep.lessonsEn||"");
 var a=ep.lesson,b=ep.lesson;if(m){a=+m[1];b=+m[2]}
 if(ep.lesson<a)a=ep.lesson;if(ep.lesson>b)b=ep.lesson;
 return[a,b];
}
function epGroupOf(ep){
 if(ep.rp||ep.lesson==null)return{key:"dl",order:999,en:"Daily Life",so:"Nolosha Maalinlaha",sub:"Role-plays / Door-ciyaar"};
 var st=stageOf(ep.lesson);var i=STAGES.indexOf(st);var parts=String(st.name).split(" — ");
 return{key:"s"+i,order:i,en:parts[0]||st.name,so:parts[1]||"",sub:st.cefr+" · Lessons "+st.from+"–"+st.to+" / Cashirrada "+st.from+"–"+st.to};
}
function watchGroups(list){
 var map={},out=[];
 list.forEach(function(ep){var idx=EPISODES.indexOf(ep);var g=epGroupOf(ep);var cur=map[g.key];if(!cur){cur=map[g.key]={key:g.key,order:g.order,en:g.en,so:g.so,sub:g.sub,eps:[],last:-1};out.push(cur)}cur.eps.push(ep);if(idx>cur.last)cur.last=idx});
 out.forEach(function(g){g.eps.sort(function(a,b){var ka=a.lesson!=null?a.lesson:1e6+(a.dl||0),kb=b.lesson!=null?b.lesson:1e6+(b.dl||0);return ka-kb||(a.n||0)-(b.n||0)})});
 out.sort(function(a,b){return a.order-b.order});
 var newest=null;out.forEach(function(g){if(!newest||g.last>newest.last)newest=g});if(newest)newest.newest=true;
 return out;
}
function watchNextFor(n){
 var best=null;
 EPISODES.forEach(function(ep){var r=epRange(ep);if(!r)return;if(n>=r[0]&&n<=r[1]){if(!best||Math.abs(ep.lesson-n)<Math.abs(best.lesson-n))best=ep}});
 return best;
}
function epMatches(ep,q){
 if(!q)return true;
 var hay=[ep.titleEn,ep.titleSo,ep.descEn,ep.descSo,ep.lessonsEn,ep.lessonsSo,ep.n?"cashar "+ep.n+" episode "+ep.n+" lesson "+ep.n:"",ep.dl?"daily life "+ep.dl+" nolosha maalinlaha "+ep.dl:""].join(" ");
 return norm(hay).indexOf(q)>=0;
}
function splitSentences(t){var p=String(t||"").replace(/\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc)\./g,"$1\u0001");var m=p.match(/[^.!?]+[.!?]+["”]?|[^.!?]+$/g);return(m||[]).map(function(x){return x.replace(/\u0001/g,".").trim()}).filter(Boolean)}
function epLines(ep){
 var lines=[],seen={};
 function add(en,so){en=String(en||"").trim();so=String(so||"").trim();if(!en)return;var k=norm(en);if(seen[k])return;seen[k]=1;lines.push([en,so])}
 var se=splitSentences(ep.descEn),ss=splitSentences(ep.descSo);
 if(se.length===ss.length&&se.length>1)se.forEach(function(x,i){add(x,ss[i])});else add(ep.descEn,ep.descSo);
 (ep.learn||[]).forEach(function(b){add(b[0],b[1])});
 if(ep.rp&&typeof ROLEPLAYS!=="undefined"){var rp=null;ROLEPLAYS.forEach(function(x){if(x.id===ep.rp)rp=x});
  if(rp)rp.turns.forEach(function(t){add(t.n,t.ns);(t.opts||[]).forEach(function(o){if(o.c)add(o.e,o.s)})})}
 else if(ep.lesson!=null&&LESSONS[ep.lesson-1]){var L=LESSONS[ep.lesson-1];(L.vocab||[]).slice(0,8).forEach(function(v){if(v.exEn)add(v.exEn,v.exSo)})}
 return lines;
}
var WORDMAP=null;
function wordMap(){if(WORDMAP)return WORDMAP;WORDMAP={};dictUnified().forEach(function(e){var k=norm(e.en);if(k&&!WORDMAP[k])WORDMAP[k]=e});return WORDMAP}
function wordLookup(w){
 var m=wordMap();var k=norm(w).replace(/^[^a-z0-9']+|[^a-z0-9']+$/g,"");if(!k)return null;
 var tries=[k];
 if(/'s$/.test(k))tries.push(k.replace(/'s$/,""));
 if(/ies$/.test(k))tries.push(k.replace(/ies$/,"y"));
 if(/(s|x|ch|sh)es$/.test(k))tries.push(k.replace(/es$/,""));
 if(/s$/.test(k))tries.push(k.replace(/s$/,""));
 if(/ing$/.test(k)){tries.push(k.replace(/ing$/,""));tries.push(k.replace(/ing$/,"e"));tries.push(k.replace(/(.)\1ing$/,"$1"))}
 if(/ed$/.test(k)){tries.push(k.replace(/ed$/,""));tries.push(k.replace(/d$/,""));tries.push(k.replace(/ied$/,"y"));tries.push(k.replace(/(.)\1ed$/,"$1"))}
 if(/er$/.test(k)){tries.push(k.replace(/er$/,""));tries.push(k.replace(/r$/,""))}
 if(/est$/.test(k)){tries.push(k.replace(/est$/,""));tries.push(k.replace(/st$/,""))}
 if(/ly$/.test(k))tries.push(k.replace(/ly$/,""));
 for(var i=0;i<tries.length;i++){if(m[tries[i]])return m[tries[i]]}
 return null;
}
function inDeck(en){return !!(S&&S.srs&&S.srs.some(function(c){return norm(c.en)===norm(en)}))}
function tapLineHTML(en){
 return String(en).split(/(\s+)/).map(function(tok){
  if(!/[A-Za-z]/.test(tok))return esc(tok);
  var w=tok.replace(/^[^A-Za-z]+|[^A-Za-z']+$/g,"");
  return '<button type="button" class="wword" data-w="'+esc(w)+'" lang="en">'+esc(tok)+'</button>';
 }).join("");
}
function watchSheetHTML(){
 if(!watchWord)return "";
 var w=watchWord.word,hit=watchWord.hit;
 var h='<div class="wsheet" id="wsheet" role="dialog" aria-label="Macnaha erayga / Word meaning"><div class="wsheet-in">';
 if(hit){
  var saved=inDeck(hit.en);
  h+='<div class="wsheet-row"><div class="u-minw-0"><div class="wsheet-en" lang="en">'+esc(hit.en)+(norm(hit.en)!==norm(w)?' <span class="small muted">('+esc(w)+')</span>':"")+'</div><div class="wsheet-so" lang="so">'+esc(hit.so)+'</div>'
   +(hit.exEn?'<p class="u-mt-2 u-mb-0 small" lang="en">'+esc(hit.exEn)+(hit.exSo?'<br><span class="muted" lang="so">'+esc(hit.exSo)+"</span>":"")+"</p>":"")+'</div>'
   +'<div class="u-row u-a-start u-fixed">'+speakBtn(hit.en)+'<button type="button" class="iconbtn" id="wsheetClose" aria-label="Xir / Close">'+uiIcon("close")+'</button></div></div>'
   +'<div class="u-row u-wrap u-mt-3"><button type="button" class="btn" id="wsheetSave"'+(saved?" disabled":"")+'>'+(saved?uiIcon("check")+lng("Kaararkaaga ayuu ku jiraa","In your review deck"):uiIcon("plus")+lng("Kaydi dib-u-eegis","Save to review"))+'</button></div>';
 }else{
  h+='<div class="wsheet-row"><div><div class="wsheet-en" lang="en">'+esc(w)+'</div><p class="u-mt-1 u-mb-0 muted" lang="so">'+lng('Eraygan wali qaamuuska kuma jiro.','This word is not in the dictionary yet.')+'</p></div><div class="u-row u-fixed">'+speakBtn(w)+'<button type="button" class="iconbtn" id="wsheetClose" aria-label="Xir / Close">'+uiIcon("close")+'</button></div></div>';
 }
 return h+'</div></div>';
}
function paintWatchSheet(){
 var old=document.getElementById("wsheet");if(old)old.remove();
 app.querySelectorAll(".wword.on").forEach(function(b){b.classList.remove("on")});
 if(!watchWord)return;
 app.insertAdjacentHTML("beforeend",watchSheetHTML());
 var sh=document.getElementById("wsheet");bindSpeak(sh);
 var c=document.getElementById("wsheetClose");if(c)c.addEventListener("click",function(){watchWord=null;paintWatchSheet()});
 var sv=document.getElementById("wsheetSave");if(sv)sv.addEventListener("click",function(){
  if(!S||!watchWord||!watchWord.hit)return;
  addSRS(watchWord.hit.en,watchWord.hit.so);save();
  sv.disabled=true;sv.innerHTML=uiIcon("check")+lng("Waa la kaydiyay — kaararka dib-u-eegista","Saved to your review deck");
  var live=document.getElementById("wsheetLive");if(live)live.textContent="Saved";
 });
}
function watchLinesHTML(ep){
 var lines=epLines(ep);if(!lines.length)return "";
 return '<div class="u-mt-3 card wpanel"><h3 class="u-mt-0 u-mb-2">'+uiIcon("translate")+lng('Macnaha Soomaaliga','Somali meaning')+'</h3><p class="u-mt-0 u-mb-3 small muted">'+lng('Eray kasta oo Ingiriisi ah taabo si aad u aragto macnihiisa Soomaali, kadibna kaydi dib-u-eegistaada.','Tap any English word to see its Somali meaning, then save it to your review deck.')+'</p>'
 +lines.map(function(p){return '<div class="wline"><p class="wline-en"><span class="wline-txt">'+tapLineHTML(p[0])+'</span>'+speakBtn(p[0])+'</p>'+(p[1]?'<p class="wline-so" lang="so">'+esc(p[1])+'</p>':"")+'</div>'}).join("")
 +'<p class="sr-only" id="wsheetLive" aria-live="polite"></p></div>';
}
function watchChannelHTML(){
 var h='<div class="u-mt-3 card wchannel"><div class="u-row u-a-center u-wrap"><span class="wch-logo" aria-hidden="true">SEA</span><div class="u-grow u-minw"><h2 class="u-m-0">Somali English Academy</h2><p class="u-mt-1 u-mb-1 small muted">'+lng('Kanaalka YouTube ee akadeemiyadda','The academy’s YouTube channel')+'</p></div>'
 +'<a class="btn secondary" href="'+YT_CHANNEL_URL+'" target="_blank" rel="noopener noreferrer">'+lng('Kanaalka fur','Open channel')+' '+uiIcon("external")+'</a></div>'
 +'<h3 class="u-mt-5 u-mb-2 u-row u-a-center">'+uiIcon("sparkle")+lng('Muuqaalladii ugu dambeeyay','Latest videos')+'</h3>';
 if(watchLatestOpen){
  h+='<div class="wframe skel"><iframe src="https://www.youtube-nocookie.com/embed/videoseries?list='+YT_UPLOADS_LIST+'&playsinline=1&rel=0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen playsinline title="Somali English Academy — latest videos" loading="lazy"></iframe></div>'
  +'<p class="u-mt-2 u-mb-0 small muted">'+lng('Muuqaal kasta oo cusub oo kanaalka la geliyo halkan ayuu si toos ah uga soo baxaa. Liiska ka dooro muuqaal.','Every new channel video appears here automatically. Pick a video from the list inside the player.')+'</p>';
 }else{
  h+='<button type="button" class="wlatest" id="watchLatestBtn" aria-label="Muuqaalladii ugu dambeeyay daawo / Watch the latest videos"><span class="wlatest-play">'+uiIcon("play")+'</span><span><strong>'+lng('Taabo si aad u daawato','Tap to load')+'</strong><br><span class="small muted">'+lng('Muuqaallada cusub ee kanaalka — internet ayay u baahan yihiin.','The channel’s newest uploads — needs internet.')+'</span></span></button>';
 }
 return h+'</div>';
}
function ytFacadeHTML(id){return '<button type="button" data-ytf="'+id+'" aria-label="Daawo / Watch video" class="u-w-full u-p-0 u-frame"><img src="https://i.ytimg.com/vi/'+id+'/hqdefault.jpg" alt="" loading="lazy" class="u-w-full u-block u-thumb"><span class="u-play-badge"><span class="u-play-tri"></span></span></button>'}
document.addEventListener("click",function(e){var f=e.target&&e.target.closest?e.target.closest("[data-ytf]"):null;if(!f)return;var id=f.getAttribute("data-ytf");if(!id)return;f.outerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&playsinline=1&rel=0" class="u-w-full u-frame" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen title="Video lesson"></iframe>'});
function watchPlayerHTML(sel){
 return '<div class="u-mt-3 card" id="watchPlayer"><div class="wframe">'+ytFacadeHTML(sel.yt)+'</div>'
 +'<h2 class="u-mt-3 u-mb-1">'+esc(sel.titleSo)+'</h2><p class="u-mt-1 u-mb-1 muted">'+esc(sel.titleEn)+'</p>'
 +'<h3 class="u-mt-4 u-mb-2 u-row u-a-center">'+uiIcon("book")+lng('Waxaad baran doontaa','What you will learn')+'</h3><ul class="u-mt-1 u-mb-1 u-indent">'+sel.learn.map(function(b){return '<li class="u-mt-1 u-mb-1">'+esc(b[1])+'<br><span class="muted">'+esc(b[0])+'</span></li>'}).join("")+'</ul>'
 +'<p class="u-mt-3 u-row u-wrap">'+(sel.rp?('<button class="btn" data-eprp="'+sel.rp+'">'+uiIcon("mic")+lng('Tababar: fur door-ka-ciyaarka','Practise the role-play')+'</button>'):('<button class="btn" data-eplesson="'+sel.lesson+'">Tag cashirka '+sel.lesson+' / Go to Lesson '+sel.lesson+uiIcon("arrow")+'</button>'))+'<button class="btn secondary" id="watchBack">'+uiIcon("back")+lng('Liiska','Back to list')+'</button></p></div>'
 +watchLinesHTML(sel);
}
function renderWatch(){
 var sel=null;EPISODES.forEach(function(e){if(e.yt===watchEp)sel=e});
 var q=norm(watchQuery);
 var hits=EPISODES.filter(function(ep){return epMatches(ep,q)});
 var groups=watchGroups(hits);
 var h='<h1>'+lng('Daawo','Watch')+'</h1><p class="muted">'+lng('Casharro muuqaal ah oo leh jilayaal isku mid ah — Ayaan, Faadumo iyo Mr. Daniel — Soomaali iyo Ingiriisi. Kaadh taabo si aad u daawato.','Video lessons with the same cast — Ayaan, Faadumo and Mr. Daniel — in Somali and English. Tap a card to watch.')+'</p><p class="u-row u-a-center small muted">'+uiIcon("signal")+lng('Muuqaalladu waxay u baahan yihiin internet','Videos need internet')+'</p>';
 if(sel)h+=watchPlayerHTML(sel);
 h+=watchChannelHTML();
 h+='<div class="wsearch"><label for="watchSearch">'+lng('Raadi cashar muuqaal ah','Search episodes')+'</label><input type="search" id="watchSearch" value="'+esc(watchQuery)+'" placeholder="salaam, market, cashar 5, daily life…" autocomplete="off" aria-describedby="watchCount"><p class="u-mt-2 u-mb-0 small muted" id="watchCount">'+hits.length+' / '+EPISODES.length+' '+lng('cashar','episodes')+'</p></div>';
 if(groups.length){
  h+='<div class="wchips" role="navigation" aria-label="Kooxaha / Groups">'+groups.map(function(g){return '<a class="chipbtn'+(g.newest?" sel":"")+'" href="#wg-'+g.key+'" data-wjump="wg-'+g.key+'" '+(g.key==="dl"?"":stageStyle(g.eps[0].lesson))+'>'+(g.newest?uiIcon("sparkle"):'<i aria-hidden="true"></i>')+esc(g.so||g.en)+' / '+esc(g.en)+' ('+g.eps.length+')</a>'}).join("")+'</div>';
  groups.forEach(function(g){
   h+='<section class="wgroup" id="wg-'+g.key+'" '+(g.key==="dl"?"":stageStyle(g.eps[0].lesson))+'><h2><i aria-hidden="true"></i>'+esc(g.so||g.en)+' <span class="muted">/ '+esc(g.en)+'</span>'+(g.newest?'<span class="pill">'+uiIcon("sparkle")+lng('Cusub','Newest')+'</span>':"")+'</h2><p class="small muted">'+esc(g.sub)+'</p><div class="u-stack">'+g.eps.map(epCardHTML).join("")+'</div></section>';
  });
 }else{
  h+='<div class="u-mt-4 card empty">'+uiIcon("search")+'<h2>'+lng('Natiijo lama helin','No episodes found')+'</h2><p class="muted">'+lng('Isku day eray kale, ama nadiifi raadinta.','Try another word, or clear the search.')+'</p><p class="u-mt-4"><button class="btn secondary" id="watchClear">'+lng('Nadiifi raadinta','Clear search')+'</button></p></div>';
 }
 app.innerHTML=h;
 bindSpeak(app);
 app.querySelectorAll("[data-ep]").forEach(function(b){b.addEventListener("click",function(){watchEp=b.dataset.ep;watchWord=null;renderWatch();var p=document.getElementById("watchPlayer");if(p)p.scrollIntoView({block:"start"})})});
 app.querySelectorAll("[data-eplesson]").forEach(function(b){b.addEventListener("click",function(){var n=+b.dataset.eplesson;if(S&&S.profile&&!S.profile.onboarded&&!guestMode){window.__pendingLesson=n;renderOnboarding();window.scrollTo(0,0)}else{openLesson(n)}})});
 app.querySelectorAll("[data-eprp]").forEach(function(b){b.addEventListener("click",function(){var id=b.dataset.eprp;if(!ROLEPLAYS.some(function(x){return x.id===id}))return;ensureD();if(!S.stageD.rp[id])S.stageD.rp[id]="started";save();rpSel=id;rpTurn=0;rpPhase="listen";rpDone=[];rpWrong=null;setNav("practice");render()})});
 app.querySelectorAll(".wword").forEach(function(b){b.addEventListener("click",function(){var w=b.dataset.w;if(!w)return;watchWord={word:w,hit:wordLookup(w)};paintWatchSheet();b.classList.add("on")})});
 app.querySelectorAll("[data-wjump]").forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();var t=document.getElementById(a.dataset.wjump);if(t)t.scrollIntoView({block:"start"})})});
 var wb=document.getElementById("watchBack");if(wb)wb.addEventListener("click",function(){watchEp=null;watchWord=null;renderWatch();window.scrollTo(0,0)});
 var lb=document.getElementById("watchLatestBtn");if(lb)lb.addEventListener("click",function(){watchLatestOpen=true;renderWatch();var c=app.querySelector(".wchannel");if(c)c.scrollIntoView({block:"start"})});
 var ws=document.getElementById("watchSearch");if(ws)ws.addEventListener("input",function(){watchQuery=ws.value;clearTimeout(window.__wsT);window.__wsT=setTimeout(function(){var pos=ws.selectionStart;var top=window.scrollY;renderWatch();var n=document.getElementById("watchSearch");if(n){n.focus({preventScroll:true});try{n.setSelectionRange(pos,pos)}catch(e){}}window.scrollTo(0,top)},180)});
 var wc=document.getElementById("watchClear");if(wc)wc.addEventListener("click",function(){watchQuery="";renderWatch();var n=document.getElementById("watchSearch");if(n)n.focus()});
 app.querySelectorAll(".wframe.skel iframe").forEach(function(f){f.addEventListener("load",function(){f.parentNode.classList.remove("skel")})});
 paintWatchSheet();
 if(typeof uiPolish==="function")uiPolish();
}
epCardHTML=function(ep){
 var st=ep.lesson!=null?stageStyle(ep.lesson):"";
 return '<div class="card" '+st+'>'
 +'<button type="button" data-ep="'+ep.yt+'" class="u-block u-w-full u-p-0 u-bare" aria-label="Daawo / Watch: '+esc(ep.titleEn)+'"><span class="u-block u-bg-soft u-media"><img src="https://i.ytimg.com/vi/'+ep.yt+'/hqdefault.jpg" alt="" loading="lazy" class="u-w-full u-block u-thumb"><span class="wplay"><span>'+uiIcon("play")+'</span></span></span></button>'
 +'<p class="u-mt-3 u-mb-1 u-row u-a-center u-wrap"><span class="pill"><i aria-hidden="true"></i>'+(ep.dl?lng("Nolosha Maalinlaha "+ep.dl,"Daily Life "+ep.dl):lng("Muuqaal "+ep.n,"Episode "+ep.n))+'</span><span class="u-inline-row u-a-center small muted">'+uiIcon("clock")+ep.dur+'</span></p>'
 +'<h2 class="u-mt-1 u-mb-0">'+esc(ep.titleSo)+'</h2><p class="u-mt-0 u-mb-2 muted">'+esc(ep.titleEn)+'</p>'
 +'<p class="u-mt-0 u-mb-2" lang="so">'+esc(ep.descSo)+'<br><span class="muted" lang="en">'+esc(ep.descEn)+'</span></p>'
 +'<p class="u-mt-0 u-mb-3 small muted">'+lng('Waxay la socotaa','Pairs with:')+' '+lng(esc(ep.lessonsSo),esc(ep.lessonsEn))+'</p>'
 +'<button type="button" class="btn" data-ep="'+ep.yt+'">'+uiIcon("play")+lng('Daawo','Watch')+'</button></div>';
};
var _nfyK=nextForYou;
nextForYou=function(){
 var base=_nfyK();if(base.kind!=="lesson")return base;
 var ep=watchNextFor(base.lesson);if(!ep)return base;
 var r=epRange(ep);var from=Math.max(r[0],ep.lesson);
 for(var i=from;i<=r[1];i++){if(S.completed["L"+i])return base}
 return{kind:"watch",lesson:base.lesson,yt:ep.yt,en:"Watch next: "+ep.titleEn+" — before Lesson "+base.lesson,so:"Daawo marka xigta: "+ep.titleSo+" — ka hor Cashirka "+base.lesson,btn:"Daawo / Watch"};
};
var _wshK=wireSmartHome;
wireSmartHome=function(next){_wshK(next);var nf=document.getElementById("nfGo");if(nf&&nf.dataset.kind==="watch"){var cl=nf.cloneNode(true);nf.parentNode.replaceChild(cl,nf);cl.addEventListener("click",function(){var ep=watchNextFor(+cl.dataset.lesson||next);watchEp=ep?ep.yt:null;watchWord=null;setNav("watch");render()})}};
var UI_PAIRS_K=[["Latest videos","Muuqaalladii ugu dambeeyay"],["Open channel","Kanaalka fur"],["Tap to load","Taabo si aad u daawato"],["Somali meaning","Macnaha Soomaaliga"],["Save to review","Kaydi dib-u-eegis"],["In your review deck","Kaararkaaga ayuu ku jiraa"],["This word is not in the dictionary yet","Eraygan wali qaamuuska kuma jiro"],["Search episodes","Raadi cashar muuqaal ah"],["No episodes found","Natiijo lama helin"],["Newest","Cusub"],["Daily Life","Nolosha Maalinlaha"],["Watch next","Daawo marka xigta"],["Close","Xir"]];
var _auditK=bilingualAudit;
bilingualAudit=function(){var r=_auditK();var en=0,soF=0;function chk(e,s){if(e){en++;if(s&&String(s).trim())soF++}}UI_PAIRS_K.forEach(function(p){chk(p[0],p[1])});var out={};Object.keys(r).forEach(function(k){out[k]=r[k]});out.en=r.en+en;out.so=r.so+soF;out.gaps=(r.en+en)-(r.so+soF);out.stageK={en:en,so:soF,gaps:en-soF};return out};
