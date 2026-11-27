idbOpen().then(function(){return idbGet("state")}).then(function(st){
 ROOT=migrateRoot(st);S=ROOT.profiles[ROOT.activeId];
 var entry="",entryGo="";try{var entryParams=new URLSearchParams(location.search);entry=entryParams.get("entry")||"";entryGo=entryParams.get("go")||""}catch(e){}
 if(entry==="placement"&&!S.profile.onboarded)S.profile.onboarded=true;
 var pendingSave=!st||entry==="placement";
 if(entry)try{history.replaceState(null,"",location.pathname)}catch(e){}
 applyDailyBonus();if(Object.keys(ROOT.profiles).length>1&&S.profile.onboarded)pickerPending=true;pinBootCheck();applyPrefs();
 var ready=pendingSave?save():Promise.resolve();ready.then(function(){
  if(entry==="placement"){plBegin("profile");return}
  if(entry==="start"&&entryGo&&typeof window.enterGuestSection==="function"){window.enterGuestSection(entryGo);return}
  if(entry==="start"&&!S.profile.onboarded){S.profile.onboarded=true;S.profile.placementSkipped=true;save().then(function(){openLesson(1)});return}
  render()
 });
}).catch(function(){ROOT=migrateRoot(null);S=ROOT.profiles[ROOT.activeId];applyPrefs();render()});
