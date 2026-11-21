function lNum(v){return (v===null||v===undefined||(typeof v==="number"&&isNaN(v)))?"—":v}
function lWeek(){
 var now=new Date();var dow=(now.getDay()+6)%7;var mon=new Date(now.getFullYear(),now.getMonth(),now.getDate()-dow);
 var names=["Is","Ta","Ar","Kh","Ji","Sa","Ax"];var t=todayStr();var out=[];
 for(var i=0;i<7;i++){var d=new Date(mon.getFullYear(),mon.getMonth(),mon.getDate()+i);var ds=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");var a=null;for(var j=0;j<S.activity.length;j++){if(S.activity[j].date===ds)a=S.activity[j]}out.push({name:names[i],ds:ds,studied:!!(a&&(a.lessons>0||a.xp>10)),today:ds===t})}
 return out;
}
function lRing(size,pct,gold){
 var r=(size/2)-3.5;var c=(2*Math.PI*r).toFixed(1);var col="var(--l-teal)";
 return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" class="u-rot" aria-hidden="true"><circle cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+r+'" fill="none" stroke="rgba(45,212,191,.18)" stroke-width="3.5"/><circle cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="'+c+'" stroke-dashoffset="'+(c*(1-Math.min(1,pct))).toFixed(1)+'"/></svg>';
}
function lCloseSheet(){var w=document.getElementById("lSheetWrap");if(w)w.remove()}
function lOpenProgressSheet(){
 lCloseSheet();if(!S)return;
 var wk=lWeek();var lvl=hLevel();var tL=todayLessonsCount();var goal=S.profile.goal||2;var gpct=goal?tL/goal:0;
 var dots=wk.map(function(d){return '<div class="u-row u-col u-a-center"><span class="wdot2'+(d.studied?" done":"")+(d.today?" today":"")+'">'+(d.studied?""+uiIcon("check"):"")+'</span><span class="muted u-bold small">'+d.name+"</span></div>"}).join("");
 var w=document.createElement("div");w.id="lSheetWrap";
 w.innerHTML='<div id="lSheet" role="dialog" aria-modal="true" aria-label="Horumarkayga / My progress"><div class="handle"></div><button class="closeBtn" id="lSheetClose" aria-label="Xir / Close">'+uiIcon("close")+'</button>'
 +'<h2 class="u-mt-1 u-mb-2 u-t-lg">'+lng('Horumarkayga','My progress')+'</h2>'
 +'<p class="u-mt-1 u-mb-2 u-bold">'+lng('Toddobaadkan','This week')+'</p><div class="u-row u-j-between u-measure">'+dots+"</div>"
 +'<div class="l-sheetRow"><svg class="ic '+(S.streak>=1?"l-flameOn":"l-flameOff")+' u-sq-26" aria-hidden="true"><use href="#i-flame"></use></svg><span>Streak: <strong>'+lNum(S.streak)+'</strong> · '+lng('Maalmood xiriir','Day streak')+'</span></div>'
 +'<div class="l-sheetRow"><span class="u-t-xl u-gold" aria-hidden="true">'+uiIcon("star")+'</span><span>XP: <strong>'+lNum(S.xp)+' XP</strong> · '+esc(lvl[1])+" / "+esc(lvl[2])+"</span></div>"
 +'<div class="l-sheetRow">'+lRing(64,gpct,gpct>=1)+'<span>Today\u2019s goal: <strong>'+lNum(tL)+" / "+lNum(goal)+'</strong> · '+lng('Hadafka maanta','Today\u2019s goal')+'</span></div>'
 +"</div>";
 document.body.appendChild(w);
 document.getElementById("lSheetClose").addEventListener("click",lCloseSheet);
 w.addEventListener("click",function(e){if(e.target===w)lCloseSheet()});
}
hSafe(function(){
 var seg=document.querySelector(".langseg");if(!seg||document.getElementById("hTopSnd"))return;
 var b=document.createElement("button");b.className="iconbtn";b.id="hTopSnd";b.setAttribute("aria-label",lng("Codka","Sound on or off"));b.textContent="🔊";
 b.addEventListener("click",function(){if(!S)return;var sh=ensureStageH(S);sh.sound=!sh.sound;b.textContent=sh.sound?"🔊":"🔇";save();if(sh.sound){hConsec=0;hSndCorrect()}});
 seg.parentNode.insertBefore(b,seg);
});
function lLangSync(){if(!S||!S.profile)return;var so=S.profile.ui!=="en";var a=document.getElementById("langSO"),b=document.getElementById("langEN");if(a)a.classList.toggle("on",so);if(b)b.classList.toggle("on",!so)}
hSafe(function(){
 var a=document.getElementById("langSO"),b=document.getElementById("langEN");
 function set(ui){return function(){if(!S||!S.profile)return;if(S.profile.ui!==ui){S.profile.ui=ui;save();render()}else{lLangSync()}}}
 if(a)a.addEventListener("click",set("so"));
 if(b)b.addEventListener("click",set("en"));
});
var _rL=render;
render=function(){
 if(view==="path"){setNav("home");_rL();hSafe(function(){var j=document.getElementById("lJourney");if(j)j.scrollIntoView()});return}
 _rL();
 hSafe(function(){
  document.body.classList.toggle("view-home",view==="home"&&!!S&&!!S.profile.onboarded&&!guestMode);
  var hs=document.getElementById("hStrip");if(hs&&view==="home")hs.remove();
  lLangSync();
  if(view==="practice"&&S&&S.profile.onboarded&&!document.getElementById("lReviewCard")){
   var due=dueCards().length;var mq=(S.mistakes||[]).length;
   var c=document.createElement("button");c.className="l-rowcard";c.id="lReviewCard";c.style.minHeight="72px";
   c.innerHTML='<svg class="ic" aria-hidden="true"><use href="#i-review"></use></svg><span>'+lng('Dib-u-eegis','Review')+''+(due||mq?'<span class="u-block u-medium small muted">'+due+" "+lng("kaar oo sugaya","cards due")+" · "+mq+" "+lng("khalad oo furan","open mistakes")+"</span>":"")+'</span><span class="chev" aria-hidden="true">›</span>';
   c.addEventListener("click",function(){setNav("review");render()});
   app.insertAdjacentElement("afterbegin",c);
  }
  if(view==="profile"&&S&&S.profile.onboarded&&!document.getElementById("lAcadRow")){
   var frag=document.createElement("div");
   frag.innerHTML='<p class="u-mt-0 u-mb-3 small muted">Akadeemiyada Ingiriisiga Soomaaliyeed</p>'
   +'<button class="l-rowcard" id="lAcadRow"><svg class="ic" aria-hidden="true"><use href="#i-cap"></use></svg><span>'+lng('Dugsiyo','Academies')+'</span><span class="chev" aria-hidden="true">›</span></button>'
   +'<button class="l-rowcard" id="lProgRow"><svg class="ic" aria-hidden="true"><use href="#i-review"></use></svg><span>'+lng('Horumarkayga','My progress')+'</span><span class="chev" aria-hidden="true">›</span></button>';
   app.insertAdjacentElement("afterbegin",frag);
   document.getElementById("lAcadRow").addEventListener("click",function(){setNav("acad");render()});
   document.getElementById("lProgRow").addEventListener("click",function(){lOpenProgressSheet()});
  }
 });
};
