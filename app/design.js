window.__SEA_BUILD="sea-f14";
var F14_ICONS={
 progress:'<path d="M5 20v-6M11 20V6M17 20v-9"/><path d="M3 20h18"/>',
 cert:'<circle cx="12" cy="9" r="5"/><path d="M8.6 13.4L7 21l5-2.6L17 21l-1.4-7.6"/>',
 target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/>',
 plan:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
 voice:'<path d="M4 10v4h3.5L12 18V6l-4.5 4z"/><path d="M15.5 9.5a4 4 0 0 1 0 5M18.2 7a7.6 7.6 0 0 1 0 10"/>',
 users:'<circle cx="9" cy="8.5" r="3.5"/><path d="M3 20c.6-3.4 2.9-5 6-5s5.4 1.6 6 5"/><path d="M15.8 5.4a3.5 3.5 0 0 1 0 6.4M17.6 15.3c1.9.5 3 2 3.4 4.7"/>',
 save:'<path d="M12 4v9M8.2 9.8L12 13.6l3.8-3.8"/><path d="M5 19h14"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4A2.6 2.6 0 1 1 12 12.3v1.5"/><circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none"/>',
 swap:'<path d="M7 7.5h10.5L14.5 4.5M17 16.5H6.5l3 3"/>',
 forms:'<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9.5 8h5M9.5 12h5M9.5 16h3"/>',
 book:'<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17.5H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 19.5V4.5M20 19.5H6.5"/>',
 pen:'<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M14.5 6.5l3 3"/>'
};
function fIcon(n,cls){return '<svg class="ic '+(cls||"")+'" viewBox="0 0 24 24" aria-hidden="true">'+(F14_ICONS[n]||"")+"</svg>"}
function fRow(id,icon,soT,enT,val,icCls){
 return '<button class="f-row" id="'+id+'"><span class="f-ic '+(icCls||"")+'">'+fIcon(icon)+'</span><span class="f-lab"><span class="so">'+esc(soT)+'</span><span class="en">'+esc(enT)+'</span></span>'+(val||"")+'<span class="f-chev" aria-hidden="true">›</span></button>';
}
function fSubHead(soT,enT){return '<div class="f-subhead"><button class="f-backbtn" id="fBack" aria-label="Dib / Back">←</button><h1>'+esc(soT)+'<span class="en">'+esc(enT)+'</span></h1></div>'}
function fWireBack(){var b=document.getElementById("fBack");if(b)b.addEventListener("click",function(){fProfScreen=null;renderProfile();window.scrollTo(0,0)})}
function fCloseSheet(){var w=document.getElementById("fSheetWrap");if(w)w.remove()}
function fOpenSheet(soT,enT,bodyHTML){
 fCloseSheet();
 var w=document.createElement("div");w.id="fSheetWrap";
 w.innerHTML='<div id="fSheet" role="dialog" aria-modal="true"><div class="handle"></div><button class="closeBtn" id="fSheetClose" aria-label="Xir / Close">'+uiIcon("close")+'</button><h2>'+esc(soT)+'<span class="u-block u-t-md muted u-medium">'+esc(enT)+'</span></h2>'+bodyHTML+"</div>";
 document.body.appendChild(w);
 document.getElementById("fSheetClose").addEventListener("click",fCloseSheet);
 w.addEventListener("click",function(e){if(e.target===w)fCloseSheet()});
 return w;
}
function fCertEarnedCount(){var c=0;STAGES12.forEach(function(st,si){if(stageComplete(si))c++});if(Object.keys(S.completed).length>=1000)c++;return c}
function fOpenCertSheet(){
 var earned=[];STAGES12.forEach(function(st,si){if(stageComplete(si))earned.push(si)});
 var full=Object.keys(S.completed).length>=1000;
 var nextSi=-1;for(var i=0;i<12;i++){if(!stageComplete(i)){nextSi=i;break}}
 var body="";
 if(earned.length||full){
  earned.forEach(function(si){var st=STAGES12[si];body+='<div class="f-srow"><span class="u-round f-ic gold">'+fIcon("cert")+'</span><span class="f-lab"><span class="so">Marxaladda '+(si+1)+': '+esc(st[1])+'</span><span class="en">Stage '+(si+1)+": "+esc(st[0])+'</span></span><button class="btn secondary" data-fcert="'+si+'">'+lng('Arag','View')+'</button></div>'});
  if(full)body+='<div class="f-srow"><span class="u-round f-ic gold">'+fIcon("cert")+'</span><span class="f-lab"><span class="so">Akadeemiyadda oo dhan</span><span class="en">Full Academy</span></span><button class="btn secondary" data-fcert="12">'+lng('Arag','View')+'</button></div>';
 }else{
  body+='<p class="u-mt-1 u-mb-2">'+lng('Wali shahaado ma haysatid. Marxalad dhammee si aad u hesho taada koowaad.','No certificates yet. Complete a stage to earn your first one.')+'</p>';
 }
 if(nextSi>=0){var nst=STAGES12[nextSi];var nd=0;for(var n=nst[2];n<=nst[3];n++)if(S.completed["L"+n])nd++;body+='<div class="muted f-srow"><span class="u-round f-ic">'+uiIcon("lock")+'</span><span class="f-lab"><span class="so">Marxaladda '+(nextSi+1)+': '+esc(nst[1])+'</span><span class="en">Stage '+(nextSi+1)+": "+esc(nst[0])+" · "+nd+" / "+(nst[3]-nst[2]+1)+' '+lng('cashir','lessons')+'</span></span></div>'}
 body+='<p class="muted u-mt-3 small">'+lng('Shahaado dhamaystir oo ka timid Somali English Academy — ma aha shahaado la aqoonsan yahay, mana aha GED.','A certificate of completion from Somali English Academy — not an accredited credential and not a GED.')+'</p>';
 fOpenSheet("Shahaadooyinkayga","My Certificates",body);
 document.querySelectorAll("#fSheet [data-fcert]").forEach(function(b){b.addEventListener("click",function(){certSel=+b.dataset.fcert;fCloseSheet();view="cert";setNav("cert");render()})});
}
function fOpenSwitchSheet(){
 var ids=Object.keys(ROOT.profiles);
 var body=ids.map(function(id){var p=ROOT.profiles[id];var dn=Object.keys(p.completed||{}).length;var ini=(p.profile.name||"?").trim().split(/\s+/).map(function(x){return x.charAt(0)}).slice(0,2).join("").toUpperCase()||"?";
  return '<button class="muted f-srow" data-fswitch="'+id+'" '+(id===ROOT.activeId?"disabled":"")+'><span class="f-sav" style="background:'+esc(p.profile.avatarColor||"#0e7c66")+'">'+esc(ini)+'</span><span class="f-lab"><span class="u-t-md so">'+esc(p.profile.name||"—")+(hasPin(p)?" "+uiIcon("lock"):"")+'</span><span class="en">'+dn+' / 1,000 cashir · '+p.xp+' XP · '+uiIcon("flame")+' '+(p.streak||0)+'</span></span>'+(id===ROOT.activeId?'<span class="f-val">'+lng('Adiga','You')+'</span>':"")+'</button>'}).join("");
 if(ids.length<4)body+='<div class="u-mt-4"><label for="fSwName" class="u-ink">'+lng('Ku dar barte kale','Add a learner')+'</label><input type="text" id="fSwName" placeholder="Magaca / Name" class="u-mt-2"><button class="u-w-full u-mt-3 btn" id="fSwAdd">'+lng('Ku dar','Add learner')+'</button><p class="muted small">'+lng('Ugu badnaan 4 qof oo barta hal aalad.','Up to 4 learners on one device.')+'</p></div>';
 else body+='<p class="muted u-mt-3 small">'+lng('Ugu badnaan 4 qof oo barta ayaa gaadhay.','The 4-learner limit is reached.')+'</p>';
 fOpenSheet("Beddel qofka barta","Switch learner",body);
 document.querySelectorAll("#fSheet [data-fswitch]").forEach(function(b){b.addEventListener("click",function(){var id=b.dataset.fswitch;fCloseSheet();switchProfile(id)})});
 var ad=document.getElementById("fSwAdd");if(ad)ad.addEventListener("click",function(){var nm=document.getElementById("fSwName").value.trim();if(!nm)return;fCloseSheet();createProfile(nm,true)});
}
var fProfScreen=null,fImportText="",fImportObj=null,fPlanGoal=null,fPlanMinutes=null;
function fStageInfo(){
 var next=hCurLessonN();var si=0;for(var i=0;i<STAGES12.length;i++){if(next>=STAGES12[i][2]&&next<=STAGES12[i][3])si=i}
 var st=STAGES12[si];var done=0;for(var n=st[2];n<=st[3];n++)if(S.completed["L"+n])done++;
 return{si:si,st:st,done:done,total:st[3]-st[2]+1,next:next};
}
function f14Profile(){
 if(!S||!S.profile){app.innerHTML="";return}
 if(fProfScreen==="plan")return fScrPlan();
 if(fProfScreen==="voice")return fScrVoice();
 if(fProfScreen==="learners")return fScrLearners();
 if(fProfScreen==="save")return fScrSave();
 if(fProfScreen==="import")return fScrImport();
 if(fProfScreen==="help")return fScrHelp();
 var inf=fStageInfo();var certs=fCertEarnedCount();
 var acc=fCertEarnedCount()>0?"🎓":(S.streak>=7?"🧣":"");
 var ids=Object.keys(ROOT.profiles);
 var h='<section class="f-pass" aria-label="Baasaboorka Waxbarashada / Learning Passport"><span class="f-avw" style="background:'+esc(S.profile.avatarColor||"#0e7c66")+'">'+camelSVG("idle",52)+(acc?'<span class="f-acc" aria-hidden="true">'+acc+"</span>":"")+'</span><div class="f-passmain"><div class="f-passname">'+esc(S.profile.name||"—")+'</div><p class="f-passstage">Marxaladda '+(inf.si+1)+' / Stage '+(inf.si+1)+": "+esc(inf.st[1])+" · "+esc(inf.st[0])+" · Cashirka "+inf.next+' / Lesson '+inf.next+'</p></div><button class="f-switch" id="fSwitchBtn" aria-label="Beddel qofka barta / Switch learner">'+fIcon("swap")+'Beddel</button><div class="f-stagebar" role="img" aria-label="'+inf.done+' / '+inf.total+'"><i style="width:'+Math.round(inf.done/inf.total*100)+'%"></i></div></section>';
 h+='<h2 class="f-gtitle">'+lng('Waxbarashadayda','My Learning')+'</h2><div class="f-group">'
 +fRow("fRowProgress","progress","Horumarkayga","My Progress",'<span class="f-val">'+Object.keys(S.completed).length+' / 1,000</span>')
 +fRow("fRowCerts","cert","Shahaadooyinkayga","My Certificates",certs?'<span class="f-badge">'+certs+"</span>":'<span class="f-val">0</span>',"gold")
 +fRow("fRowPlace","target","Imtixaanka meelaynta","Placement test",S.profile.placedLesson?'<span class="f-val">Cashirka '+S.profile.placedLesson+" / Lesson "+S.profile.placedLesson+"</span>":"")
 +"</div>";
 h+='<h2 class="f-gtitle">'+lng('Dookhyada','Preferences')+'</h2><div class="f-group">'
 +fRow("fRowPlan","plan","Qorshaha barashada","Study Plan",'<span class="f-val">'+(S.profile.goal||2)+' cashir · '+(S.profile.studyMinutes||10)+' daq</span>')
 +fRow("fRowVoice","voice","Codka & Muuqaalka","Voice & Display","")
 +"</div>";
 h+='<h2 class="f-gtitle">'+lng('Aaladda & Caawimaad','Device & Help')+'</h2><div class="f-group">'
 +fRow("fRowLearners","users","Maamul dadka barta & PIN","Manage Learners & PIN",'<span class="f-val">'+ids.length+" / 4</span>")
 +fRow("fRowSave","save","Kaydi ama soo celi horumarka","Save or Restore Progress","")
 +fRow("fRowHelp","help","Caawimaad & Ku saabsan","Help & About","")
 +"</div>";
 app.innerHTML=h;
 document.getElementById("fSwitchBtn").addEventListener("click",fOpenSwitchSheet);
 document.getElementById("fRowProgress").addEventListener("click",function(){lOpenProgressSheet()});
 document.getElementById("fRowCerts").addEventListener("click",fOpenCertSheet);
 document.getElementById("fRowPlace").addEventListener("click",function(){
  if(S.profile.placedLesson){fOpenSheet("Imtixaanka meelaynta","Placement test",'<p>'+lng('Meelayntaadii','Your placement: waxaad ka bilowday')+' <strong>Casharka '+S.profile.placedLesson+' / Lesson '+S.profile.placedLesson+'</strong> · '+lng('Dhibcaha','Score:')+' <strong>'+(S.profile.placement||0)+' / '+(S.profile.placedAsked||0)+'</strong>. Cashirradii ka horreeyay waa “meelayn” — waa furan yihiin, dib ayaad u ciyaari kartaa. Meelayn cusub dib kuma celin karto. / Earlier lessons are marked as placed — they stay open to replay. A new test can never move you backward.</p><button class="u-w-full btn" id="fPlAgain">'+lng('Mar kale qaado','Take the test again')+'</button>');var b=document.getElementById("fPlAgain");if(b)b.addEventListener("click",function(){fCloseSheet();plBegin("profile")})}
  else plBegin("profile");
 });
 document.getElementById("fRowPlan").addEventListener("click",function(){fProfScreen="plan";renderProfile();window.scrollTo(0,0)});
 document.getElementById("fRowVoice").addEventListener("click",function(){fProfScreen="voice";renderProfile();window.scrollTo(0,0)});
 document.getElementById("fRowLearners").addEventListener("click",function(){fProfScreen="learners";renderProfile();window.scrollTo(0,0)});
 document.getElementById("fRowSave").addEventListener("click",function(){fProfScreen="save";renderProfile();window.scrollTo(0,0)});
 document.getElementById("fRowHelp").addEventListener("click",function(){fProfScreen="help";renderProfile();window.scrollTo(0,0)});
}
function fScrPlan(){
 if(fPlanGoal===null)fPlanGoal=S.profile.goal||2;
 if(fPlanMinutes===null)fPlanMinutes=S.profile.studyMinutes||10;
 function chips(attr,items,cur){return items.map(function(it){return '<button class="chipbtn '+(String(cur)===String(it[0])?"sel":"")+'" data-'+attr+'="'+it[0]+'">'+it[1]+"</button>"}).join("")}
 var h=fSubHead("Qorshaha barashada","Study Plan")
 +'<div class="card"><label for="fName">'+lng('Magaca','Name')+'</label><input type="text" id="fName" value="'+esc(S.profile.name)+'">'
 +'<label>'+lng('Hadafka ugu weyn','Main goal')+'</label><select id="fMainGoal">'+Object.keys(GOALS).map(function(k){return '<option value="'+k+'" '+(S.profile.mainGoal===k?"selected":"")+'>'+esc(GOALS[k][1])+" / "+esc(GOALS[k][0])+"</option>"}).join("")+'</select>'
 +'<label>Hadaf maalintii (cashirro) / Daily goal (lessons)</label><div class="u-row u-wrap">'+chips("fgoal",[[1,"1 cashir"],[2,"2 cashir"],[3,"3 cashir"]],fPlanGoal)+'</div>'
 +'<label>'+lng('Waqtiga barashada maalintii','Daily study time')+'</label><div class="u-row u-wrap">'+chips("fmins",[[5,"5 daqiiqo / min"],[10,"10 daqiiqo / min"],[20,"20 daqiiqo / min"],[30,"30 daqiiqo / min"]],fPlanMinutes)+'</div>'
 +'<label>'+lng('Asalka akhriskaaga','Reading background')+'</label><select id="fLit">'+Object.keys(LITERACY).map(function(k){return '<option value="'+k+'" '+(S.profile.literacy===k?"selected":"")+'>'+esc(LITERACY[k][1])+" / "+esc(LITERACY[k][0])+"</option>"}).join("")+'</select>'
 +'<button class="u-w-full u-mt-4 btn" id="fPlanSave">'+lng('Kaydi','Save')+'</button><div id="fPlanOut"></div></div>';
 app.innerHTML=h;fWireBack();
 app.querySelectorAll("[data-fgoal]").forEach(function(b){b.addEventListener("click",function(){fPlanGoal=+b.dataset.fgoal;fScrPlan()})});
 app.querySelectorAll("[data-fmins]").forEach(function(b){b.addEventListener("click",function(){fPlanMinutes=+b.dataset.fmins;fScrPlan()})});
 document.getElementById("fPlanSave").addEventListener("click",function(){
  var nm=document.getElementById("fName").value.trim();if(nm)S.profile.name=nm;
  S.profile.goal=fPlanGoal;S.profile.studyMinutes=fPlanMinutes;S.profile.mainGoal=document.getElementById("fMainGoal").value;S.profile.literacy=document.getElementById("fLit").value;
  save().then(function(){document.getElementById("fPlanOut").innerHTML='<div class="u-mt-3 feedback good">'+uiIcon("check")+' '+lng('Waad kaydisay.','Saved.')+'</div>'});
 });
}
function fScrVoice(){
 var th=S.profile.theme||"system";
 function chips(attr,items,cur){return items.map(function(it){return '<button class="chipbtn '+(String(cur)===String(it[0])?"sel":"")+'" data-'+attr+'="'+it[0]+'">'+it[1]+"</button>"}).join("")}
 var avColors=["#0e5a8a","#0e7c86","#2e7d32","#b45309","#8a5a0e","#37598c"];
 var h=fSubHead("Codka & Muuqaalka","Voice & Display")
 +'<div class="card"><label for="fVoice">'+lng('Codka aad doorbidayso','Preferred voice')+'</label><select id="fVoice">'+voiceOptions(S.profile.voiceURI||"")+'</select>'
 +'<p class="u-mt-3 small">'+uiIcon("mute")+' '+SND_SO+'<br><span lang="en">'+SND_EN+'</span></p>'
 +'<label>'+lng('Xawaaraha codka','Voice speed')+'</label><div class="u-row u-wrap">'+chips("fspeed",[["slow","🐢 Tartii / Slow"],["normal","▶ Caadi / Normal"]],S.profile.voiceSpeed||"normal")+'</div>'
 +'<label>'+lng('Muuqaalka','Theme')+'</label><div class="u-row u-wrap">'+chips("ftheme",[["system","Nidaamka / System"],["light","Iftiin / Light"],["dark","Madow / Dark"]],th)+'</div>'
 +'<label>'+lng('Qoraal weyn','Large text')+'</label><div class="u-row u-wrap">'+chips("flarge",[["0","Caadi / Normal"],["1","Weyn / Large"]],S.profile.largeText?"1":"0")+'</div>'
 +'<label>Qaabka Ingiriisi-keliya / English-only (immersion)</label><div class="u-row u-wrap">'+chips("fimm",[["0","Soomaali waa muuqataa / Somali shown"],["1","Ingiriisi keliya / English only"]],S.profile.immersion?"1":"0")+'</div>'
 +'<label>'+lng('Codka jawaabaha','Answer sounds')+'</label><div class="u-row u-wrap">'+chips("fsnd",[["1","Shidan / On"],["0","Dansan / Off"]],ensureStageH(S).sound?"1":"0")+'</div>'
 +'<label>'+lng('Dhaqdhaqaaqa','Motion')+'</label><div class="u-row u-wrap">'+chips("fmotion",[["0","Caadi / Normal"],["1","La yareeyay / Reduced"]],ensureStageH(S).reduceMotion?"1":"0")+'</div>'
 +'<label>'+lng('Midabka astaanta','Avatar color')+'</label><div class="u-row u-wrap">'+avColors.map(function(c){return '<button class="swatch '+((S.profile.avatarColor||"#0e7c66")===c?"sel":"")+'" data-favc="'+c+'" style="background:'+c+'" aria-label="Midab / Color '+c+'"></button>'}).join("")+'</div>'
 +'<p class="u-mt-3 small muted">'+lng('Isbeddel kastaa isla markiiba wuu kaydsamaa.','Every change saves right away.')+'</p></div>';
 app.innerHTML=h;fWireBack();
 var vs=document.getElementById("fVoice");vs.addEventListener("change",function(){S.profile.voiceURI=vs.value;save()});
 function bind(attr,fn){app.querySelectorAll("[data-"+attr+"]").forEach(function(b){b.addEventListener("click",function(){fn(b.dataset[attr]);save().then(function(){fScrVoice()})})})}
 bind("fspeed",function(v){S.profile.voiceSpeed=v});
 bind("ftheme",function(v){S.profile.theme=v;applyPrefs()});
 bind("flarge",function(v){S.profile.largeText=(v==="1");applyPrefs()});
 bind("fimm",function(v){S.profile.immersion=(v==="1")});
 bind("fsnd",function(v){ensureStageH(S).sound=(v==="1");var tb=document.getElementById("hTopSnd");if(tb)tb.textContent=(v==="1")?"🔊":"🔇"});
 bind("fmotion",function(v){ensureStageH(S).reduceMotion=(v==="1");applyPrefs()});
 app.querySelectorAll("[data-favc]").forEach(function(b){b.addEventListener("click",function(){S.profile.avatarColor=b.dataset.favc;save().then(function(){fScrVoice()})})});
}
function fScrLearners(){
 var ids=Object.keys(ROOT.profiles);
 var h=fSubHead("Maamul dadka barta & PIN","Manage Learners & PIN")
 +'<div class="card"><h2 class="u-mt-0">'+lng('Dadka wax barta aaladdan','Learners on this device')+'</h2>';
 ids.forEach(function(id){var p=ROOT.profiles[id];var dn=Object.keys(p.completed||{}).length;
  h+='<div class="u-row u-j-between u-a-center u-wrap u-divided"><span><strong>'+esc(p.profile.name||"—")+'</strong>'+(hasPin(p)?" "+uiIcon("lock"):"")+'<br><span class="small muted">'+dn+'/1,000 cashir · '+p.xp+' XP · '+uiIcon("flame")+' '+(p.streak||0)+'</span></span><span class="u-row u-wrap">'+(id===ROOT.activeId?'<span class="pill">'+lng('Adiga','You')+'</span>':'<button class="btn secondary" data-fswitch2="'+id+'">'+lng('Beddel','Switch')+'</button>')+'<button class="btn amber" data-fdel="'+id+'">'+lng('Tirtir','Delete')+'</button></span></div>'});
 h+='<p class="small muted">Qof kasta horumarkiisu waa gooni: cashirro, XP, taxane (streak), dib-u-eegis, khaladaad iyo xirfado. Tirtiriddu waa halkan oo keliya — bogga hore kuma jirto. / Each learner\u2019s progress is separate. Deleting lives only here — never on the Profile home.</p>';
 if(ids.length<4)h+='<label for="fNpName">'+lng('Ku dar barte kale','Add a learner')+'</label><input type="text" id="fNpName" placeholder="Magaca / Name"><button class="u-mt-2 btn secondary" id="fNpAdd">'+lng('Ku dar','Add')+'</button>';
 else h+='<p class="small muted">'+lng('Ugu badnaan 4 qof oo barta ayaa gaadhay.','The 4-learner limit is reached.')+'</p>';
 h+='</div><div class="u-mt-4 card" id="pinCard"></div>';
 app.innerHTML=h;fWireBack();
 app.querySelectorAll("[data-fswitch2]").forEach(function(b){b.addEventListener("click",function(){switchProfile(b.dataset.fswitch2)})});
 app.querySelectorAll("[data-fdel]").forEach(function(b){b.addEventListener("click",function(){if(!b.dataset.arm){b.dataset.arm="1";b.textContent=lng("Hubi inaad tirtirto? Taabo mar kale","Confirm delete? Tap again");return}pinDeleteProfile(b.dataset.fdel)})});
 var na=document.getElementById("fNpAdd");if(na)na.addEventListener("click",function(){var nm=document.getElementById("fNpName").value.trim();if(!nm)return;createProfile(nm,true)});
 pinSet.step="idle";pinSet.buf="";pinSet.first="";pinSet.msg="";renderPinCard();
}
function fScrSave(){
 var h=fSubHead("Kaydi ama soo celi horumarka","Save or Restore Progress")
 +'<div class="card"><p>Horumarkaagu wuxuu ku kaydsan yahay <strong>telefoonkan oo keliya</strong> — akoon daruur (cloud) ma jiro. Telefoon cusub markaad hesho: halkan ka soo deji faylka, kadib telefoonka cusub ku soo celi. Faylalkii dhoofinta ee hore wali waa la soo celin karaa. / Your progress lives <strong>on this phone only</strong> — there is no cloud account. On a new phone: download the file here, then import it there. Old export files still import fine.</p>'
 +'<div class="u-row u-wrap"><button class="btn" id="fExpBtn">'+uiIcon("down")+' Soo deji horumarka / Download progress (JSON)</button><button class="btn secondary" id="fCopyBtn">'+lng('Nuqul garee','Copy')+'</button></div>'
 +'<label for="fImpText">Soo celi horumar / Import (halkan dheji JSON)</label><textarea id="fImpText" rows="4">'+esc(fImportText)+'</textarea>'
 +'<button class="u-mt-2 btn" id="fImpBtn">'+lng('Soo celi','Import')+'</button><div id="fImpOut"></div></div>';
 app.innerHTML=h;fWireBack();
 document.getElementById("fExpBtn").addEventListener("click",function(){var blob=new Blob([JSON.stringify(exportState(),null,2)],{type:"application/json"});var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="somali-english-progress.json";a.click()});
 document.getElementById("fCopyBtn").addEventListener("click",function(){if(navigator.clipboard)navigator.clipboard.writeText(JSON.stringify(exportState()))});
 document.getElementById("fImpBtn").addEventListener("click",function(){
  var txt=document.getElementById("fImpText").value;fImportText=txt;
  try{var o=JSON.parse(txt);if(!o.profile&&!o.profiles)throw new Error("bad");fImportObj=o;fProfScreen="import";renderProfile();window.scrollTo(0,0)}
  catch(e){document.getElementById("fImpOut").innerHTML='<div class="u-mt-3 feedback bad">'+lng('JSON sax ah ma aha. Faylka horumarka ee saxda ah dheji.','That is not valid JSON. Paste the correct progress file.')+'</div>'}
 });
}
function fScrImport(){
 var o=fImportObj;var names=[],tot=0;
 if(o&&o.profiles){Object.keys(o.profiles).forEach(function(k){var p=o.profiles[k];names.push(p.profile&&p.profile.name?p.profile.name:"—");tot+=Object.keys(p.completed||{}).length})}
 else if(o&&o.profile){names.push(o.profile.name||"—");tot=Object.keys(o.completed||{}).length}
 var h=fSubHead("Xaqiiji soo-celinta","Confirm restore")
 +'<div class="card"><p class="u-t-lg"><strong>Tani waxay beddeli doontaa horumarka hadda telefoonkan ku kaydsan.</strong> Horumarkii hore waa la tirtiri doonaa, kan faylka ku jira ayaana meesha geli doona. Dib looma soo celin karo marka la beddelo.</p><p class="muted" lang="en"><strong>This will replace the progress saved on this phone right now.</strong> The current progress will be erased and the progress in this file will take its place. This cannot be undone.</p>'
 +'<p>'+lng('Faylku wuxuu ka kooban yahay','This file contains:')+' <strong>'+names.length+' qof oo barta / learner(s)</strong> — '+names.map(esc).join(", ")+' · <strong>'+tot+' '+lng('cashir oo la dhammeeyay','completed lessons')+'</strong></p>'
 +'<button class="u-w-full btn" id="fImpYes">'+lng('Haa, beddel horumarkayga','Yes, replace my progress')+'</button>'
 +'<button class="u-w-full u-mt-3 btn secondary" id="fImpNo">'+lng('Maya, dib u noqo','No, go back')+'</button><div id="fImpYesOut"></div></div>';
 app.innerHTML=h;fWireBack();
 document.getElementById("fImpNo").addEventListener("click",function(){fProfScreen="save";renderProfile();window.scrollTo(0,0)});
 document.getElementById("fImpYes").addEventListener("click",function(){
  try{ROOT=migrateRoot(fImportObj);S=ROOT.profiles[ROOT.activeId];fImportObj=null;fImportText="";fProfScreen=null;applyPrefs();save().then(function(){render()})}
  catch(e){document.getElementById("fImpYesOut").innerHTML='<div class="u-mt-3 feedback bad">'+lng('Soo-celintu ma shaqayn.','The restore did not work.')+'</div>'}
 });
}
function fScrHelp(){
 var h=fSubHead("Caawimaad & Ku saabsan","Help & About")
 +'<div class="card"><h2 class="u-mt-0">'+uiIcon("mail")+' '+lng('Soo sheeg khalad ku jira cashir','Report a mistake in a lesson')+'</h2><label for="rpLesson">'+lng('Lambarka cashirka','Lesson number')+'</label><input type="text" id="rpLesson" inputmode="numeric" placeholder="Tusaale / e.g. 12"><label for="rpText">'+lng('Maxaa khaldan?','What is wrong?')+'</label><textarea id="rpText" rows="3" placeholder="Halkan ku qor / Type here"></textarea><button class="u-mt-2 btn" id="rpSave">'+lng('Kaydi warbixinta','Save report')+'</button><div id="rpOut"></div><p class="small muted">Warbixinnadu waxay ku kaydsan yihiin <strong>aaladdan oo keliya</strong> waxayna ku jiraan dhoofinta horumarkaaga — ma jiro cid si toos ah u aragta ilaa aad adigu la wadaagto dhoofinta. / Reports stay on this device only and are included in your progress export — nobody sees them until you share the export yourself. Warbixinno la kaydiyay / Saved reports: <strong>'+(S.reports||[]).length+'</strong></p></div>'
 +xpRuleHTML()+aboutHTML()
 +'<div class="u-mt-4 card"><p class="u-mt-1 u-mb-1"><strong>'+lng('La cusboonaysiiyay','Last updated')+':</strong> 2026-11-20 · <strong>'+lng('Nooca manhajka','Curriculum:')+'</strong> v2 · '+lng('1,000 cashir','lessons')+'</p></div>'
 +creditHTML();
 app.innerHTML=h;fWireBack();
 var rs=document.getElementById("rpSave");if(rs)rs.addEventListener("click",function(){var t=document.getElementById("rpText").value.trim();var ln=parseInt(document.getElementById("rpLesson").value,10);var out=document.getElementById("rpOut");if(!t){out.innerHTML='<div class="u-mt-3 feedback bad">'+lng('Fadlan qor waxa khaldan.','Please write what is wrong.')+'</div>';return}if(!Array.isArray(S.reports))S.reports=[];S.reports.push({lesson:isNaN(ln)?0:ln,text:t,date:todayStr()});save().then(function(){out.innerHTML='<div class="u-mt-3 feedback good">'+uiIcon("check")+' '+lng('Waad kaydisay. Mahadsanid!','Saved. Thank you')+'</div>';fScrHelp()})});
}
renderProfile=f14Profile;
function fAcadCardsHTML(){
 function card(tab,icon,soT,enT,sub){return '<button class="f-acadcard" data-facad="'+tab+'"><span class="f-ic">'+fIcon(icon)+'</span><span class="so">'+soT+'</span><span class="en">'+enT+" · "+sub+'</span><span class="chev" aria-hidden="true">›</span></button>'}
 return '<div id="fAcadTop"><h2 class="u-mt-1 f-gtitle">'+lng('Dugsiyo','Academies')+'</h2><div class="f-acadgrid">'
 +card("forms","forms","Foomam","Forms",lng("Foomamka nolosha","Real-life forms"))
 +card("ged","cert","GED","GED Academy",lng("Tababar aan rasmi ahayn","Unofficial practice"))
 +card("reading","book","Akhris","Reading","Tudacyo / Passages &amp; questions")
 +card("writing","pen","Qoraal","Writing",lng("Qorshee jumlo","Plan a sentence"))
 +"</div></div>";
}
function fWireAcadCards(root){root.querySelectorAll("[data-facad]").forEach(function(b){b.addEventListener("click",function(){acadTab=b.dataset.facad;setNav("acad");render()})})}
var _rN=render;
render=function(){
 if(view!=="profile")fProfScreen=null;
 _rN();
 hSafe(function(){
  document.body.classList.toggle("view-profile",view==="profile"&&!!S&&!!S.profile.onboarded&&!guestMode);
  document.body.classList.toggle("view-practice",view==="practice"&&!!S&&!!S.profile.onboarded&&!guestMode);
  var ar=document.getElementById("lAcadRow");if(ar&&ar.parentNode)ar.parentNode.remove();
  var sndT=document.getElementById("hSndToggle");if(sndT){var sc=sndT.closest(".card");if(sc)sc.remove()}
  if(view==="practice"&&S&&S.profile.onboarded&&!guestMode&&!document.getElementById("fAcadTop")){
   var d=document.createElement("div");d.innerHTML=fAcadCardsHTML();
   app.insertAdjacentElement("afterbegin",d.firstElementChild);
   fWireAcadCards(app);
  }
  if(view==="home"&&S&&S.profile.onboarded&&!guestMode&&!document.getElementById("fBranch")){
   var br=document.createElement("button");br.className="f-branch";br.id="fBranch";
   br.innerHTML='<span class="f-ic">'+fIcon("cert")+'</span><span class="f-lab"><span class="so">Dugsiyo</span><span class="en">Academies — Foomam · GED · Akhris · '+lng('Qoraal','Forms')+' · GED · Reading · Writing</span></span><span class="f-chev" aria-hidden="true">›</span>';
   br.addEventListener("click",function(){setNav("practice");render()});
   app.appendChild(br);
  }
 });
};
function f14LessonDensity(){
 if(view!=="lesson"||!cur)return;
 document.body.classList.remove("view-home","view-profile","view-practice");
 var sb=app.querySelector(".stepbar");if(sb)sb.style.display="none";
 var ms=document.getElementById("hMiniStrip");if(ms)ms.style.display="none";
 var h1=app.querySelector("h1");if(h1){h1.style.fontSize="22px";h1.style.margin=".1em 0"}
 var card=app.querySelector("#app .card");if(!card)return;
 if(step===5){
  var dlg=card.querySelector(".dialogue");
  if(dlg&&!card.querySelector(".f-story")){
   var wrap=document.createElement("div");wrap.className="f-story";
   var p=dlg.previousElementSibling;
   dlg.parentNode.insertBefore(wrap,dlg);
   if(p&&p.tagName==="P")wrap.appendChild(p);
   wrap.appendChild(dlg);
  }
 }
 if(step===8||step===9){
  card.classList.add("f-flat");
  var seg=card.querySelector(".segprog");
  if(seg){
   var q=seg.nextElementSibling;
   if(q){q.style.fontSize="19px";q.style.fontWeight="700";q.style.lineHeight="1.35"}
   var h2=card.querySelector("h2");if(h2)h2.style.display="none";
  }
  var opts=card.querySelector(".opts");
  if(opts&&opts.querySelector(".picopt"))opts.classList.add("f-picrow");
  var pp=card.querySelector(".picprompt");if(pp)pp.classList.add("f-picflat");
 }
}
var _rlN=renderLesson;
renderLesson=function(){_rlN();hSafe(f14LessonDensity)};
var obLarge=false,obLargeInit=false;
var _obFinN=obFinish;
obFinish=function(u){_obFinN(u);hSafe(function(){if(S&&S.profile){S.profile.largeText=!!obLarge;applyPrefs();save()}})};
var UI_PAIRS_N=[["Learning Passport","Baasaboorka Waxbarashada"],["My Learning","Waxbarashadayda"],["Preferences","Dookhyada"],["Device & Help","Aaladda & Caawimaad"],["My Certificates","Shahaadooyinkayga"],["Study Plan","Qorshaha Barashada"],["Voice & Display","Codka & Muuqaalka"],["Manage Learners & PIN","Maamul Dadka Barta & PIN"],["Save or Restore Progress","Kaydi ama Soo Celi Horumarka"],["Help & About","Caawimaad & Ku Saabsan"],["Switch learner","Beddel qofka barta"],["Switch","Beddel"],["Academies","Dugsiyo"],["Forms","Foomam"],["Real-life forms","Foomamka nolosha"],["Unofficial practice","Tababar aan rasmi ahayn"],["Passages & questions","Tudacyo"],["Plan a sentence","Qorshee jumlo"],["Learners on this device","Dadka wax barta aaladdan"],["Confirm restore","Xaqiiji soo-celinta"],["Yes, replace my progress","Haa, beddel horumarkayga"],["No, go back","Maya, dib u noqo"],["Your progress lives on this phone only","Horumarkaagu wuxuu ku kaydsan yahay telefoonkan oo keliya"],["This will replace the progress saved on this phone right now","Tani waxay beddeli doontaa horumarka hadda telefoonkan ku kaydsan"],["Take the test again","Mar kale qaado"],["Every change saves right away","Isbeddel kastaa isla markiiba wuu kaydsamaa"],["Deleting lives only here — never on the Profile home","Tirtiriddu waa halkan oo keliya — bogga hore kuma jirto"]];
var _auditN=bilingualAudit;
bilingualAudit=function(){var r=_auditN();var en=0,soF=0;function chk(e,s){if(e){en++;if(s&&String(s).trim())soF++}}UI_PAIRS_N.forEach(function(p){chk(p[0],p[1])});var out={};Object.keys(r).forEach(function(k){out[k]=r[k]});out.en=r.en+en;out.so=r.so+soF;out.gaps=(r.en+en)-(r.so+soF);out.stageN={en:en,so:soF,gaps:en-soF};return out};
