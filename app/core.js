var renderHome,renderDict,renderOnboarding;
function bil(x){var m=/^(.*?)\s\/\s(.*)$/.exec(String(x));return m?lng(m[1],m[2]):x}
function lng(so,en){return S&&S.profile&&S.profile.ui==="en"?en:so}
var UI_ICONS={
 home:'<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/>',
 book:'<path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1zm0 0v15"/>',
 user:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 play:'<path d="M7 4.5v15l12-7.5z"/>',
 playCircle:'<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
 speaker:'<path d="M11 4 5 9H2v6h3l6 5zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 back:'<path d="M20 12H4m6-6-6 6 6 6"/>',
 close:'<path d="M6 6l12 12M18 6 6 18"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
 tv:'<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 21h8M12 18v3"/>',
 sparkle:'<path d="M12 3v4m0 10v4M3 12h4m10 0h4M6.5 6.5 9 9m6 6 2.5 2.5m0-11L15 9m-6 6-2.5 2.5"/>',
 star:'<path d="m12 3 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.4l-5.7 3.1 1.2-6.4L2.8 9.7l6.4-.8z"/>',
 flame:'<path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s1 2 2 2c0-3 2-8 2-8z"/>',
 layers:'<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5"/>',
 map:'<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14m6-12v14"/>',
 globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
 trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4m8-4h3a3 3 0 0 1-3 4M12 13v4m-4 4h8m-4-4a4 4 0 0 1-2-1"/>',
 bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 signal:'<path d="M2 20h.01M7 20v-4m5 4v-8m5 8V8m5 12V4"/>',
 external:'<path d="M14 4h6v6m0-6-9 9M11 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
 translate:'<path d="M4 5h8M8 3v2c0 4-2 7-5 9m2-6c1 3 4 6 7 7M14 21l4-10 4 10m-6.5-3h5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
 refresh:'<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',
 down:'<path d="M12 4v16m-6-6 6 6 6-6"/>',
 wave:'<path d="M3 12h1M7 8v8M11 5v14M15 9v6M19 7v10"/>',
 mute:'<path d="M11 4 5 9H2v6h3l6 5zM16 9l5 6m0-6-5 6"/>',
 cap:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v5"/>',
 calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
 pen:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
 people:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
 puzzle:'<path d="M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H6v-4h2a2 2 0 1 0 0-4H6V6h4z"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 clipboard:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM8.5 11h7M8.5 15h5"/>',
 id:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 16.5a3.5 3.5 0 0 1 7 0M15 10h3M15 14h3"/>',
 alert:'<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>',
 repeat:'<path d="M4 11a8 8 0 0 1 14-5.3L20 8M20 3v5h-5M20 13a8 8 0 0 1-14 5.3L4 16M4 21v-5h5"/>',
 bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 slow:'<path d="M3 17h13a5 5 0 0 0 0-10h-1a5 5 0 0 0-5 5v5M16 7l2-3M19 9l2-1"/><circle cx="7" cy="17" r="2"/>',
 chat:'<path d="M4 5h16v11H9l-5 4z"/>',
 headphones:'<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
 tools:'<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2z"/>',
 chart:'<path d="M4 21V11m6 10V4m6 17V8m5 13H2"/>',
 bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
 save:'<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
 pin:'<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
 flask:'<path d="M9 3h6M10 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>',
 camera:'<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>',
 music:'<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
 starSo:'<path d="m12 2.5 2.6 6.9 7.4.3-5.8 4.6 2 7.2L12 17.4l-6.2 4.1 2-7.2L2 9.7l7.4-.3z" fill="currentColor" stroke="none"/>'
};
function uiIcon(name,cls){return '<svg class="ui-ic'+(cls?" "+cls:"")+'" viewBox="0 0 24 24" aria-hidden="true">'+(UI_ICONS[name]||"")+'</svg>'}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function norm(s){return String(s||"").toLowerCase().trim().replace(/[.,!?;:'"]/g,"").replace(/\s+/g," ")}
function shuffle(a,seed){var arr=a.slice();var s=seed||7;for(var i=arr.length-1;i>0;i--){s=(s*9301+49297)%233280;var j=Math.floor((s/233280)*(i+1));var t=arr[i];arr[i]=arr[j];arr[j]=t}return arr}
var _spkSeq=0,_spkBtn=null,_spkToastAt=0,_voicesCache=[];
function refreshVoices(){try{if("speechSynthesis" in window){var v=speechSynthesis.getVoices();if(v&&v.length)_voicesCache=v}}catch(e){}return _voicesCache}
function voiceScore(v){
 var n=(" "+String(v.name||"").toLowerCase()+" "),lang=String(v.lang||"").replace("_","-").toLowerCase(),s=0;
 if(/^en-us/.test(lang))s+=55;else if(/^en-gb/.test(lang))s+=50;else if(/^en/.test(lang))s+=15;else return -999;
 if(n.indexOf(" google us english ")>=0||n.trim()==="google us english")s+=130;
 else if(n.indexOf("google uk english female")>=0)s+=125;
 else if(n.indexOf("google")>=0&&n.indexOf("english")>=0)s+=105;
 if(n.indexOf("microsoft")>=0&&(n.indexOf("natural")>=0||n.indexOf("online")>=0||n.indexOf("neural")>=0))s+=120;
 else if(n.indexOf("natural")>=0||n.indexOf("neural")>=0)s+=90;
 if(n.indexOf("samantha")>=0)s+=95;
 if(n.indexOf("karen")>=0||n.indexOf("moira")>=0||n.indexOf("daniel")>=0||n.indexOf("serena")>=0||n.indexOf("kate")>=0||n.indexOf("fiona")>=0||n.indexOf("tessa")>=0||n.indexOf("alex")>=0)s+=70;
 if(n.indexOf("premium")>=0||n.indexOf("enhanced")>=0)s+=65;
 if(n.indexOf("zira")>=0||n.indexOf("aria")>=0||n.indexOf("jenny")>=0||n.indexOf("guy")>=0||n.indexOf("david")>=0||n.indexOf("hazel")>=0||n.indexOf("susan")>=0)s+=45;
 if(v.default)s+=8;
 if(n.indexOf("compact")>=0)s-=110;
 if(n.indexOf("eloquence")>=0||n.indexOf("espeak")>=0||n.indexOf("pico")>=0)s-=90;
 if(/ (fred|albert|zarvox|whisper|bells|cellos|bubbles|bad news|good news|boing|trinoids|hysterical|deranged|bahh|organ|superstar|junior|ralph|kathy|princess|bruce|agnès|agnes) /.test(n))s-=160;
 return s;
}
function sortedVoices(){var vs=refreshVoices().filter(function(v){return /^en/i.test(v.lang||"")});return vs.slice().sort(function(a,b){return voiceScore(b)-voiceScore(a)})}
function isIOSDevice(){try{var ua=String(navigator.userAgent||"");if(/iP(hone|ad|od)/i.test(ua))return true;if(String(navigator.platform||"")==="MacIntel"&&(navigator.maxTouchPoints||0)>1)return true}catch(e){}return false}
function voiceLang(v){return String((v&&v.lang)||"").replace("_","-").toLowerCase()}
function hasVoiceForLang(prefix){prefix=String(prefix||"").toLowerCase();var vs=refreshVoices();for(var i=0;i<vs.length;i++){var l=voiceLang(vs[i]);if(l===prefix||l.indexOf(prefix+"-")===0)return true}return false}
function pickVoice(prof){
 var vs=refreshVoices();if(!vs.length)return null;
 if(isIOSDevice())return null;
 var en=vs.filter(function(v){return /^en/i.test(v.lang||"")});if(!en.length)return null;
 if(prof&&prof.voiceURI){for(var i=0;i<en.length;i++){if(en[i].voiceURI===prof.voiceURI&&(en[i].default||en[i].localService))return en[i]}}
 for(var d=0;d<en.length;d++){if(en[d].default)return en[d]}
 var local=en.filter(function(v){return !!v.localService});
 if(local.length){local.sort(function(a,b){return voiceScore(b)-voiceScore(a)});return local[0]}
 return null;
}
function safeUtterLang(chosen){
 if(chosen&&chosen.lang)return chosen.lang;
 var vs=refreshVoices();
 for(var i=0;i<vs.length;i++){if(voiceLang(vs[i])==="en-us")return vs[i].lang}
 for(var j=0;j<vs.length;j++){if(/^en/i.test(vs[j].lang||""))return vs[j].lang}
 if(vs.length&&vs[0].lang)return vs[0].lang;
 return "en-US";
}
function speakToast(){var now=Date.now();if(now-_spkToastAt<8000)return;_spkToastAt=now;var t=document.getElementById("spkToast");if(!t){t=document.createElement("div");t.id="spkToast";t.setAttribute("role","status");document.body.appendChild(t)}t.textContent="🔊 Codku ma bilaaban. Hubi in codka telefoonku furan yahay, aamusku (silent) dansan yahay, kadib mar kale taabo. / The voice did not start. Check the phone volume, turn silent mode off, then tap again.";t.classList.add("show");clearTimeout(window.__spkT);window.__spkT=setTimeout(function(){t.classList.remove("show")},6000)}
var _audioReg={loaded:false,failed:false,loading:null,bundles:[],map:{},normMap:{},clips:0};
var _audioCtx=null,_audioBuffers={},_audioBufferPromises={},_audioCurrent=null;
var _mediaEl=null,_mediaState=null,_mediaSrc=null;
window.__audioRegistry={loaded:false,clips:0,lastPlayed:null,lastFallback:null,lastRoute:null,lastError:null,mediaElementId:"seaAudioEl"};
function audioNormKey(s){return String(s==null?"":s).toLowerCase().replace(/\s+/g," ").trim()}
function audioDiag(){try{window.__audioRegistry.loaded=!!_audioReg.loaded;window.__audioRegistry.clips=_audioReg.clips||0}catch(e){}}
function loadAudioRegistry(){
 if(_audioReg.loaded)return Promise.resolve(true);
 if(_audioReg.loading)return _audioReg.loading;
 if(typeof fetch!=="function"){_audioReg.failed=true;audioDiag();return Promise.resolve(false)}
 try{
 _audioReg.loading=fetch("audio/index.json").then(function(r){if(!r.ok)throw new Error("audio index status "+r.status);return r.json()}).then(function(data){
  if(!data||!data.clips||typeof data.clips!=="object")throw new Error("audio index shape");
  _audioReg.bundles=(data.bundles&&data.bundles.length)?Array.prototype.slice.call(data.bundles):[];
  _audioReg.map={};_audioReg.normMap={};var n=0;
  Object.keys(data.clips).forEach(function(k){var v=data.clips[k];if(v&&typeof v.length==="number"&&v.length>=3){_audioReg.map[k]=v;var nk=audioNormKey(k);if(!Object.prototype.hasOwnProperty.call(_audioReg.normMap,nk))_audioReg.normMap[nk]=v;n++}});
  _audioReg.clips=n;_audioReg.loaded=true;_audioReg.failed=false;audioDiag();return true;
 }).catch(function(){_audioReg.loaded=false;_audioReg.failed=true;_audioReg.loading=null;audioDiag();return false});
 }catch(e){_audioReg.failed=true;audioDiag();return Promise.resolve(false)}
 return _audioReg.loading;
}
function lookupAudioClip(text){
 if(!_audioReg.loaded)return null;
 if(Object.prototype.hasOwnProperty.call(_audioReg.map,text))return _audioReg.map[text];
 var nk=audioNormKey(text);
 if(Object.prototype.hasOwnProperty.call(_audioReg.normMap,nk))return _audioReg.normMap[nk];
 return null;
}
function getAudioCtx(){
 try{
  if(!_audioCtx){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;_audioCtx=new AC()}
  if(_audioCtx.state==="suspended"){_audioCtx.resume()}
  return _audioCtx;
 }catch(e){return null}
}
function stopRecorded(){
 stopMedia();
 if(_audioCurrent){var cur=_audioCurrent;_audioCurrent=null;try{cur.source.onended=null}catch(e){}try{cur.source.stop()}catch(e){}}
}
function getMediaEl(){
 if(_mediaEl)return _mediaEl;
 try{
  var el=document.getElementById("seaAudioEl");
  if(!el){el=document.createElement("audio");el.id="seaAudioEl";el.preload="auto";el.setAttribute("playsinline","");el.style.display="none";document.body.appendChild(el)}
  _mediaEl=el;return el;
 }catch(e){return null}
}
function stopMedia(){
 if(_mediaState){var st=_mediaState;_mediaState=null;try{if(st.cleanup)st.cleanup()}catch(e){}}
 if(_mediaEl){try{_mediaEl.pause()}catch(e){}}
}
function playMediaClip(text,clip,slow,btn,seq){
 var bundleIdx=clip[0],startSec=Number(clip[1])||0,durSec=Number(clip[2])||0;
 var url=_audioReg.bundles[bundleIdx];
 var el=getMediaEl();
 if(!el||!url){try{window.__audioRegistry.lastError="media route unavailable (no element or bundle url)"}catch(e){}playWebAudioClip(text,clip,slow,btn,seq);return}
 var endSec=startSec+durSec,rate=slow?0.72:1;
 var started=false,finished=false,watchdog=null,safety=null;
 function clearBtn(){if(seq===_spkSeq&&_spkBtn){_spkBtn.classList.remove("speaking");_spkBtn=null}}
 function cleanup(){
  try{el.removeEventListener("timeupdate",onTime)}catch(e){}
  try{el.removeEventListener("playing",onPlaying)}catch(e){}
  try{el.removeEventListener("ended",onEnded)}catch(e){}
  try{el.removeEventListener("error",onError)}catch(e){}
  try{el.removeEventListener("loadedmetadata",onMeta)}catch(e){}
  if(watchdog){clearTimeout(watchdog);watchdog=null}
  if(safety){clearTimeout(safety);safety=null}
  if(_mediaState&&_mediaState.seq===seq)_mediaState=null;
 }
 function finishOk(){
  if(finished||seq!==_spkSeq)return;finished=true;
  try{el.pause()}catch(e){}
  cleanup();clearBtn();
 }
 function failover(msg){
  if(finished||seq!==_spkSeq)return;finished=true;
  try{window.__audioRegistry.lastError=String(msg||"media playback failed")}catch(e){}
  try{window.__audioRegistry.lastFallback=text}catch(e){}
  cleanup();
  try{el.pause()}catch(e){}
  playWebAudioClip(text,clip,slow,btn,seq);
 }
 function armSafety(){
  if(safety)clearTimeout(safety);
  var remain=durSec/rate;
  try{remain=Math.max(0.15,(endSec-el.currentTime)/rate)}catch(e){}
  safety=setTimeout(finishOk,remain*1000+400);
 }
 function onPlaying(){
  if(finished||seq!==_spkSeq)return;
  started=true;if(watchdog){clearTimeout(watchdog);watchdog=null}
  try{window.__audioRegistry.lastRoute="media";window.__audioRegistry.lastPlayed={text:text,bundle:bundleIdx,start:startSec,dur:durSec,route:"media"}}catch(e){}
  armSafety();
 }
 function onTime(){
  if(finished||seq!==_spkSeq)return;
  try{if(el.currentTime>=endSec-0.03)finishOk()}catch(e){}
 }
 function onEnded(){finishOk()}
 function onError(){
  var msg="media element error";
  try{if(el.error)msg+=" code "+el.error.code}catch(e){}
  failover(msg);
 }
 function onMeta(){
  if(finished||seq!==_spkSeq)return;
  try{if(Math.abs(el.currentTime-startSec)>0.4)el.currentTime=startSec}catch(e){}
 }
 _mediaState={seq:seq,cleanup:cleanup};
 el.addEventListener("timeupdate",onTime);
 el.addEventListener("playing",onPlaying);
 el.addEventListener("ended",onEnded);
 el.addEventListener("error",onError);
 el.addEventListener("loadedmetadata",onMeta);
 watchdog=setTimeout(function(){if(!started)failover("media did not start within 1200ms")},1200);
 try{
  if(_mediaSrc!==url){_mediaSrc=url;el.src=url}
  try{el.playbackRate=rate}catch(e){}
  try{el.currentTime=startSec}catch(e){}
  var p=el.play();
  if(p&&typeof p.catch==="function")p.catch(function(err){failover("media play() rejected: "+(err&&(err.name||err.message)||err))});
 }catch(e){failover("media play() threw: "+(e&&e.message||e))}
}
function loadAudioBuffer(ctx,idx){
 if(_audioBuffers[idx])return Promise.resolve(_audioBuffers[idx]);
 if(_audioBufferPromises[idx])return _audioBufferPromises[idx];
 var url=_audioReg.bundles[idx];
 if(!url)return Promise.reject(new Error("no bundle for index "+idx));
 _audioBufferPromises[idx]=fetch(url).then(function(r){if(!r.ok)throw new Error("bundle status "+r.status);return r.arrayBuffer()}).then(function(ab){return ctx.decodeAudioData(ab)}).then(function(buf){_audioBuffers[idx]=buf;return buf}).catch(function(err){delete _audioBufferPromises[idx];throw err});
 return _audioBufferPromises[idx];
}
function playWebAudioClip(text,clip,slow,btn,seq){
 var bundleIdx=clip[0],startSec=Number(clip[1])||0,durSec=Number(clip[2])||0;
 var started=false,finished=false;
 function clearBtn(){if(seq===_spkSeq&&_spkBtn){_spkBtn.classList.remove("speaking");_spkBtn=null}}
 function fallback(){
  if(finished||seq!==_spkSeq)return;finished=true;clearTimeout(watchdog);
  try{window.__audioRegistry.lastFallback=text}catch(e){}
  clearBtn();
  speakDevice(text,slow,btn);
 }
 var watchdog=setTimeout(function(){if(!started)fallback()},1200);
 var ctx=getAudioCtx();
 if(!ctx){try{window.__audioRegistry.lastError="webaudio route unavailable (no AudioContext)"}catch(e){}fallback();return}
 loadAudioBuffer(ctx,bundleIdx).then(function(buf){
  if(finished||seq!==_spkSeq)return;
  try{
   var src=ctx.createBufferSource();src.buffer=buf;
   if(slow)src.playbackRate.value=0.72;
   src.connect(ctx.destination);
   _audioCurrent={source:src,btn:btn,seq:seq};
   src.onended=function(){if(_audioCurrent&&_audioCurrent.source===src)_audioCurrent=null;if(seq===_spkSeq){finished=true;clearBtn()}};
   src.start(0,startSec,durSec+0.05);
   started=true;clearTimeout(watchdog);
   try{window.__audioRegistry.lastRoute="webaudio";window.__audioRegistry.lastPlayed={text:text,bundle:bundleIdx,start:startSec,dur:durSec,route:"webaudio"}}catch(e){}
  }catch(e){try{window.__audioRegistry.lastError="webaudio start failed: "+(e&&e.message||e)}catch(_e){}fallback()}
 }).catch(function(err){try{window.__audioRegistry.lastError="webaudio buffer failed: "+(err&&err.message||err)}catch(e){}fallback()});
}
function playRecorded(text,clip,slow,btn){
 var seq=++_spkSeq;
 stopRecorded();
 try{if("speechSynthesis" in window)window.speechSynthesis.cancel()}catch(e){}
 if(_spkBtn&&_spkBtn!==btn)_spkBtn.classList.remove("speaking");
 _spkBtn=btn||null;if(_spkBtn)_spkBtn.classList.add("speaking");
 playMediaClip(text,clip,slow,btn,seq);
}
function speak(text,slow,btn){
 text=String(text==null?"":text).trim();if(!text)return;
 var clip=null;try{clip=lookupAudioClip(text)}catch(e){clip=null}
 if(clip){playRecorded(text,clip,slow,btn);return}
 if(!_audioReg.loaded&&!_audioReg.failed){try{loadAudioRegistry()}catch(e){}}
 stopRecorded();
 speakDevice(text,slow,btn);
}
try{loadAudioRegistry()}catch(e){}
function speakDevice(text,slow,btn){
 text=String(text==null?"":text).trim();if(!text)return;
 try{window.__audioRegistry.lastRoute="tts"}catch(e){}
 if(!("speechSynthesis" in window)||typeof SpeechSynthesisUtterance==="undefined"){try{window.__audioRegistry.lastError="device voice unavailable (no speechSynthesis)"}catch(e){}speakToast();return}
 var ss=window.speechSynthesis,seq=++_spkSeq;
 var prof=(typeof S!=="undefined"&&S&&S.profile)?S.profile:{};
 if(_spkBtn&&_spkBtn!==btn)_spkBtn.classList.remove("speaking");
 _spkBtn=btn||null;if(_spkBtn)_spkBtn.classList.add("speaking");
 var started=false,attempts=0,keepAlive=null;
 function clearBtn(){if(seq===_spkSeq){if(keepAlive){clearInterval(keepAlive);keepAlive=null}if(_spkBtn){_spkBtn.classList.remove("speaking");_spkBtn=null}}}
 function fail(){if(seq!==_spkSeq)return;clearBtn();speakToast()}
 function build(){
  var u=new SpeechSynthesisUtterance(text);u.pitch=1.02;
  u.rate=slow?0.68:(prof.voiceSpeed==="slow"?0.76:0.9);
  var chosen=null;try{chosen=pickVoice(prof)}catch(e){}
  if(chosen){try{u.voice=chosen}catch(e){}}
  u.lang=safeUtterLang(chosen);
  try{window.__lastSpeak={text:text,lang:u.lang,voiceName:chosen?String(chosen.name||""):null,voiceURI:chosen?String(chosen.voiceURI||""):null,voiceLocal:chosen?!!chosen.localService:null,voiceDefault:chosen?!!chosen.default:null,isIOS:isIOSDevice(),hasEnVoice:hasVoiceForLang("en"),hasSoVoice:hasVoiceForLang("so")}}catch(e){}
  return u;
 }
 function go(){
  if(seq!==_spkSeq)return;attempts++;
  var u;try{u=build()}catch(e){fail();return}
  u.onstart=function(){if(seq===_spkSeq){started=true;
   if(keepAlive)clearInterval(keepAlive);keepAlive=setInterval(function(){if(seq!==_spkSeq){clearInterval(keepAlive);keepAlive=null;return}try{if(ss.paused)ss.resume()}catch(e){}},4000)}};
  u.onend=function(){if(seq===_spkSeq)clearBtn()};
  u.onerror=function(ev){if(seq!==_spkSeq)return;if(ev&&ev.error==="interrupted")return;if(attempts<3)setTimeout(go,180);else fail()};
  try{ss.resume()}catch(e){}
  try{ss.speak(u)}catch(e){if(attempts<3)setTimeout(go,180);else fail();return}
  var myAttempt=attempts;
  setTimeout(function(){
   if(seq!==_spkSeq||started||attempts!==myAttempt)return;
   var active=false;try{active=!!(ss.speaking||ss.pending)}catch(e){}
   if(active){started=true;return}
   if(attempts<3)go();else fail();
  },1600);
 }
 refreshVoices();
 try{if(ss.speaking||ss.pending)ss.cancel()}catch(e){}
 go();
}
if("speechSynthesis" in window){try{refreshVoices();if(typeof speechSynthesis.addEventListener==="function")speechSynthesis.addEventListener("voiceschanged",function(){refreshVoices()});if(typeof speechSynthesis.onvoiceschanged!=="undefined")speechSynthesis.onvoiceschanged=function(){refreshVoices()}}catch(e){}
try{document.addEventListener("pointerdown",function(){refreshVoices()},{once:true});document.addEventListener("touchend",function(){refreshVoices()},{once:true})}catch(e){}}
