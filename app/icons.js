function stage12Of(n){for(var i=0;i<STAGES12.length;i++){if(n>=STAGES12[i][2]&&n<=STAGES12[i][3])return i}return n<1?0:11}
function stageColor(n){return "var(--st"+(stage12Of(n)+1)+")"}
function stageStyle(n){return 'style="--stage:'+stageColor(n)+'"'}
function stageDone(si){var st=STAGES12[si];var d=0;for(var i=st[2];i<=st[3];i++){if(S&&S.completed&&S.completed["L"+i])d++}return d}
function ringHTML(pct,label){var r=30,c=2*Math.PI*r;var off=c*(1-Math.max(0,Math.min(1,pct)));return '<div class="ring" role="img" aria-label="'+esc(label||Math.round(pct*100)+"%")+'"><svg viewBox="0 0 72 72"><circle class="ring-bg" cx="36" cy="36" r="'+r+'"/><circle class="ring-fg" cx="36" cy="36" r="'+r+'" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'"/></svg><b>'+Math.round(pct*100)+'%</b></div>'}
function journeyHTML(nextN,en){
 var cur=stage12Of(nextN),all=S&&S.completed?Object.keys(S.completed).length:0,open=false;
 try{open=localStorage.getItem("sea-journey-open")==="1"}catch(e){}
 var h='<section class="journey road'+(open?" is-open":"")+'" aria-labelledby="roadTitle"><div class="road-head"><h2 id="roadTitle">'+(en?"Your journey":"Safarkaaga")+'</h2><span class="road-count">'+all+' / 1,000</span></div><ol class="road-stops">';
 STAGES12.forEach(function(st,i){
  var total=st[3]-st[2]+1,done=stageDone(i),state=done>=total?"is-done":i===cur?"is-here":"is-ahead",side=i%2?"r":"l",far=i<cur-1||i>cur+2;
  h+='<li class="road-stop '+state+(far?" is-far":"")+'" data-side="'+side+'" '+stageStyle(st[2])+'><button type="button" data-jstage="'+i+'" aria-label="'+esc((en?st[0]:st[1])+" · "+done+"/"+total)+'"'+(state==="is-here"?' aria-current="step"':"")+'><span class="road-node">'+(state==="is-done"?uiIcon("check"):state==="is-here"?uiIcon("starSo"):(i+1))+'</span><span class="road-label"><b>'+esc(en?st[0]:st[1])+'</b><small>'+(state==="is-here"?(en?"Lesson ":"Casharka ")+nextN+" · ":"")+(en?"Lessons ":"Cashirrada ")+st[2]+'–'+st[3]+'</small></span></button>'
   +(i<STAGES12.length-1?'<svg class="road-seg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="'+(side==="l"?"M14 0C14 60 86 40 86 100":"M86 0C86 60 14 40 14 100")+'" vector-effect="non-scaling-stroke"/></svg>':"")+'</li>';
 });
 return h+'</ol><button type="button" class="road-toggle" aria-expanded="'+open+'">'+(en?(open?"Show less":"Show all 12 stages"):(open?"Muuji wax yar":"Muuji dhammaan 12-ka marxaladood"))+'</button></section>';
}
var EMO_RE_LEAD=/^\s*(?:(?:\p{Extended_Pictographic}|[☀-➿⭐⭕⬆⬇←-⇿✔✖✓]|[\u{1F1E6}-\u{1F1FF}]{2}|[0-9#*]️?⃣)(?:️|‍\p{Extended_Pictographic})*\s*)+/u;
var EMO_RE_TAIL=/\s*(?:(?:\p{Extended_Pictographic}|[☀-➿⭐⭕✔✖✓]|[\u{1F1E6}-\u{1F1FF}]{2})(?:️|‍\p{Extended_Pictographic})*\s*)+$/u;
var EMO_ICON={"✅":"check","✓":"check","✔":"check","❌":"close","🔊":"wave","🔇":"mute","🎓":"cap","📚":"book","📖":"book","🧮":"calc","📝":"pen","✏":"pen","✍":"pen","🤝":"people","🧩":"puzzle","✉":"mail","🔒":"lock","📅":"calendar","🗓":"calendar","📋":"clipboard","🎙":"mic","🎤":"mic","🪪":"id","⭐":"star","⚠":"alert","🔥":"flame","🔁":"repeat","🕐":"clock","💡":"bulb","🎯":"target","🐢":"slow","💬":"chat","🗣":"chat","🎭":"chat","🎧":"headphones","🔎":"search","🔍":"search","🔤":"translate","🎬":"video","📶":"signal","🧰":"tools","🗺":"map","📷":"camera","🏠":"home","🌐":"globe","📈":"chart","📊":"chart","🏆":"trophy","🃏":"layers","ℹ":"info","▶":"play","⏸":"pause","👤":"user"};
var EMO_SKIP=".opt,.vitem,.vocab,.dialogue,.wordchips,.wline,.vis,[data-vis],.visual,.pic,.scene,.flash,.mapword,.emoji,.keep-emoji,pre,code,textarea,input";
function stripUiEmoji(root){
 if(!root||typeof root.querySelectorAll!=="function")return;
 var sel="h1,h2,h3,h4,summary,button,label,.pill,.badge,.chipbtn,.simple-row,.simple-text-button,.simple-back,.stepbar span,.navind,p.small.muted,.kpi div span,.hero-eyebrow";
 root.querySelectorAll(sel).forEach(function(el){
  if(el.closest(EMO_SKIP))return;
  var nodes=el.childNodes;if(!nodes.length)return;
  var first=null,last=null;
  for(var i=0;i<nodes.length;i++){var n=nodes[i];if(n.nodeType===3){if(n.nodeValue.trim()){first=n;break}}else if(n.nodeType===1){if(n.tagName==="SVG"||n.tagName==="svg"){continue}break}}
  for(var j=nodes.length-1;j>=0;j--){var m=nodes[j];if(m.nodeType===3){if(m.nodeValue.trim()){last=m;break}}else if(m.nodeType===1){if(m.tagName==="SVG"||m.tagName==="svg")continue;break}}
  if(first&&EMO_RE_LEAD.test(first.nodeValue)){var lead=first.nodeValue.match(EMO_RE_LEAD)[0].trim();var v=first.nodeValue.replace(EMO_RE_LEAD,"");if(v.trim()||el.querySelector("svg")){first.nodeValue=v;var nm=EMO_ICON[Array.from(lead)[0]];if(nm&&!el.querySelector("svg.ui-ic")){var sp=document.createElement("span");sp.innerHTML=uiIcon(nm);first.parentNode.insertBefore(sp.firstChild,first)}}}
  if(last&&(el.tagName==="BUTTON"||el.tagName==="H2"||el.tagName==="SUMMARY")&&EMO_RE_TAIL.test(last.nodeValue)){var w=last.nodeValue.replace(EMO_RE_TAIL,"");if(w.trim())last.nodeValue=w}
 });
 root.querySelectorAll("button").forEach(function(b){
  if(b.closest(EMO_SKIP)||b.querySelector("svg,img"))return;
  var t=b.textContent.trim();var name=null;
  if(t==="🔊")name="speaker";else if(t==="✕"||t==="×")name="close";else if(t==="▶")name="play";else if(t==="✓")name="check";else if(t==="➕"||t==="＋")name="plus";
  if(name){if(!b.getAttribute("aria-label"))b.setAttribute("aria-label",t);b.innerHTML=uiIcon(name)}
 });
}
function uiPolish(){
 try{stripUiEmoji(app);var top=document.querySelector(".topbar");if(top)stripUiEmoji(top);var nav=document.getElementById("lesNav");if(nav)stripUiEmoji(nav)}catch(e){}
 try{app.querySelectorAll("button.simple-row").forEach(function(b){if(b.querySelector("svg"))return;var lead=b.id==="homeAiTutor"?"sparkle":"book";b.insertAdjacentHTML("afterbegin",'<svg class="simple-icon" viewBox="0 0 24 24" aria-hidden="true">'+UI_ICONS[lead]+"</svg>");var txt=[].slice.call(b.childNodes).filter(function(n){return n.nodeType===3});txt.forEach(function(n){var sp=document.createElement("span");sp.textContent=n.nodeValue;b.replaceChild(sp,n)});b.insertAdjacentHTML("beforeend",'<svg class="simple-icon" viewBox="0 0 24 24" aria-hidden="true">'+UI_ICONS.chevron+"</svg>")})}catch(e){}
 try{var ai=document.getElementById("homeAiTutor"),all=document.getElementById("academyAllLessons");if(ai&&all&&ai.compareDocumentPosition(all)&Node.DOCUMENT_POSITION_FOLLOWING){all.insertAdjacentElement("afterend",ai)}}catch(e){}
 try{if(typeof step!=="undefined"&&typeof cur!=="undefined"&&cur&&document.body.classList.contains("inLesson")&&step===10){app.classList.add("lesson-result");var h2=app.querySelector("h2");if(h2&&!app.querySelector(".lesson-done-mark")){var ok=/gudubtay|passed/i.test(h2.textContent);h2.insertAdjacentHTML("beforebegin",'<span class="lesson-done-mark'+(ok?"":" is-retry")+'" aria-hidden="true">'+uiIcon(ok?"check":"refresh")+'</span>')}}else app.classList.remove("lesson-result")}catch(e){}
}
