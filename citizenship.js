/* ============================================================================
   Jinsiyadda / Citizenship Academy
   Civics questions and answers are loaded from data/civics-2025.json and
   data/civics-2008.json (official USCIS text — never re-typed here).
   Reading and writing sentences use only words from the official USCIS
   vocabulary lists (rev. 08/08). N-400 questions quote Form N-400, edition
   01/20/25, Part 9. Everything here is study help, not legal advice.
   State lives in S.citizenship (optional key; older saves import unchanged).
   ============================================================================ */
(function () {
  'use strict';
  if (typeof UI_ICONS === 'object') {
    UI_ICONS.flag = '<path d="M5 21V4m0 1h12l-2.5 4 2.5 4H5"/>';
    UI_ICONS.pen = '<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>';
    UI_ICONS.shield = '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z"/>';
    UI_ICONS.calendar = '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4m8-4v4"/>';
    UI_ICONS.award = '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>';
    UI_ICONS.chat = '<path d="M4 5h16v11H9l-5 4z"/>';
    UI_ICONS.cards = '<rect x="3" y="7" width="14" height="12" rx="2"/><path d="M7 7V5h14v12h-4"/>';
  }
  var DATA = {}, pending = {};
  var C = { route: 'hub', topic: null, filter: 'todo', idx: 0, show: false, run: null, iv: null, rw: null };
  var UPDATES = 'https://www.uscis.gov/citizenship/testupdates';
  function T(so, en) { return S && S.profile && S.profile.ui === 'en' ? en : so; }
  function ic(n) { return uiIcon(n); }
  function shuffled(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function cz() {
    var c = S.citizenship; if (!c || typeof c !== 'object') c = S.citizenship = { v: 1 };
    c.edition = c.edition === '2008' ? '2008' : '2025'; c.civ = c.civ || {};
    ['2025', '2008'].forEach(function (e) { var x = c.civ[e] = c.civ[e] || {}; x.known = x.known || {}; x.seen = x.seen || {}; x.mocks = x.mocks || []; });
    c.read = c.read || { ok: {}, tests: [] }; c.write = c.write || { ok: {}, tests: [] };
    c.n400 = c.n400 || { seen: {} }; c.interviews = c.interviews || [];
    return c;
  }
  function load(ed) {
    if (DATA[ed]) return Promise.resolve(DATA[ed]);
    if (!pending[ed]) pending[ed] = fetch('data/civics-' + ed + '.json').then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); }).then(function (d) { DATA[ed] = d; return d; }).catch(function (e) { pending[ed] = null; throw e; });
    return pending[ed];
  }
  function pool(ed) { var c = cz(), q = DATA[ed].questions; return c.senior ? q.filter(function (x) { return x.star65; }) : q; }
  function rules(ed) { var r = DATA[ed].rules; return cz().senior ? r.senior : r; }
  function knownCount(ed) { var k = cz().civ[ed].known; return DATA[ed] ? pool(ed).filter(function (q) { return k[q.n]; }).length : Object.keys(k).length; }
  var SEC = { 'Principles of American Government': 'Mabaadi’da dowladda Maraykanka', 'Principles of American Democracy': 'Mabaadi’da dimuqraadiyadda Maraykanka', 'System of Government': 'Nidaamka dowladda', 'Rights and Responsibilities': 'Xuquuqda iyo waajibaadka', 'Colonial Period and Independence': 'Xilligii gumeysiga iyo xornimada', '1800s': 'Qarnigii 1800-aadkii', 'Recent American History and Other Important Historical Information': 'Taariikhda dhow ee Maraykanka', 'Geography': 'Juqraafi', 'Symbols': 'Astaamaha qaranka', 'Holidays': 'Ciidaha qaranka' };
  function secName(s) { return T(SEC[s] || s, s); }

  /* ---------- official vocabulary lists (USCIS, rev. 08/08) + Somali glosses ---------- */
  var GL = {
    'abraham lincoln': 'Abraham Lincoln — madaxweynihii 16aad', 'george washington': 'George Washington — madaxweynihii ugu horreeyay', 'american flag': 'calanka Maraykanka', 'bill of rights': 'tobanka amendment ee ugu horreeya — xuquuqda aasaasiga ah',
    'capital': 'caasimad', 'citizen': 'muwaadin', 'citizens': 'muwaadiniin', 'city': 'magaalo', 'congress': 'Congress — golaha sharci-dejinta', 'country': 'dal', 'father of our country': 'aabbaha dalkeenna (George Washington)', 'government': 'dowlad', 'president': 'madaxweyne', 'right': 'xaq',
    'senators': 'senator-ro — xubnaha Senate-ka', 'state': 'gobol', 'states': 'gobollo', 'white house': 'Aqalka Cad — guriga madaxweynaha', 'america': 'Ameerika', 'united states': 'Maraykanka', 'u.s.': 'Maraykanka (soo gaabin)',
    'presidents’ day': 'Maalinta Madaxweynayaasha (Febraayo)', 'memorial day': 'maalinta lagu xuso askartii dhimatay (Maajo)', 'flag day': 'Maalinta Calanka (Juun)', 'independence day': 'Maalinta Xornimada (July 4)', 'labor day': 'Maalinta Shaqaalaha (Sebtembar)', 'columbus day': 'Maalinta Columbus (Oktoobar)', 'thanksgiving': 'Ciidda Mahadnaqa (Nofembar)',
    'how': 'sidee', 'what': 'maxay / waa maxay', 'when': 'goorma', 'where': 'xaggee', 'who': 'yaa / kuma', 'why': 'maxay … u / sababta',
    'can': 'kari karaa', 'come': 'yimaadaan / kaalay', 'do': '(eray su’aal lagu sameeyo)', 'does': '(eray su’aal lagu sameeyo)', 'elects': 'doortaa', 'elect': 'dooro', 'have': 'leenahay / leeyihiin', 'has': 'leeyahay', 'is': 'waa', 'are': 'waa (wadar)', 'was': 'wuxuu ahaa', 'be': 'ahaado / noqdo',
    'lives': 'ku nool yahay', 'lived': 'ku noolaa', 'meet': 'kulmaa', 'meets': 'kulmaa', 'name': 'magac / magacow', 'pay': 'bixi', 'vote': 'codee', 'want': 'rabaa / rabaan',
    'a': 'hal', 'for': 'u / loogu talagalay', 'here': 'halkan', 'in': 'gudaha / ku', 'of': 'ee', 'on': 'dusha / ku', 'the': '(qodob: -ka / -ta)', 'to': 'u / ilaa', 'we': 'annaga', 'and': 'iyo', 'during': 'intii lagu jiray',
    'colors': 'midabyo', 'dollar bill': 'warqadda doollarka', 'first': 'koowaad / ugu horreeyay', 'largest': 'ugu weyn', 'many': 'badan', 'most': 'ugu badan', 'north': 'waqooyi', 'one': 'hal', 'people': 'dad', 'second': 'labaad', 'south': 'koonfur',
    'adams': 'John Adams — madaxweynihii labaad', 'lincoln': 'Abraham Lincoln — madaxweynihii 16aad', 'washington': 'George Washington; sidoo kale magac gobol', 'american indians': 'dadka asaliga ah ee Maraykanka', 'civil war': 'dagaalkii sokeeye', 'flag': 'calan', 'free': 'xor', 'freedom of speech': 'xorriyadda hadalka',
    'alaska': 'Alaska (gobol)', 'california': 'California (gobol)', 'canada': 'Kanada (dal)', 'delaware': 'Delaware (gobol)', 'mexico': 'Meksiko (dal)', 'new york city': 'magaalada New York', 'washington, d.c.': 'Washington, D.C. — caasimadda Maraykanka',
    'february': 'Febraayo', 'may': 'Maajo', 'june': 'Juun', 'july': 'Luulyo', 'september': 'Sebtembar', 'october': 'Oktoobar', 'november': 'Nofembar',
    'blue': 'buluug', 'fifty': 'konton (50)', 'red': 'casaan', 'white': 'caddaan', 'taxes': 'canshuur', 'one hundred': 'boqol (100)'
  };
  var GLK = Object.keys(GL).sort(function (a, b) { return b.length - a.length; });
  var READ = ['Who was the first President?', 'Who lives in the White House?', 'What is the capital of the United States?', 'When is Independence Day?', 'Who elects Congress?', 'What are the colors of the American flag?', 'Who was Abraham Lincoln?', 'Where does Congress meet?', 'Who can vote?', 'When is Flag Day?', 'What is the largest state?', 'Who is the Father of Our Country?', 'Why do people come to America?', 'What do we pay to the government?', 'How many states do we have?', 'When is Thanksgiving?', 'Who was the second President?', 'What country is north of the United States?', 'Who is on the dollar bill?', 'What is one right in the Bill of Rights?', 'When is Memorial Day?', 'When is Labor Day?', 'When is Columbus Day?', 'When is Presidents’ Day?', 'What state has the most people?', 'How many Senators does a state have?', 'Where is the White House?', 'Who was George Washington?'];
  var WRITE = ['Washington was the first President.', 'Lincoln was President during the Civil War.', 'The President lives in the White House.', 'Washington, D.C. is the capital of the United States.', 'Citizens can vote.', 'We pay taxes.', 'The flag is red, white, and blue.', 'Independence Day is in July.', 'Thanksgiving is in November.', 'Alaska is the largest state.', 'The United States has fifty states.', 'Congress meets in Washington, D.C.', 'Adams was the second President.', 'Canada is north of the United States.', 'Mexico is south of the United States.', 'Washington is the Father of Our Country.', 'People want to be free.', 'We have one hundred Senators.', 'We elect the President in November.', 'Memorial Day is in May.', 'Flag Day is in June.', 'Labor Day is in September.', 'Columbus Day is in October.', 'Presidents’ Day is in February.', 'Washington is on the dollar bill.', 'California has the most people.', 'American Indians lived here first.', 'People have freedom of speech.', 'Delaware was the first state.', 'New York City was the first capital.'];
  /* split a sentence into official-vocabulary chips (longest phrase first) */
  function chips(sentence) {
    var out = [], rest = sentence;
    while (rest.length) {
      var m = /^[\s,.?!]+/.exec(rest); if (m) { out.push({ t: m[0] }); rest = rest.slice(m[0].length); continue; }
      var low = rest.toLowerCase(), hit = null;
      for (var i = 0; i < GLK.length; i++) { var k = GLK[i]; if (low.indexOf(k) === 0 && !/[a-z]/i.test(rest.charAt(k.length) || ' ')) { hit = k; break; } }
      if (!hit) { var w = /^[^\s,.?!]+/.exec(rest)[0]; out.push({ t: w, k: w.toLowerCase() }); rest = rest.slice(w.length); }
      else { out.push({ t: rest.slice(0, hit.length), k: hit }); rest = rest.slice(hit.length); }
    }
    return out;
  }
  function plain(s) { return String(s || '').toLowerCase().replace(/’/g, "'").replace(/\b50\b/g, 'fifty').replace(/\b100\b/g, 'one hundred').replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ').trim(); }

  /* ---------- N-400 Part 9 (edition 01/20/25): interview practice ---------- */
  var E = 'Have you EVER ';
  var N4 = [
    { g: ['Jinsiyad, codayn iyo canshuur', 'Citizenship claims, voting and taxes'], items: [
      { q: E + 'claimed to be a U.S. citizen (in writing or any other way)?', so: 'Weligaa ma sheegatay inaad muwaadin Maraykan ah tahay — qoraal ama si kale?', w: [['claimed', 'sheegatay'], ['U.S. citizen', 'muwaadin Maraykan ah']], why: 'In qof aan muwaadin ahayn muwaadinimo sheegto waa arrin culus oo sharciga socdaalka khuseysa.' },
      { q: E + 'registered to vote or voted in any Federal, state, or local election in the United States?', so: 'Weligaa ma isu diiwaangelisay codayn, mase ka codaysay doorasho Maraykanka ka dhacday?', w: [['registered to vote', 'codayn isu diiwaangeliyay'], ['election', 'doorasho']], why: 'Doorashooyinka waxaa ka codeeya muwaadiniinta; USCIS waxay hubinaysaa in sharcigaas la dhawray.' },
      { q: 'Do you currently owe any overdue Federal, state, or local taxes in the United States?', so: 'Hadda ma lagugu leeyahay canshuur waqtigeedii dhaaftay?', w: [['owe', 'lagugu leeyahay'], ['overdue', 'waqtigeedii dhaaftay'], ['taxes', 'canshuur']], why: 'Canshuur bixintu waa qayb ka mid ah “good moral character” — dabeecadda wanaagsan ee jinsiyadda looga baahan yahay.' },
      { q: 'Since you became a lawful permanent resident, have you called yourself a “nonresident alien” on a Federal, state, or local tax return or decided not to file a tax return because you considered yourself to be a nonresident?', so: 'Tan iyo markii aad green card heshay, foomka canshuurta ma isku sheegtay “nonresident” (qof aan dalka degganayn), mase ka tagtay inaad canshuur xereyso adigoo isu arka qof aan degganayn?', w: [['lawful permanent resident', 'qof green card haysta'], ['tax return', 'foomka canshuurta ee sannadlaha ah'], ['nonresident alien', 'ajnabi aan dalka degganayn']], why: 'Waxay muujinaysaa inaad Maraykanka u aragto gurigaaga joogtada ah.' }
    ] },
    { g: ['Ururro iyo rabshad', 'Groups and violence'], items: [
      { q: E + 'been a member of, involved in, or in any way associated with any Communist or totalitarian party anywhere in the world?', so: 'Weligaa ma xubin ka noqotay, ama xiriir la yeelatay, xisbi shuuci ah ama kali-talis ah, meel kasta oo adduunka ah?', w: [['member', 'xubin'], ['associated with', 'xiriir la leh'], ['totalitarian', 'kali-talis — dowlad wax walba xukunta']], why: 'Sharciga jinsiyaddu wuxuu weydiiyaa xiriirka ururrada noocan ah.' },
      { q: E + 'used a weapon or explosive with intent to harm another person or cause damage to property?', so: 'Weligaa ma isticmaashay hub ama walxo qarxa adigoo ula jeeda inaad qof dhaawacdo ama hanti waxyeelayso?', w: [['weapon', 'hub'], ['explosive', 'walxaha qarxa'], ['intent', 'ula jeeddo'], ['property', 'hanti']], why: 'Su’aalaha amniga codsade kasta ayaa la weydiiyaa, cid gaar ah looma eego.' },
      { q: E + 'engaged (participated) in kidnapping, assassination, or hijacking or sabotage of an airplane, ship, vehicle, or other mode of transportation?', so: 'Weligaa ma ka qayb qaadatay afduub, dil qorsheysan, ama qabsasho ama burburin diyaarad, markab ama gaadiid kale?', w: [['kidnapping', 'afduub'], ['assassination', 'dil qorsheysan'], ['hijacking', 'gaadiid xoog lagu qabsado'], ['sabotage', 'burburin ula kac ah']], why: 'Su’aalaha amniga codsade kasta ayaa la weydiiyaa.' },
      { q: E + 'ordered, incited, called for, committed, assisted, helped with, or otherwise participated in any of the following: Torture? Genocide? Killing or trying to kill any person?', so: 'Weligaa ma amartay, ma dhiirrigelisay, mase ka qayb qaadatay jirdil, xasuuq, ama dilka ama isku dayga dilka qof?', w: [['torture', 'jirdil'], ['genocide', 'xasuuq'], ['incited', 'kiciyay / dhiirrigeliyay']], why: 'Maraykanku jinsiyad ma siiyo qof dad kale dhibaateeyay.' },
      { q: E + 'ordered, incited, called for, committed, assisted, helped with, or otherwise participated in any of the following: Causing harm or suffering to any person because of his or her race, religion, national origin, membership in a particular social group, or political opinion?', so: 'Weligaa qof ma u geysatay dhib ama silic sababo la xiriira isirkiisa, diintiisa, dalka uu ka yimid, kooxda bulsho ee uu ka tirsan yahay, ama ra’yigiisa siyaasadeed?', w: [['race', 'isir'], ['national origin', 'dalka asalka'], ['political opinion', 'ra’yi siyaasadeed']], why: 'Dad badan oo qaxooti ahaa iyaga ayaa cadaadis la kulmay. Su’aashu waxay weydiinaysaa waxa adigu aad samaysay — ma aha waxa lagugu sameeyay.' }
    ] },
    { g: ['Ciidan, koox hubaysan iyo xabsi', 'Military, armed groups and detention'], items: [
      { q: E + 'served in, been a member of, assisted (helped), or participated in any military or police unit?', so: 'Weligaa ma ka tirsanayd, ma caawisay, mase ka qayb qaadatay ciidan milateri ama boolis?', w: [['served in', 'ka soo shaqeeyay'], ['military', 'milateri'], ['police unit', 'qayb boolis']], why: 'USCIS waxay rabtaa inay ogaato taariikhdaada adeegga ciidan, dal kasta ha ahaadee. Haddii jawaabtaadu “Yes” tahay, waxaa lagu weydiin doonaa dalka, magaca ciidanka, darajadaada iyo taariikhaha.' },
      { q: E + 'served in, been a member of, assisted (helped), or participated in any armed group (a group that carries weapons), for example: paramilitary unit (a group of people who act like a military group but are not part of the official military), self-defense unit, vigilante unit, rebel group, or guerrilla group?', so: 'Weligaa ma ka tirsanayd ama ma caawisay koox hubaysan — tusaale maleeshiyo, koox is-difaac, koox fallaago ah ama jabhad?', w: [['armed group', 'koox hubaysan'], ['paramilitary', 'maleeshiyo u dhaqanta sida ciidan'], ['rebel group', 'koox fallaago ah'], ['guerrilla', 'jabhad']], why: 'Dalal badan oo dagaal sokeeye ka dhacay dadku way la kulmeen kooxo hubaysan. Si run ah u sheeg waxa adiga kugu dhacay ama aad samaysay.' },
      { q: E + 'worked, volunteered, or otherwise served in a place where people were detained (forced to stay), for example, a prison, jail, prison camp (a camp where prisoners of war or political prisoners are kept), detention facility, or labor camp, or have you EVER directed or participated in any other activity that involved detaining people?', so: 'Weligaa ma ka shaqaysay ama ma ku tabarucday meel dad lagu hayo — xabsi, xero maxaabiis ama xero shaqo qasab ah — mase ka qayb qaadatay hawl dad lagu xirayo?', w: [['detained', 'la hayo / la xiray'], ['prison camp', 'xero maxaabiis'], ['labor camp', 'xero shaqo qasab ah']], why: 'Waxaa la raadinayaa cid ka qayb qaadatay xarig sharci-darro ah.' },
      { q: E + 'received any weapons training, paramilitary training, or other military-type training?', so: 'Weligaa ma qaadatay tababar hub ama tababar ciidan oo kale?', w: [['weapons training', 'tababar hub'], ['military-type', 'u eg kan ciidanka']], why: 'Waa qayb ka mid ah taariikhdaada ciidan iyo amni.' },
      { q: E + 'recruited (asked), enlisted (signed up), conscripted (required to join), or used any person under 15 years of age to serve in or help an armed group, or attempted or worked with others to do so?', so: 'Weligaa qof ka yar 15 sano ma u qortay, ma ku qasabtay, mase u isticmaashay inuu koox hubaysan ka mid noqdo ama caawiyo?', w: [['recruited', 'qoray / ku casuumay'], ['conscripted', 'lagu qasbay inuu ku biiro']], why: 'Carruurta in dagaal loo adeegsado waa dembi caalami ah.' }
    ] },
    { g: ['Dembiyo, xarig iyo run-sheegid', 'Crimes, arrests and honesty'], items: [
      { q: E + 'committed, agreed to commit, asked someone else to commit, helped commit, or tried to commit a crime or offense for which you were NOT arrested?', so: 'Weligaa ma gashay, ma isku dayday, mase qof kale ka codsatay dembi ama xad-gudub aan lagugu XIRIN?', w: [['crime', 'dembi'], ['offense', 'xad-gudub'], ['arrested', 'la xiray']], why: 'Foomku wuxuu weydiinayaa dembi kasta, xataa mid aan boolisku ogaan.' },
      { q: E + 'been arrested, cited, detained or confined by any law enforcement officer, military official (in the U.S. or elsewhere), or immigration official for any reason, or been charged with a crime or offense?', so: 'Weligaa ma lagu xiray, warqad ganaax (ticket) ma lagu siiyay, ma lagu hayay, mase dembi lagugu soo oogay — sabab kasta ha ahaatee, dal kasta ha ahaadee?', w: [['cited', 'warqad ganaax ama ballan maxkamadeed la siiyay'], ['detained', 'la hayay'], ['charged', 'dembi lagu soo oogay']], why: 'Tani waa su’aasha dadku ugu badan ku khaldamaan. Foomku wuxuu si cad u leeyahay: sheeg xataa haddii kiiska la xiray, la tirtiray, ama lagu yiri diiwaankaaga kuma jiro. Haddii aad xarig ama maxkamad soo martay, la tasho qareen socdaal ka hor intaadan foomka gudbin.' },
      { q: E + 'married someone in order to obtain an immigration benefit?', so: 'Weligaa qof ma u guursatay si aad faa’iido socdaal uga hesho?', w: [['immigration benefit', 'faa’iido socdaal, sida green card']], why: 'Guur been ah oo socdaal loo sameeyo waa khiyaano sharciga ka dhan ah.' },
      { q: E + 'been married to more than one person at the same time?', so: 'Weligaa hal mar ma wada qabtay wax ka badan hal qof?', w: [['at the same time', 'isku mar']], why: 'Sharciga Maraykanku ma oggola in hal mar la wada qabo in ka badan hal qof. Taariikhda guurkaaga si run ah u sheeg; haddii aad shaki qabto, qareen la tasho.' },
      { q: E + 'helped anyone to enter, or try to enter, the United States illegally?', so: 'Weligaa qof ma ka caawisay inuu si sharci-darro ah ku soo galo Maraykanka?', w: [['illegally', 'si sharci-darro ah']], why: 'Waxaa ku jira qaraabada dhow — ilmahaaga ama xaaskaaga xataa.' },
      { q: E + 'failed to support your dependents (pay child support) or to pay alimony (court-ordered financial support after divorce or separation)?', so: 'Weligaa ma ka gaabisay masruufka carruurtaada ama lacagta maxkamaddu kugu xukuntay furriin ka dib?', w: [['dependents', 'dadka aad masruufto'], ['child support', 'masruufka carruurta'], ['alimony', 'masruuf maxkamaddu xukuntay furriin ka dib']], why: 'Daryeelka qoyska waa qayb ka mid ah dabeecadda wanaagsan.' },
      { q: E + 'made any misrepresentation to obtain any public benefit in the United States?', so: 'Weligaa ma bixisay xog aan run ahayn si aad u hesho gargaar dowladeed?', w: [['misrepresentation', 'xog aan run ahayn'], ['public benefit', 'gargaar dowladeed, sida SNAP ama Medicaid']], why: 'Gargaarka in la qaato dembi ma aha; waxa la weydiinayo waa in been lagu helay.' },
      { q: E + 'given any U.S. Government officials any information or documentation that was false, fraudulent, or misleading?', so: 'Weligaa sarkaal dowladda Maraykanka ma siisay xog ama dukumenti been ah, been-abuur ah ama marin-habaabin ah?', w: [['false', 'been'], ['fraudulent', 'been-abuur'], ['misleading', 'marin-habaabin']], why: 'Run-sheegiddu waa udub-dhexaadka wareysiga oo dhan.' },
      { q: E + 'lied to any U.S. Government officials to gain entry or admission into the United States or to gain immigration benefits while in the United States?', so: 'Weligaa sarkaal dowladda Maraykanka been ma u sheegtay si aad dalka u soo gasho ama faa’iido socdaal u hesho?', w: [['lied', 'been u sheegay'], ['entry or admission', 'soo gelid ama oggolaansho']], why: 'Run-sheegiddu waa udub-dhexaadka wareysiga oo dhan.' }
    ] },
    { g: ['Musaafurin iyo adeegga ciidanka', 'Removal and military service'], items: [
      { q: E + 'been removed or deported from the United States?', so: 'Weligaa ma lagaa saaray ama ma lagaa musaafuriyay Maraykanka?', w: [['removed / deported', 'la musaafuriyay']], why: 'Taariikhdaada socdaalka oo dhan ayaa la eegaa.' },
      { q: E + 'been placed in removal, rescission, or deportation proceedings?', so: 'Weligaa ma lagugu furay dacwad musaafurin?', w: [['proceedings', 'dacwad / habraac maxkamadeed']], why: 'Taariikhdaada socdaalka oo dhan ayaa la eegaa.' },
      { q: 'Are you a male who lived in the United States at any time between your 18th and 26th birthdays?', so: 'Ma tahay lab ku noolaa Maraykanka waqti u dhexeeya da’da 18 iyo 26?', w: [['male', 'lab'], ['between', 'u dhexeeya']], why: 'Haddii ay khuseyso, waxaa xigta: “Did you register for the Selective Service?” — diiwaanka ragga ee ciidanka.' },
      { q: E + 'served in the U.S. armed forces?', so: 'Weligaa ma ka soo shaqaysay ciidamada Maraykanka?', w: [['armed forces', 'ciidamada qalabka sida']], why: 'Adeegga ciidanka Maraykanku wuxuu saamayn karaa waddada jinsiyadda.' }
    ] },
    { g: ['Dhaarta daacadnimada', 'The Oath of Allegiance'], items: [
      { q: 'Do you support the Constitution and form of Government of the United States?', so: 'Ma taageersan tahay Constitution-ka iyo nidaamka dowladda Maraykanka?', w: [['support', 'taageer'], ['form of Government', 'nidaamka dowladda']], why: 'Muwaadin cusub wuxuu ballanqaadaa inuu Constitution-ka ilaaliyo.' },
      { q: 'Do you understand the full Oath of Allegiance to the United States?', so: 'Ma fahamsan tahay dhammaan dhaarta daacadnimada ee Maraykanka?', w: [['Oath of Allegiance', 'dhaarta daacadnimada']], why: 'Dhaartu waa tallaabada ugu dambeysa; waa inaad fahamsan tahay waxa aad ballanqaadayso.' },
      { q: 'Are you willing to take the full Oath of Allegiance to the United States?', so: 'Raalli ma ka tahay inaad dhaarta daacadnimada oo dhan gasho?', w: [['willing', 'raalli ka ah / diyaar u ah']], why: 'Dhaarta la’aanteed jinsiyadda lama qaato.' },
      { q: 'If the law requires it, are you willing to bear arms (carry weapons) on behalf of the United States?', so: 'Haddii sharcigu ku waajibiyo, raalli ma ka tahay inaad hub u qaaddo Maraykanka?', w: [['bear arms', 'hub qaadid'], ['on behalf of', 'magaciisa / dartiis']], why: 'Waa mid ka mid ah ballamaha dhaarta.' },
      { q: 'If the law requires it, are you willing to perform noncombatant services (do something that does not include fighting in a war) in the U.S. armed forces?', so: 'Haddii sharcigu ku waajibiyo, raalli ma ka tahay inaad ciidamada ka qabato adeeg aan dagaal ahayn?', w: [['noncombatant services', 'adeeg aan dagaal ahayn']], why: 'Waa mid ka mid ah ballamaha dhaarta.' },
      { q: 'If the law requires it, are you willing to perform work of national importance under civilian direction (do non-military work that the U.S. Government says is important to the country)?', so: 'Haddii sharcigu ku waajibiyo, raalli ma ka tahay inaad qabato shaqo dalka muhiim u ah oo rayid maamulaan?', w: [['national importance', 'muhiimad qaran'], ['civilian direction', 'maamul rayid ah']], why: 'Waa mid ka mid ah ballamaha dhaarta.' }
    ] }
  ];
  var N4ALL = []; N4.forEach(function (g, gi) { g.items.forEach(function (it, ii) { it.id = gi + '.' + ii; N4ALL.push(it); }); });
  var PERSONAL = [
    ['What is your full name?', 'Magacaaga oo buuxa waa maxay?', 'My name is …'], ['What is your date of birth?', 'Goorma ayaad dhalatay?', 'I was born on …'], ['Where were you born?', 'Xaggee ku dhalatay?', 'I was born in …'],
    ['What is your current address?', 'Cinwaankaaga hadda waa maxay?', 'I live at …'], ['How long have you lived at this address?', 'Muddo intee le’eg ayaad cinwaankan deggenayd?', 'I have lived there for … years.'], ['Are you married?', 'Ma guursatay?', 'Yes, I am. / No, I am not.'],
    ['Do you have any children?', 'Carruur ma leedahay?', 'Yes, I have … children. / No, I do not.'], ['Where do you work?', 'Xaggee ka shaqaysaa?', 'I work at … / I do not work now.'], ['When did you become a permanent resident?', 'Goorma ayaad heshay deganaanshaha joogtada ah (green card)?', 'I became a permanent resident in …'],
    ['Have you taken any trips outside the United States in the last five years?', 'Shantii sano ee u dambeysay ma u safartay dibadda Maraykanka?', 'Yes, I went to … / No, I have not.'], ['Why do you want to become a U.S. citizen?', 'Maxaad u rabtaa inaad muwaadin Maraykan ah noqoto?', 'I want to vote. / This is my home.'], ['Do you understand why you are here today?', 'Ma fahamsan tahay sababta aad maanta halkan u joogto?', 'Yes. I am here for my citizenship interview.']
  ];
  var OATH = ['Please stand and raise your right hand. Do you swear or affirm that the statements you will give today will be the truth, the whole truth, and nothing but the truth?', 'Fadlan istaag oo gacantaada midig kor u qaad. Ma ku dhaaranaysaa in hadalka aad maanta bixinayso uu noqon doono run, runta oo dhan, runna mooyee aan wax kale ahayn?'];
  window.__CZ = { READ: READ, WRITE: WRITE, GL: GL, N4: N4ALL, chips: chips };

  /* ---------- shared pieces ---------- */
  function back(label, fn) { return '<button type="button" class="simple-back" id="czBack">' + ic('back') + esc(label || T('Jinsiyadda', 'Citizenship')) + '</button>'; }
  function wireBack(fn) { var b = document.getElementById('czBack'); if (b) b.onclick = fn || function () { C.route = 'hub'; paint(); }; }
  function go(route) { C.route = route; C.show = false; paint(); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function bar(done, total, label) { return '<div class="progress cz-bar" role="progressbar" aria-label="' + esc(label || '') + '" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + done + '"><i style="width:' + (total ? Math.round(done / total * 100) : 0) + '%"></i></div>'; }
  function answersHTML(q) {
    var mv = mineVal(q);
    return (mv ? '<p class="cz-mine">' + ic('user') + '<span>' + T('Jawaabtaada', 'Your answer') + '</span><b lang="en">' + esc(mv) + '</b></p>' : '') + '<ul class="cz-ans">' + q.answers.map(function (a) { return '<li lang="en">' + esc(a) + '</li>'; }).join('') + '</ul>'
      + (q.changes ? '<p class="cz-check">' + ic('refresh') + '<span>' + T('Jawaabtani way is beddeli kartaa. Hubi jawaabta hadda ka hor wareysigaaga: ', 'This answer can change. Check the current answer before your interview: ') + '<a href="' + UPDATES + '" target="_blank" rel="noopener noreferrer">uscis.gov/citizenship/testupdates</a></span></p>' + (mineDef(q) ? '<p><button type="button" class="simple-text-button" data-mine="1">' + ic('pen') + (mv ? T('Beddel jawaabtayda', 'Change my answer') : T('Halkan ku qor jawaabtaada si aad u xusuusato', 'Write your own answer here so you remember it')) + '</button></p>' : '') : '')
      + '<p class="cz-so" lang="so">' + esc(q.explain_so) + '</p>';
  }
  function seal(right, total, pass, ok) {
    var r = 52, c = 2 * Math.PI * r, off = c * (1 - (total ? right / total : 0));
    return '<div class="cz-seal' + (ok ? ' ok' : '') + '" role="img" aria-label="' + right + ' / ' + total + '"><svg viewBox="0 0 120 120"><circle class="cz-seal-bg" cx="60" cy="60" r="' + r + '"/><circle class="cz-seal-fg" cx="60" cy="60" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg><div><b>' + right + '<span>/' + total + '</span></b><small>' + T('Gudub: ', 'Pass: ') + pass + '</small></div></div>';
  }
  function toSRS(q) { try { addSRS(q.q, q.answers.slice(0, 3).join(' / ') + ' — ' + q.explain_so); } catch (e) { } }
  function readiness() {
    var c = cz(), ed = c.edition, tot = DATA[ed] ? pool(ed).length : (ed === '2025' ? 128 : 100);
    var civ = Math.min(1, knownCount(ed) / tot), rd = Math.min(1, Object.keys(c.read.ok).length / 10), wr = Math.min(1, Object.keys(c.write.ok).length / 10), n4 = Math.min(1, Object.keys(c.n400.seen).length / N4ALL.length), iv = c.interviews.length ? 1 : 0;
    return { civ: civ, rd: rd, wr: wr, n4: n4, iv: iv, all: 0.6 * civ + 0.1 * rd + 0.1 * wr + 0.1 * n4 + 0.1 * iv, tot: tot };
  }
  function daysLeft() { var d = cz().testDate; if (!d) return null; var t = new Date(d + 'T00:00:00'), n = new Date(todayStr() + 'T00:00:00'); if (isNaN(t)) return null; return Math.round((t - n) / 86400000); }

  /* ---------- hub ---------- */
  function hub() {
    var c = cz(), ed = c.edition, r = readiness(), known = knownCount(ed), dl = daysLeft(), name = (S.profile.name || '').split(' ')[0];
    var lastMock = c.civ[ed].mocks[c.civ[ed].mocks.length - 1], rl = rules(ed);
    var h = '<div class="cz"><p class="hero-eyebrow">' + ic('flag') + T('Jinsiyadda · Imtixaanka muwaadinimada', 'Citizenship · Naturalization test') + '</p><h1>' + (name ? esc(name) + ', ' : '') + T('maalintaada way soo socotaa.', 'your day is coming.') + '</h1><p class="simple-intro">' + T('Wax walba oo wareysiga lagu weydiiyo, hal meel, Af-Soomaali lagu sharxay. Tallaabo tallaabo — annaga ayaa kula soconna.', 'Everything asked at the interview, in one place, explained in Somali. One step at a time — we are with you.') + '</p>';
    /* countdown */
    h += '<section class="cz-count">';
    if (dl === null) h += '<div class="cz-count-body"><h2>' + ic('calendar') + T('Goorma ayuu wareysigaagu yahay?', 'When is your interview?') + '</h2><p>' + T('Taariikhda geli, annaguna waxaan kuu samaynaynaa qorshe maalinle ah. Haddii aadan weli ogayn, waa caadi — hadda bilow.', 'Add the date and we will pace your study. If you do not know it yet, that is fine — start today.') + '</p><div class="cz-date"><input type="date" id="czDate" min="' + todayStr() + '" aria-label="' + T('Taariikhda wareysiga', 'Interview date') + '"><button type="button" class="btn" id="czDateSave">' + T('Kaydi', 'Save') + '</button></div></div>';
    else {
      var left = Math.max(0, r.tot - known), per = dl > 0 ? Math.max(1, Math.ceil(left / dl)) : left;
      h += '<div class="cz-count-num"><b>' + (dl > 0 ? dl : dl === 0 ? T('Maanta', 'Today') : ic('check')) + '</b>' + (dl > 0 ? '<span>' + T('maalmood', 'days') + '</span>' : '') + '</div><div class="cz-count-body"><h2>' + (dl > 0 ? T('ayaa ka haray wareysigaaga', 'until your interview') : dl === 0 ? T('waa maalintaada. Neefso, dhoola cadee — waad diyaarsan tahay.', 'is your day. Breathe, smile — you are ready.') : T('Wareysigaagu wuu dhaafay. Sidee buu ahaa?', 'Your interview date has passed. How did it go?')) + '</h2>'
        + (dl > 0 ? '<p>' + (left ? T('Maalintii ' + per + ' su’aal baro, waad gaaraysaa.', 'Learn ' + per + ' question' + (per > 1 ? 's' : '') + ' a day and you will get there.') : T('Su’aalaha oo dhan waad taqaan. Hadda ku celceli wareysiga tijaabada ah.', 'You know every question. Now rehearse with the mock interview.')) + '</p>' : '')
        + '<button type="button" class="simple-text-button" id="czDateClear">' + T('Beddel taariikhda', 'Change the date') + '</button></div>';
    }
    h += '</section>';
    /* readiness */
    h += '<section class="cz-ready"><div class="cz-ready-top">' + ringHTML(r.all, T('Diyaargarow', 'Readiness')) + '<div><h2>' + T('Diyaargarowgaaga', 'Your readiness') + '</h2><p>' + (r.all < 0.05 ? T('Tallaabada koowaad ayaa ugu adag. Hal kaar fur.', 'The first step is the hardest. Open one card.') : r.all < 0.5 ? T('Si fiican ayaad u socotaa. Maalin kasta wax yar.', 'You are on your way. A little every day.') : r.all < 0.9 ? T('Waad ku dhowdahay. Sii wad!', 'You are close. Keep going!') : T('Waad diyaarsan tahay. Ku faan naftaada.', 'You are ready. Be proud of yourself.')) + '</p></div></div>'
      + '<dl class="cz-stats"><div><dt>' + T('Su’aalaha (civics)', 'Civics') + '</dt><dd>' + known + ' / ' + r.tot + '</dd></div><div><dt>' + T('Akhris', 'Reading') + '</dt><dd>' + Object.keys(c.read.ok).length + '</dd></div><div><dt>' + T('Qoraal', 'Writing') + '</dt><dd>' + Object.keys(c.write.ok).length + '</dd></div><div><dt>N-400</dt><dd>' + Object.keys(c.n400.seen).length + ' / ' + N4ALL.length + '</dd></div></dl></section>';
    /* edition */
    h += '<section class="cz-ed"><h2>' + T('Imtixaankee ayaa ku khuseeya?', 'Which test applies to you?') + '</h2><div class="cz-seg" role="group" aria-label="' + T('Nooca imtixaanka', 'Test edition') + '">'
      + ['2025', '2008'].map(function (e) { return '<button type="button" data-ed="' + e + '" aria-pressed="' + (ed === e) + '"><b>' + e + '</b><span>' + (e === '2025' ? T('128 su’aalood', '128 questions') : T('100 su’aalood', '100 questions')) + '</span></button>'; }).join('') + '</div>'
      + '<p class="small muted">' + T('Haddii aad foomka N-400 gudbisay <strong>October 20, 2025 ama ka dib</strong>, waxaad gelaysaa imtixaanka 2025. Haddii aad ka hor gudbisay, waa kan 2008. Taariikhdu waxay ku qoran tahay warqadda USCIS ee rasiidka (receipt notice).', 'If you filed Form N-400 <strong>on or after October 20, 2025</strong>, you take the 2025 test. If you filed before, it is the 2008 test. The date is on your USCIS receipt notice.') + '</p>'
      + '<label class="cz-toggle"><input type="checkbox" id="czSenior"' + (c.senior ? ' checked' : '') + '><span><b>65/20</b> — ' + T('Waxaan ahay 65 jir ama ka weyn, green card-na waxaan haystay 20 sano ama ka badan: 20-ka su’aalood ee xiddigta leh oo keliya i tus.', 'I am 65 or older and have been a permanent resident for 20 years or more: show only the 20 starred questions.') + '</span></label></section>';
    /* parts */
    function row(id, icon, so, en, sub) { return '<button type="button" class="cz-row" data-go="' + id + '"><span class="cz-row-ic">' + ic(icon) + '</span><span class="cz-row-t"><b>' + T(so, en) + '</b><small>' + sub + '</small></span>' + ic('chevron') + '</button>'; }
    h += '<h2 class="cz-h">' + T('Qaybaha imtixaanka', 'The parts of the test') + '</h2><div class="cz-rows">'
      + row('cards', 'cards', 'Kaararka su’aalaha', 'Civics flashcards', known + ' / ' + r.tot + ' ' + T('waad taqaan', 'known'))
      + row('topics', 'layers', 'Mawduuc mawduuc u baro', 'Learn by topic', T('Dowlad, taariikh, astaamo', 'Government, history, symbols'))
      + row('mock', 'check', 'Imtixaan tijaabo ah', 'Mock civics test', (lastMock ? T('Kii ugu dambeeyay: ', 'Last: ') + lastMock.right + '/' + lastMock.asked + ' · ' : '') + rl.asked + T(' su’aalood, gudub ', ' questions, pass ') + rl.pass)
      + row('read', 'book', 'Akhriska', 'Reading', T('Jumlad si sax ah u akhri', 'Read one sentence correctly'))
      + row('write', 'pen', 'Qoraalka', 'Writing', T('Jumlad si sax ah u qor', 'Write one sentence correctly'))
      + row('n400', 'shield', 'Su’aalaha Yes / No ee N-400', 'N-400 yes / no questions', Object.keys(c.n400.seen).length + ' / ' + N4ALL.length + ' ' + T('waad fahantay', 'understood'))
      + row('interview', 'chat', 'Wareysi tijaabo ah oo dhammaystiran', 'Full mock interview', c.interviews.length ? T('La qabtay: ', 'Taken: ') + c.interviews.length : T('Dhaar, su’aalo, civics, akhris, qoraal', 'Oath, questions, civics, reading, writing'))
      + row('report', 'award', 'Natiijooyinkayga iyo warbixinta', 'My results and report', c.interviews.length ? T('Warbixintaada waa diyaar', 'Your report is ready') : T('Halkan ayay kaaga muuqan doonaan', 'They will appear here'))
      + '</div><h2 class="cz-h">' + T('Siyaabo kale oo aad ku baran karto', 'More ways to learn') + '</h2><div class="cz-rows">'
      + row('ear', 'speaker', 'Dhegeyso oo garo', 'Listen and recognise', T('Su’aasha maqal, ha akhrin — sida wareysiga', 'Hear the question, do not read it — like the interview'))
      + row('audio', 'play', 'Dhegeyso adigoo mashquul ah', 'Listen while you are busy', T('Gacmo la’aan: jikada, baska, shaqada', 'Hands-free: kitchen, bus, work break'))
      + row('family', 'user', 'Ilmahaagu ha noqdo sarkaalka', 'Let your child be the officer', T('Laba qof, hal taleefan', 'Two people, one phone'))
      + row('mine', 'pen', 'Jawaabahayga', 'My answers', c.mine && c.mine.state ? esc(c.mine.state) + (mineStale() ? ' · ' + T('dib u hubi', 'check again') : '') : T('Gobolkaaga, guddoomiyahaaga, senator-kaaga', 'Your state, governor, senator'))
      + row('wall', 'layers', 'Darbiga su’aalaha', 'The wall of questions', known + ' / ' + r.tot + ' ' + T('leben', 'bricks'))
      + '</div><p class="cz-source">' + T('Su’aalaha iyo jawaabaha waxaa laga soo qaatay agabka rasmiga ah ee USCIS (uscis.gov). Sharraxaadda Soomaaliga waa caawimaad waxbarasho oo akadeemiyaddu qortay. Tani ma aha talo sharci.', 'Questions and answers come from official USCIS study materials (uscis.gov). The Somali explanations are study help written by the academy. This is not legal advice.') + '</p></div>';
    app.innerHTML = h;
    var ds = document.getElementById('czDateSave'); if (ds) ds.onclick = function () { var v = document.getElementById('czDate').value; if (!v) return; c.testDate = v; save(); paint(); };
    var dc = document.getElementById('czDateClear'); if (dc) dc.onclick = function () { delete c.testDate; save(); paint(); };
    app.querySelectorAll('[data-ed]').forEach(function (b) { b.onclick = function () { c.edition = b.dataset.ed; save(); C.idx = 0; C.topic = null; window.renderCitizenship(); }; });
    document.getElementById('czSenior').onchange = function () { c.senior = this.checked; save(); C.idx = 0; paint(); };
    app.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { C.topic = null; C.idx = 0; C.run = null; C.rw = null; C.ear = null; if (b.dataset.go === 'interview') C.iv = null; go(b.dataset.go); }; });
  }

  /* ---------- flashcards + topics ---------- */
  function deck() {
    var c = cz(), ed = c.edition, k = c.civ[ed].known, l = pool(ed);
    if (C.topic) l = l.filter(function (q) { return q.section === C.topic; });
    if (C.filter === 'todo') l = l.filter(function (q) { return !k[q.n]; });
    return l;
  }
  function cards() {
    var c = cz(), ed = c.edition, st = c.civ[ed], all = pool(ed).filter(function (q) { return !C.topic || q.section === C.topic; }), kn = all.filter(function (q) { return st.known[q.n]; }).length, l = deck();
    if (C.idx >= l.length) C.idx = 0;
    var h = '<div class="cz">' + back(C.topic ? T('Mawduucyada', 'Topics') : null) + '<h1>' + (C.topic ? esc(secName(C.topic)) : T('Kaararka su’aalaha', 'Civics flashcards')) + '</h1>'
      + '<div class="cz-meter"><span>' + kn + ' / ' + all.length + ' ' + T('waad taqaan', 'known') + '</span>' + bar(kn, all.length, T('Horumarka', 'Progress')) + '</div>'
      + '<div class="cz-chips"><button type="button" class="chipbtn' + (C.filter === 'todo' ? ' sel' : '') + '" data-f="todo">' + T('Kuwa aan weli baran', 'Still to learn') + '</button><button type="button" class="chipbtn' + (C.filter === 'all' ? ' sel' : '') + '" data-f="all">' + T('Dhammaan', 'All') + '</button></div>';
    if (!l.length) h += '<div class="card empty cz-done">' + ic('award') + '<h2>' + T('Dhammaantood waad taqaan!', 'You know them all!') + '</h2><p>' + T('Shaqo qurux badan. Hadda isku day imtixaanka tijaabada ah, ama dib u eeg dhammaan kaararka.', 'Beautiful work. Try the mock test now, or review every card again.') + '</p><p><button type="button" class="btn" id="czToMock">' + T('Imtixaan tijaabo ah', 'Take the mock test') + '</button></p></div>';
    else {
      var q = l[C.idx];
      h += '<article class="cz-card" data-n="' + q.n + '"><p class="hero-eyebrow">' + T('Su’aasha ', 'Question ') + q.n + (q.star65 ? ' · 65/20 ★' : '') + ' · ' + esc(secName(q.section)) + '</p><div class="cz-qrow"><h2 class="cz-q" lang="en">' + esc(q.q) + '</h2>' + speakBtn(q.q) + '</div>';
      if (!C.show) h += '<p class="muted">' + T('Marka hore cod dheer isku day, kadibna eeg jawaabta.', 'Try to answer aloud first, then look.') + '</p><button type="button" class="btn cz-wide" id="czShow">' + T('Muuji jawaabta', 'Show the answer') + '</button>';
      else h += '<div class="cz-reveal">' + answersHTML(q) + '<div class="cz-two"><button type="button" class="btn secondary" id="czAgain">' + T('Wali waan baranayaa', 'Still learning') + '</button><button type="button" class="btn" id="czKnow">' + ic('check') + T('Waan aqaan', 'I know it') + '</button></div></div>';
      h += '</article><div class="cz-pager"><button type="button" class="simple-text-button" id="czPrev"' + (C.idx ? '' : ' disabled') + '>' + ic('back') + T('Hore', 'Previous') + '</button><span>' + (C.idx + 1) + ' / ' + l.length + '</span><button type="button" class="simple-text-button" id="czNext">' + T('Xiga', 'Next') + ic('arrow') + '</button></div>';
    }
    app.innerHTML = h + '</div>'; bindSpeak(app);
    wireBack(function () { if (C.topic) { C.topic = null; go('topics'); } else go('hub'); });
    app.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { C.filter = b.dataset.f; C.idx = 0; C.show = false; paint(); }; });
    var m = document.getElementById('czToMock'); if (m) m.onclick = function () { C.run = null; go('mock'); };
    if (!l.length) return;
    var q2 = l[C.idx], step = function (d) { C.idx = (C.idx + d + l.length) % l.length; C.show = false; paint(); };
    var s = document.getElementById('czShow'); if (s) s.onclick = function () { C.show = true; st.seen[q2.n] = 1; save(); paint(); };
    var a = document.getElementById('czAgain'); if (a) a.onclick = function () { delete st.known[q2.n]; toSRS(q2); save(); step(1); };
    var k = document.getElementById('czKnow'); if (k) k.onclick = function () { st.known[q2.n] = 1; save(); C.show = false; if (C.filter === 'todo') { if (C.idx >= l.length - 1) C.idx = 0; paint(); } else step(1); };
    document.getElementById('czPrev').onclick = function () { step(-1); }; document.getElementById('czNext').onclick = function () { step(1); };
  }
  function topics() {
    var c = cz(), ed = c.edition, st = c.civ[ed], seen = [], by = {};
    pool(ed).forEach(function (q) { if (!by[q.section]) { by[q.section] = { n: 0, k: 0 }; seen.push(q.section); } by[q.section].n++; if (st.known[q.n]) by[q.section].k++; });
    app.innerHTML = '<div class="cz">' + back() + '<h1>' + T('Mawduuc mawduuc u baro', 'Learn by topic') + '</h1><p class="simple-intro">' + T('Dooro hal mawduuc. Marka aad dhammayso, mid kale u gudub.', 'Choose one topic. When you finish it, move to the next.') + '</p><div class="cz-rows">'
      + seen.map(function (s, i) { var x = by[s]; return '<button type="button" class="cz-row cz-topic" data-topic="' + esc(s) + '" style="--stage:var(--st' + (i % 12 + 1) + ')"><span class="cz-row-ic cz-num">' + (x.k === x.n ? ic('check') : (i + 1)) + '</span><span class="cz-row-t"><b>' + esc(secName(s)) + '</b><small>' + x.k + ' / ' + x.n + '</small>' + bar(x.k, x.n, s) + '</span>' + ic('chevron') + '</button>'; }).join('') + '</div></div>';
    wireBack(); app.querySelectorAll('[data-topic]').forEach(function (b) { b.onclick = function () { C.topic = b.dataset.topic; C.idx = 0; C.filter = 'all'; go('cards'); }; });
  }

  /* ---------- civics mock test (oral, self-checked against the official answers) ---------- */
  function startMock(cb, family) { var ed = cz().edition, rl = rules(ed); C.run = { family: !!family, ed: ed, asked: rl.asked, pass: rl.pass, qs: shuffled(pool(ed)).slice(0, rl.asked), i: 0, right: 0, wrong: 0, missed: [], show: false, started: false, done: false, cb: cb || null }; }
  function mock() {
    if (!C.run) startMock();
    var r = C.run, inIv = !!r.cb, fam = r.family, h = '<div class="cz">' + (inIv ? ivHead(3) : back()); if (fam) r.show = true;
    if (!r.started) {
      if (fam) h += '<h1>' + T('Ilmahaagu ha noqdo sarkaalka', 'Let your child be the officer') + '</h1><div class="cz-brief"><p lang="so">Taleefanka u dhiib ilmahaaga, saaxiibkaa ama deriskaaga Ingiriisiga akhriya. Isagu wuxuu arkayaa su’aasha iyo jawaabaha la aqbalo; adigu waxba ma arkaysid — sida wareysiga dhabta ah. Qof ku jecel hortiisa ayaad ku tababaranaysaa.</p><p lang="en"><strong>For the helper:</strong> read each question aloud, slowly and kindly. Listen to the answer. Any ONE answer on the list is correct, unless the question asks for two or three. Then tap “Correct” or “Not yet”. Do not give hints.</p></div><button type="button" class="btn cz-wide" id="czStart">' + T('Taleefanka waan dhiibay — bilow', 'I have handed over the phone — begin') + ic('arrow') + '</button>';
      else h += '<h1>' + T('Imtixaanka civics-ka', 'The civics test') + '</h1><div class="cz-brief"><p>' + T('Imtixaanka dhabta ahi waa <strong>hadal</strong>: sarkaalku wuxuu ku weydiinayaa ilaa <strong>' + r.asked + '</strong> su’aalood, adiguna cod ayaad kaga jawaabaysaa. Waxaad u baahan tahay <strong>' + r.pass + '</strong> sax ah.', 'The real test is <strong>spoken</strong>: the officer asks up to <strong>' + r.asked + '</strong> questions and you answer aloud. You need <strong>' + r.pass + '</strong> correct.') + '</p><p>' + T('Halkan: su’aasha dhegeyso, cod dheer uga jawaab, kadibna jawaabaha rasmiga ah isku eeg oo naftaada si daacad ah u calaamadee.', 'Here: listen, answer aloud, then compare with the official answers and mark yourself honestly.') + '</p></div><button type="button" class="btn cz-wide" id="czStart">' + T('Bilow', 'Begin') + ic('arrow') + '</button>';
    } else if (!r.done) {
      var q = r.qs[r.i];
      h += '<div class="cz-meter"><span>' + T('Su’aasha ', 'Question ') + (r.i + 1) + ' / ' + r.asked + '</span><span class="cz-tally">' + ic('check') + r.right + '</span>' + bar(r.i, r.asked, '') + '</div><article class="cz-card cz-officer"><p class="hero-eyebrow">' + (fam ? 'For the helper · read this aloud' : T('Sarkaalku wuxuu ku weydiinayaa', 'The officer asks')) + '</p><div class="cz-qrow"><h2 class="cz-q" lang="en">' + esc(q.q) + '</h2>' + speakBtn(q.q) + '</div>';
      if (!r.show) h += '<p class="muted">' + T('Cod dheer uga jawaab — sidii adigoo sarkaalka hor fadhiya.', 'Answer aloud — as if you were sitting with the officer.') + '</p><button type="button" class="btn cz-wide" id="czShow">' + T('Waan jawaabay — i tus jawaabaha', 'I answered — show the answers') + '</button>';
      else h += '<div class="cz-reveal">' + answersHTML(q) + '<p class="cz-ask">' + (fam ? 'Did she or he give one of these answers?' : T('Jawaabtaadu ma ku jirtay kuwa kor ku qoran?', 'Was your answer one of these?')) + '</p><div class="cz-two"><button type="button" class="btn secondary" id="czNo">' + (fam ? 'Not yet' : T('Maya, wali', 'Not yet')) + '</button><button type="button" class="btn" id="czYes">' + ic('check') + (fam ? 'Correct' : T('Haa, waan saxay', 'Yes, I got it')) + '</button></div></div>';
      h += '</article>';
    } else h += mockResult(r);
    app.innerHTML = h + '</div>'; bindSpeak(app); wireBack(inIv ? ivQuit : null);
    var s = document.getElementById('czStart'); if (s) s.onclick = function () { r.started = true; paint(); if (!fam) speak(r.qs[0].q); };
    var sh = document.getElementById('czShow'); if (sh) sh.onclick = function () { r.show = true; paint(); };
    function mark(ok) {
      var q = r.qs[r.i]; if (ok) r.right++; else { r.wrong++; r.missed.push(q); toSRS(q); }
      r.i++; r.show = false;
      if (r.right >= r.pass || r.wrong > r.asked - r.pass || r.i >= r.asked) { r.done = true; r.ok = r.right >= r.pass; cz().civ[r.ed].mocks.push({ date: todayStr(), right: r.right, asked: r.i, pass: r.pass, ok: r.ok, senior: !!cz().senior, family: fam }); save(); paint(); window.scrollTo({ top: 0, behavior: 'instant' }); }
      else { paint(); if (!fam) speak(r.qs[r.i].q); window.scrollTo({ top: 0, behavior: 'instant' }); }
    }
    var y = document.getElementById('czYes'); if (y) y.onclick = function () { mark(true); }; var n = document.getElementById('czNo'); if (n) n.onclick = function () { mark(false); };
    var ag = document.getElementById('czRetake'); if (ag) ag.onclick = function () { C.run = null; paint(); };
    var hb = document.getElementById('czHub'); if (hb) hb.onclick = function () { C.run = null; go('hub'); };
    var cn = document.getElementById('czCont'); if (cn) cn.onclick = function () { var cb = r.cb; C.run = null; cb({ ok: r.ok, score: r.right + '/' + r.i }); };
  }
  function mockResult(r) {
    return '<section class="cz-result' + (r.ok ? ' ok' : '') + '">' + seal(r.right, r.i, r.pass, r.ok) + '<h1>' + (r.ok ? T('Hambalyo! Waad gudubtay.', 'Congratulations! You passed.') : T('Wali ma gaarin — laakiin waad ku dhowdahay.', 'Not yet — but you are close.')) + '</h1><p class="simple-intro">' + (r.ok ? T('Sidan oo kale ayaad maalinta dhabta ah u samayn doontaa. Sarkaalku wuu joojiyaa marka aad ' + r.pass + ' saxdo.', 'This is how it will feel on the real day. The officer stops once you reach ' + r.pass + ' correct.') : T('Qof kasta oo gudbay halkan ayuu soo maray. Su’aalaha kaa dhacay waxaan ku darnay kaararkaaga dib-u-eegista.', 'Everyone who passed has stood here. We added the questions you missed to your review cards.')) + '</p>'
      + (r.missed.length ? '<h2 class="cz-h">' + T('Kuwan dib u eeg', 'Review these') + '</h2><div class="cz-missed">' + r.missed.map(function (q) { return '<details class="simple-details"><summary lang="en">' + esc(q.q) + '</summary>' + answersHTML(q) + '</details>'; }).join('') + '</div><p class="small muted">' + ic('plus') + ' ' + T('Waxaa lagu daray kaararkaaga dib-u-eegista.', 'Added to your review cards.') + '</p>' : '')
      + (r.cb ? '<button type="button" class="btn cz-wide" id="czCont">' + T('Sii wad wareysiga', 'Continue the interview') + ic('arrow') + '</button>' : '<div class="cz-two"><button type="button" class="btn secondary" id="czHub">' + T('Ku noqo Jinsiyadda', 'Back to Citizenship') + '</button><button type="button" class="btn" id="czRetake">' + T('Mar kale isku day', 'Try again') + '</button></div>') + '</section>';
  }

  /* ---------- reading + writing (practice and real-format test) ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function startRW(kind, test, cb) { var list = kind === 'read' ? READ : WRITE; C.rw = { kind: kind, test: !!test, cb: cb || null, order: test ? shuffled(list.map(function (_, i) { return i; })).slice(0, 3) : null, i: 0, tries: 0, state: '', heard: '', typed: '', done: false, ok: false, gloss: null }; }
  function rw(kind) {
    if (!C.rw || C.rw.kind !== kind) startRW(kind, false);
    var r = C.rw, list = kind === 'read' ? READ : WRITE, st = cz()[kind], idx = r.test ? r.order[r.i] : r.i % list.length, sent = list[idx], inIv = !!r.cb;
    var title = kind === 'read' ? T('Akhriska', 'Reading') : T('Qoraalka', 'Writing');
    var h = '<div class="cz">' + (inIv ? ivHead(kind === 'read' ? 4 : 5) : back()) + '<h1>' + title + (r.test ? ' · ' + T('imtixaan', 'test') : '') + '</h1>';
    if (r.done) {
      h += '<section class="cz-result' + (r.ok ? ' ok' : '') + '">' + seal(r.ok ? 1 : 0, 1, 1, r.ok) + '<h1>' + (r.ok ? T('Waad gudubtay qaybtan.', 'You passed this part.') : T('Wali tababar ayay u baahan tahay.', 'This part needs more practice.')) + '</h1><p class="simple-intro">' + (kind === 'read' ? T('Imtixaanka dhabta ah waxaad heleysaa saddex fursadood; hal jumlad oo sax ah ayaa kugu filan.', 'On the real test you get three chances; one correct sentence is enough.') : T('Imtixaanka dhabta ah saddex jumladood ayaa laguu yeerinayaa; hal mid oo sax ah ayaa kugu filan.', 'On the real test up to three sentences are dictated; one correct sentence is enough.')) + '</p>'
        + (inIv ? '<button type="button" class="btn cz-wide" id="czCont">' + T('Sii wad wareysiga', 'Continue the interview') + ic('arrow') + '</button>' : '<div class="cz-two"><button type="button" class="btn secondary" id="czPrac">' + T('Tababar', 'Practice') + '</button><button type="button" class="btn" id="czTest">' + T('Mar kale', 'Again') + '</button></div>') + '</section>';
    } else {
      h += (!inIv ? '<div class="cz-chips"><button type="button" class="chipbtn' + (!r.test ? ' sel' : '') + '" id="czPrac">' + T('Tababar', 'Practice') + '</button><button type="button" class="chipbtn' + (r.test ? ' sel' : '') + '" id="czTest">' + T('Imtixaan dhab u eg', 'Real-format test') + '</button></div>' : '')
        + '<div class="cz-meter"><span>' + (r.test ? T('Fursadda ', 'Chance ') + (r.i + 1) + ' / 3' : (idx + 1) + ' / ' + list.length + ' · ' + Object.keys(st.ok).length + ' ' + T('la saxay', 'correct')) + '</span></div>';
      if (kind === 'read') {
        h += '<article class="cz-card"><p class="hero-eyebrow">' + T('Jumladdan cod dheer u akhri', 'Read this sentence aloud') + '</p><p class="cz-sentence" lang="en">' + chips(sent).map(function (c) { return c.k ? '<button type="button" class="cz-w" data-k="' + esc(c.k) + '">' + esc(c.t) + '</button>' : esc(c.t); }).join('') + '</p><div id="czGloss" class="cz-gloss" aria-live="polite">' + (r.test ? '' : '<span class="muted">' + T('Eray taabo si aad macnihiisa Soomaali u aragto.', 'Tap a word to see its Somali meaning.') + '</span>') + '</div>'
          + '<div class="cz-actions">' + (r.test ? '' : '<button type="button" class="btn secondary" id="czHear">' + ic('speaker') + T('Dhegeyso', 'Listen') + '</button>') + (SR ? '<button type="button" class="btn secondary" id="czMic">' + ic('mic') + T('Makarafoonka ku akhri', 'Read to the microphone') + '</button>' : '') + '</div>'
          + (r.heard ? '<p class="cz-heard' + (r.state === 'ok' ? ' ok' : '') + '">' + T('Waxaan maqlay: ', 'I heard: ') + '<span lang="en">“' + esc(r.heard) + '”</span></p>' : '') + (r.state === 'listening' ? '<p class="cz-heard">' + T('Waan ku dhegeysanayaa…', 'Listening…') + '</p>' : '')
          + '<p class="cz-ask">' + T('Si sax ah ma u akhriday?', 'Did you read it correctly?') + '</p><div class="cz-two"><button type="button" class="btn secondary" id="czNo">' + T('Maya, wali', 'Not yet') + '</button><button type="button" class="btn" id="czYes">' + ic('check') + T('Haa', 'Yes') + '</button></div>' + (SR ? '<p class="small muted">' + T('Makarafoonku waa caawimaad uun, ma aha qiimayn rasmi ah.', 'The microphone is only a helper, not an official score.') + '</p>' : '') + '</article>';
      } else {
        h += '<article class="cz-card"><p class="hero-eyebrow">' + T('Dhegeyso, kadibna qor waxa aad maqashay', 'Listen, then write what you hear') + '</p><div class="cz-actions"><button type="button" class="btn" id="czHear">' + ic('speaker') + T('Dhegeyso', 'Listen') + '</button><button type="button" class="btn secondary" id="czSlow">' + T('Tartiib', 'Slowly') + '</button></div>'
          + '<label for="czType" class="simple-label">' + T('Jumladda halkan ku qor', 'Write the sentence here') + '</label><input type="text" id="czType" class="cz-input" lang="en" autocomplete="off" autocapitalize="sentences" spellcheck="false" value="' + esc(r.typed) + '"' + (r.state ? ' readonly' : '') + '>';
        if (!r.state) h += '<button type="button" class="btn cz-wide" id="czCheck">' + T('Hubi', 'Check') + '</button>';
        else h += '<div class="feedback ' + (r.state === 'ok' ? 'good' : 'bad') + '"><strong>' + (r.state === 'ok' ? T('Sax! Si fiican ayaad u qortay.', 'Correct! Well written.') : T('Ku dhowaad. Jumladda saxda ahi waa:', 'Close. The correct sentence is:')) + '</strong><p class="cz-sentence small" lang="en">' + esc(sent) + '</p>' + (r.state !== 'ok' ? '<p class="small" lang="so">' + T('Higgaadda iyo erayada isku eeg; xarfaha waaweyn iyo joogsiga laguma dhaliyo.', 'Compare the spelling and words; capitals and punctuation are not marked.') + '</p>' : '') + '</div><button type="button" class="btn cz-wide" id="czNextS">' + T('Xiga', 'Next') + ic('arrow') + '</button>';
        h += '</article>';
      }
    }
    app.innerHTML = h + '</div>'; bindSpeak(app); wireBack(inIv ? ivQuit : null);
    var pr = document.getElementById('czPrac'); if (pr) pr.onclick = function () { startRW(kind, false); paint(); };
    var te = document.getElementById('czTest'); if (te) te.onclick = function () { startRW(kind, true); paint(); };
    var cn = document.getElementById('czCont'); if (cn) cn.onclick = function () { var cb = r.cb, ok = r.ok; C.rw = null; cb({ ok: ok }); };
    if (r.done) return;
    function result(ok) {
      if (ok) st.ok[idx] = 1;
      if (r.test) { if (ok || r.i >= 2) { r.done = true; r.ok = ok; st.tests.push({ date: todayStr(), ok: ok }); } else { r.i++; } }
      else r.i++;
      r.state = ''; r.heard = ''; r.typed = ''; save(); paint();
    }
    var hear = document.getElementById('czHear'); if (hear) hear.onclick = function () { speak(sent, false, hear); };
    var slow = document.getElementById('czSlow'); if (slow) slow.onclick = function () { speak(sent, true, slow); };
    if (kind === 'read') {
      app.querySelectorAll('.cz-w').forEach(function (b) { b.onclick = function () { if (r.test) return; app.querySelectorAll('.cz-w.on').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); var g = GL[b.dataset.k]; document.getElementById('czGloss').innerHTML = '<b lang="en">' + esc(b.textContent) + '</b><span lang="so">' + esc(g || T('Magac gaar ah', 'A proper name')) + '</span>'; speak(b.textContent); }; });
      document.getElementById('czYes').onclick = function () { result(true); }; document.getElementById('czNo').onclick = function () { result(false); };
      var mic = document.getElementById('czMic'); if (mic) mic.onclick = function () {
        try { var rec = new SR(); rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 3; r.state = 'listening'; r.heard = ''; paint();
          rec.onresult = function (e) { var best = '', ok = false; for (var i = 0; i < e.results[0].length; i++) { var t = e.results[0][i].transcript; if (!best) best = t; if (plain(t) === plain(sent)) { ok = true; best = t; } } r.heard = best; r.state = ok ? 'ok' : 'heard'; if (C.rw === r) paint(); };
          rec.onerror = rec.onnomatch = function () { r.state = ''; r.heard = ''; if (C.rw === r) paint(); }; rec.onend = function () { if (r.state === 'listening') { r.state = ''; if (C.rw === r) paint(); } }; rec.start();
        } catch (e) { r.state = ''; paint(); }
      };
    } else {
      var inp = document.getElementById('czType'); if (inp && !r.state) { inp.oninput = function () { r.typed = inp.value; }; inp.onkeydown = function (e) { if (e.key === 'Enter') document.getElementById('czCheck').click(); }; }
      var ck = document.getElementById('czCheck'); if (ck) ck.onclick = function () { r.typed = inp.value; if (!plain(r.typed)) { inp.focus(); return; } r.state = plain(r.typed) === plain(sent) ? 'ok' : 'no'; paint(); };
      var nx = document.getElementById('czNextS'); if (nx) nx.onclick = function () { result(r.state === 'ok'); };
    }
  }

  /* ---------- N-400 yes/no questions ---------- */
  function disclaimer() { return '<aside class="cz-legal">' + ic('shield') + '<div><p lang="so"><strong>Tani waa caawimaad waxbarasho, ma aha talo sharci.</strong> Halkan waxaad ku baranaysaa waxa su’aalahu ka dhigan yihiin. Jawaabta saxda ahi waa runta noloshaada — annagu kuuma sheegi karno sanduuqa aad calaamadinayso. Haddii aad shaki qabto, la tasho qareen socdaal ama wakiil DOJ aqoonsan tahay.</p><p lang="en" class="muted">This is study help, not legal advice. Here you learn what the questions mean. The right answer is the truth about your own life — we cannot tell you which box to tick. If you are unsure, speak with an immigration attorney or a DOJ-accredited representative.</p></div></aside>'; }
  function n400() {
    var c = cz(), seen = c.n400.seen, n = Object.keys(seen).length;
    var h = '<div class="cz">' + back() + '<h1>' + T('Su’aalaha Yes / No ee N-400', 'N-400 yes / no questions') + '</h1><p class="simple-intro">' + T('Sarkaalku wuxuu kugu celinayaa su’aalaha foomkaaga N-400. Halkan ku baro macnaha su’aal kasta si aadan maalinta wareysiga ula yaabin.', 'The officer will repeat questions from your N-400. Learn here what each one means, so nothing surprises you on the day.') + '</p>' + disclaimer()
      + '<div class="cz-brief"><h2>' + T('Sida looga jawaabo', 'How to answer') + '</h2><p lang="so">Dhegeyso su’aasha oo dhan. Si run ah uga jawaab: <strong lang="en">“Yes”</strong> ama <strong lang="en">“No”</strong>. Haddii aadan fahmin, ha qiyaasin — dheh:</p><p class="cz-say" lang="en">“Could you please repeat the question?”' + speakBtn('Could you please repeat the question?') + '</p><p class="cz-say" lang="en">“I don’t understand. Could you say it another way?”' + speakBtn('I don’t understand. Could you say it another way?') + '</p></div>'
      + '<div class="cz-meter"><span>' + n + ' / ' + N4ALL.length + ' ' + T('waad fahantay', 'understood') + '</span>' + bar(n, N4ALL.length, '') + '</div>';
    N4.forEach(function (g) {
      h += '<h2 class="cz-h">' + T(g.g[0], g.g[1]) + '</h2>' + g.items.map(function (it) {
        return '<details class="simple-details cz-n4' + (seen[it.id] ? ' seen' : '') + '"><summary><span lang="en">' + esc(it.q) + '</span>' + (seen[it.id] ? ic('check') : '') + '</summary><div class="cz-n4-body"><p>' + speakBtn(it.q) + '</p><h3>' + T('Macnaha', 'What it means') + '</h3><p lang="so" class="cz-so">' + esc(it.so) + '</p><h3>' + T('Erayada adag', 'Hard words') + '</h3><ul class="cz-words">' + it.w.map(function (w) { return '<li><b lang="en">' + esc(w[0]) + '</b><span lang="so">' + esc(w[1]) + '</span></li>'; }).join('') + '</ul><h3>' + T('Maxaa loo weydiiyaa?', 'Why USCIS asks') + '</h3><p lang="so">' + esc(it.why) + '</p><h3>' + T('Jawaabtaada', 'Your answer') + '</h3><p lang="so">Si run ah uga jawaab, adigoo ka hadlaya noloshaada iyo taariikhdaada. Annagu kuuma dooran karno “Yes” ama “No”.</p><button type="button" class="btn ' + (seen[it.id] ? 'secondary' : '') + '" data-n4="' + it.id + '">' + (seen[it.id] ? ic('check') + T('Waan fahmay', 'Understood') : T('Waan fahmay su’aashan', 'I understand this question')) + '</button></div></details>';
      }).join('');
    });
    app.innerHTML = h + '<p class="cz-source">' + T('Su’aalaha waxaa laga soo xigtay Foomka N-400 (daabacaadda 01/20/25), Qaybta 9. Mar walba ka hubi foomka hadda jira uscis.gov/n-400.', 'Questions are quoted from Form N-400 (edition 01/20/25), Part 9. Always check the current form at uscis.gov/n-400.') + '</p></div>';
    bindSpeak(app); wireBack();
    app.querySelectorAll('[data-n4]').forEach(function (b) { b.onclick = function () { var id = b.dataset.n4; if (seen[id]) delete seen[id]; else seen[id] = 1; save(); var y = window.scrollY; paint(); var d = app.querySelector('[data-n4="' + id + '"]'); if (d) d.closest('details').open = true; window.scrollTo({ top: y, behavior: 'instant' }); }; });
  }

  /* ---------- full mock interview ---------- */
  var IVSTEPS = [['Dhaarta', 'Oath'], ['Su’aalo shakhsi', 'About you'], ['N-400', 'N-400'], ['Civics', 'Civics'], ['Akhris', 'Reading'], ['Qoraal', 'Writing']];
  function ivHead(i) { return '<button type="button" class="simple-back" id="czBack">' + ic('close') + T('Ka bax wareysiga', 'Leave the interview') + '</button><ol class="cz-steps" aria-label="' + T('Tallaabooyinka wareysiga', 'Interview steps') + '">' + IVSTEPS.map(function (s, k) { return '<li class="' + (k < i ? 'done' : k === i ? 'now' : '') + '"><span>' + (k < i ? ic('check') : (k + 1)) + '</span><small>' + T(s[0], s[1]) + '</small></li>'; }).join('') + '</ol>'; }
  function ivQuit() { C.iv = null; C.run = null; C.rw = null; go('hub'); }
  function interview() {
    var v = C.iv;
    if (!v) {
      app.innerHTML = '<div class="cz">' + back() + '<h1>' + T('Wareysi tijaabo ah', 'Mock interview') + '</h1><p class="simple-intro">' + T('Kani waa ku-celcelin buuxda oo u eg maalinta dhabta ah. Meel deggan fariiso, codkaaga isticmaal, waqti qaado. Qiyaastii 15 daqiiqo.', 'A full rehearsal shaped like the real day. Sit somewhere quiet, use your voice, take your time. About 15 minutes.') + '</p><ol class="cz-plan">' + [['Dhaarta run-sheegidda', 'The oath to tell the truth'], ['Su’aalo adiga kugu saabsan', 'Questions about you'], ['Su’aalaha Yes / No ee N-400', 'N-400 yes / no questions'], ['Imtixaanka civics-ka', 'The civics test'], ['Akhris: hal jumlad', 'Reading: one sentence'], ['Qoraal: hal jumlad', 'Writing: one sentence']].map(function (s) { return '<li>' + T(s[0], s[1]) + '</li>'; }).join('') + '</ol><p class="small muted">' + T('Sarkaalka dhabta ahi wuxuu Ingiriisigaaga ku qiimeeyaa sida aad su’aalihiisa u fahanto ugana jawaabto intii wareysigu socdo.', 'The real officer judges your spoken English by how you understand and answer throughout the interview.') + '</p><button type="button" class="btn cz-wide" id="czIvGo">' + T('Waan diyaarsanahay', 'I am ready') + ic('arrow') + '</button></div>';
      wireBack(); document.getElementById('czIvGo').onclick = function () { C.iv = { step: 0, i: 0, ok: 0, parts: {}, pq: shuffled(PERSONAL).slice(0, 6), nq: shuffled(N4ALL).slice(0, 5) }; paint(); speak(OATH[0]); window.scrollTo({ top: 0, behavior: 'instant' }); };
      return;
    }
    function officer(en, so, extra, yes, no) {
      return '<article class="cz-card cz-officer"><p class="hero-eyebrow">' + T('Sarkaalku wuxuu leeyahay', 'The officer says') + '</p><div class="cz-qrow"><h2 class="cz-q" lang="en">' + esc(en) + '</h2>' + speakBtn(en) + '</div><p class="cz-so" lang="so">' + esc(so) + '</p>' + (extra || '') + '<div class="cz-two"><button type="button" class="btn secondary" id="czNo">' + no + '</button><button type="button" class="btn" id="czYes">' + ic('check') + yes + '</button></div></article>';
    }
    var h = '<div class="cz">' + ivHead(v.step), cur = null;
    if (v.step === 0) h += officer(OATH[0], OATH[1], '<p class="cz-say" lang="en">“Yes, I do.”' + speakBtn('Yes, I do.') + '</p><p class="small muted">' + T('Istaag, gacanta midig kor u qaad, oo cod cad ku dheh.', 'Stand, raise your right hand, and say it clearly.') + '</p>', T('Waan iri', 'I said it'), T('Mar kale i tus', 'Let me try again'));
    else if (v.step === 1) { cur = v.pq[v.i]; h += '<div class="cz-meter"><span>' + (v.i + 1) + ' / ' + v.pq.length + '</span></div>' + officer(cur[0], cur[1], '<p class="cz-say" lang="en"><span class="muted">' + T('Qaab jawaab: ', 'Answer pattern: ') + '</span>' + esc(cur[2]) + '</p>', T('Waan ka jawaabay', 'I answered'), T('Waan ku adkaaday', 'It was hard')); }
    else if (v.step === 2) { cur = v.nq[v.i]; h += '<div class="cz-meter"><span>' + (v.i + 1) + ' / ' + v.nq.length + '</span></div>' + officer(cur.q, cur.so, '<p class="small" lang="so">Si run ah uga jawaab “Yes” ama “No”. Halkan jawaabtaada lama kaydinayo — kaliya ma fahantay su’aasha?</p>', T('Waan fahmay oo waan jawaabay', 'I understood and answered'), T('Ma fahmin', 'I did not understand'));
    }
    app.innerHTML = h + '</div>'; bindSpeak(app); wireBack(ivQuit);
    function next(ok) {
      if (v.step === 0) { if (!ok) { speak(OATH[0]); return; } v.parts.oath = { ok: true }; v.step = 1; v.i = 0; v.ok = 0; paint(); speak(v.pq[0][0]); }
      else if (v.step === 1) { if (ok) v.ok++; v.i++; if (v.i >= v.pq.length) { v.parts.speaking = { ok: v.ok >= 4, score: v.ok + '/' + v.pq.length }; v.step = 2; v.i = 0; v.ok = 0; paint(); speak(v.nq[0].q); } else { paint(); speak(v.pq[v.i][0]); } }
      else if (v.step === 2) { if (ok) v.ok++; v.i++; if (v.i >= v.nq.length) { v.parts.n400 = { ok: v.ok >= 4, score: v.ok + '/' + v.nq.length }; v.step = 3; startMock(function (res) { v.parts.civics = res; v.step = 4; startRW('read', true, function (r2) { v.parts.reading = r2; v.step = 5; startRW('write', true, function (r3) { v.parts.writing = r3; finishIv(v); }); C.route = 'write'; paint(); }); C.route = 'read'; paint(); }); C.route = 'mock'; paint(); } else { paint(); speak(v.nq[v.i].q); } }
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    var y = document.getElementById('czYes'); if (y) y.onclick = function () { next(true); }; var n = document.getElementById('czNo'); if (n) n.onclick = function () { next(false); };
  }
  function finishIv(v) {
    var c = cz(), p = v.parts, pass = ['speaking', 'n400', 'civics', 'reading', 'writing'].every(function (k) { return p[k] && p[k].ok; });
    c.interviews.push({ date: todayStr(), edition: c.edition, senior: !!c.senior, parts: p, pass: pass }); save();
    C.iv = null; C.run = null; C.rw = null; C.fresh = true; go('report');
  }
  var PARTS = [['speaking', 'Hadalka iyo fahamka', 'Speaking and understanding'], ['n400', 'Su’aalaha N-400', 'N-400 questions'], ['civics', 'Civics', 'Civics'], ['reading', 'Akhris', 'Reading'], ['writing', 'Qoraal', 'Writing']];
  function report() {
    var c = cz(), list = c.interviews, last = list[list.length - 1], fresh = C.fresh; C.fresh = false;
    var h = '<div class="cz">' + back() + '<h1>' + T('Natiijooyinkayga', 'My results') + '</h1>';
    if (!last) h += '<div class="card empty">' + ic('award') + '<h2>' + T('Warbixintaadu halkan ayay ku soo bixi doontaa', 'Your report will appear here') + '</h2><p>' + T('Marka aad dhammayso wareysiga tijaabada ah, waxaad heli doontaa warbixin aad qoyskaaga tusi karto.', 'When you finish the mock interview you will receive a report you can show your family.') + '</p><p><button type="button" class="btn" id="czToIv">' + T('Bilow wareysiga tijaabada ah', 'Start the mock interview') + '</button></p></div>';
    else {
      var d = new Date(last.date + 'T00:00:00'), nice = isNaN(d) ? last.date : d.toLocaleDateString(T('so', 'en-US') === 'so' ? 'en-GB' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      h += '<section class="cz-cert' + (last.pass ? ' ok' : '') + (fresh ? ' fresh' : '') + '" id="czCert"><div class="cz-cert-in"><p class="hero-eyebrow">Somali English Academy · ' + T('Warbixinta wareysiga tijaabada ah', 'Mock interview report') + '</p><div class="cz-cert-mark">' + ic(last.pass ? 'award' : 'flag') + '</div><h2>' + esc(S.profile.name || T('Ardayga', 'Learner')) + '</h2><p class="cz-cert-line">' + (last.pass ? T('Wareysi tijaabo ah oo dhammaystiran ayaa si guul leh loo dhammeeyay.', 'successfully completed a full mock naturalization interview.') : T('Wareysi tijaabo ah ayaa la dhammeeyay. Qaybaha hoose ee calaamadaysan waxay u baahan yihiin tababar dheeraad ah.', 'completed a mock naturalization interview. The parts marked below need a little more practice.')) + '</p><ul class="cz-cert-parts">' + PARTS.map(function (p) { var x = last.parts[p[0]] || {}; return '<li class="' + (x.ok ? 'ok' : '') + '"><span>' + ic(x.ok ? 'check' : 'refresh') + '</span><b>' + T(p[1], p[2]) + '</b><small>' + (x.score ? x.score + ' · ' : '') + (x.ok ? T('Gudub', 'Pass') : T('Tababar u baahan', 'Needs practice')) + '</small></li>'; }).join('') + '</ul><p class="cz-cert-foot">' + esc(nice) + ' · ' + T('Imtixaanka ', 'Civics test ') + last.edition + (last.senior ? ' · 65/20' : '') + '<br><span>' + T('Warbixin tababar — ma aha dukumenti rasmi ah oo USCIS.', 'Practice report — not an official USCIS document.') + '</span></p></div></section>'
        + '<div class="cz-two"><button type="button" class="btn secondary" id="czPrint">' + T('Daabac ama kaydi', 'Print or save') + '</button><button type="button" class="btn" id="czToIv">' + T('Wareysi kale', 'Another interview') + '</button></div>';
      if (list.length > 1) h += '<h2 class="cz-h">' + T('Wareysiyadii hore', 'Earlier interviews') + '</h2><ul class="cz-hist">' + list.slice(0, -1).reverse().map(function (x) { return '<li><span>' + esc(x.date) + '</span><b>' + PARTS.filter(function (p) { return x.parts[p[0]] && x.parts[p[0]].ok; }).length + ' / 5</b></li>'; }).join('') + '</ul>';
    }
    var mocks = c.civ[c.edition].mocks;
    if (mocks.length) h += '<h2 class="cz-h">' + T('Imtixaannada civics-ka', 'Civics mock tests') + ' · ' + c.edition + '</h2><ul class="cz-hist">' + mocks.slice().reverse().slice(0, 8).map(function (m) { return '<li class="' + (m.ok ? 'ok' : '') + '"><span>' + esc(m.date) + '</span><b>' + m.right + ' / ' + m.asked + '</b></li>'; }).join('') + '</ul>';
    app.innerHTML = h + '</div>'; wireBack();
    var t = document.getElementById('czToIv'); if (t) t.onclick = function () { C.iv = null; go('interview'); };
    var p = document.getElementById('czPrint'); if (p) p.onclick = function () { document.body.classList.add('cz-printing'); window.print(); setTimeout(function () { document.body.classList.remove('cz-printing'); }, 500); };
  }


  /* ============ Five ways to learn that nobody asked for ============ */
  /* (1) My answers — her own state and officials on the "answers will vary" cards */
  var MINE = [
    ['senator', /state’s U\.S\. senators? now/i, 'Mid ka mid ah senator-rada gobolkayga', 'One of my state’s U.S. senators', 'https://www.senate.gov/senators/'],
    ['rep', /Name your U\.S\. representative/i, 'Wakiilkayga (U.S. representative)', 'My U.S. representative', 'https://www.house.gov/representatives/find-your-representative'],
    ['governor', /governor of your state/i, 'Guddoomiyaha gobolkayga', 'My governor', 'https://www.usa.gov/state-governor'],
    ['capital', /capital of your state/i, 'Caasimadda gobolkayga', 'My state capital', ''],
    ['president', /name of the President of the United States now/i, 'Madaxweynaha hadda', 'The President now', UPDATES],
    ['vp', /name of the Vice President/i, 'Madaxweyne-ku-xigeenka hadda', 'The Vice President now', UPDATES],
    ['speaker', /Speaker of the House of Representatives now/i, 'Speaker-ka House-ka hadda', 'The Speaker of the House now', UPDATES],
    ['chief', /Chief Justice of the United States now/i, 'Chief Justice-ka hadda', 'The Chief Justice now', UPDATES],
    ['party', /political party of the President now/i, 'Xisbiga madaxweynaha', 'The President’s political party', UPDATES],
    ['justices', /How many justices are on the Supreme Court/i, 'Tirada garsoorayaasha Supreme Court', 'Number of Supreme Court justices', UPDATES]
  ];
  var CAPS = {}; 'Alabama:Montgomery|Alaska:Juneau|Arizona:Phoenix|Arkansas:Little Rock|California:Sacramento|Colorado:Denver|Connecticut:Hartford|Delaware:Dover|Florida:Tallahassee|Georgia:Atlanta|Hawaii:Honolulu|Idaho:Boise|Illinois:Springfield|Indiana:Indianapolis|Iowa:Des Moines|Kansas:Topeka|Kentucky:Frankfort|Louisiana:Baton Rouge|Maine:Augusta|Maryland:Annapolis|Massachusetts:Boston|Michigan:Lansing|Minnesota:Saint Paul|Mississippi:Jackson|Missouri:Jefferson City|Montana:Helena|Nebraska:Lincoln|Nevada:Carson City|New Hampshire:Concord|New Jersey:Trenton|New Mexico:Santa Fe|New York:Albany|North Carolina:Raleigh|North Dakota:Bismarck|Ohio:Columbus|Oklahoma:Oklahoma City|Oregon:Salem|Pennsylvania:Harrisburg|Rhode Island:Providence|South Carolina:Columbia|South Dakota:Pierre|Tennessee:Nashville|Texas:Austin|Utah:Salt Lake City|Vermont:Montpelier|Virginia:Richmond|Washington:Olympia|West Virginia:Charleston|Wisconsin:Madison|Wyoming:Cheyenne'.split('|').forEach(function (x) { var a = x.split(':'); CAPS[a[0]] = a[1]; });
  function mineDef(q) { for (var i = 0; i < MINE.length; i++) if (MINE[i][1].test(q.q)) return MINE[i]; return null; }
  function mineVal(q) { var m = mineDef(q), c = cz(); return (m && c.mine && c.mine[m[0]]) || ''; }
  function mineStale() { var c = cz(); if (!c.mine || !c.mine.updated) return false; return (new Date(todayStr()) - new Date(c.mine.updated)) / 86400000 > 120; }
  function mine() {
    var c = cz(), m = c.mine || {}, ed = c.edition, defs = MINE.filter(function (d) { return DATA[ed].questions.some(function (q) { return d[1].test(q.q); }); });
    var h = '<div class="cz">' + back() + '<h1>' + T('Jawaabahayga', 'My answers') + '</h1><p class="simple-intro">' + T('Su’aalaha qaar jawaabtoodu waxay ku xiran tahay gobolkaaga iyo cidda hadda xilka haysa. Hal mar halkan ku qor, kaararkaaga ayay ka soo muuqan doonaan.', 'Some answers depend on your state and on who holds office now. Write them here once and they will appear on your cards.') + '</p>'
      + (mineStale() ? '<p class="cz-check">' + ic('refresh') + '<span>' + T('Jawaabahan in ka badan afar bilood ka hor ayaad qortay. Dib u hubi inay weli sax yihiin.', 'You wrote these more than four months ago. Check that they are still correct.') + '</span></p>' : '')
      + '<form id="czMine" class="cz-form"><label class="simple-label" for="czState">' + T('Gobolka aad deggan tahay', 'The state you live in') + '</label><select id="czState"><option value="">' + T('Dooro gobol', 'Choose a state') + '</option>' + Object.keys(CAPS).map(function (s) { return '<option' + (m.state === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>'
      + defs.map(function (d) { var q = DATA[ed].questions.filter(function (x) { return d[1].test(x.q); })[0]; return '<label class="simple-label" for="czM_' + d[0] + '">' + T(d[2], d[3]) + '</label><p class="small muted" lang="en">' + esc(q.q) + '</p><input type="text" id="czM_' + d[0] + '" lang="en" autocomplete="off" value="' + esc(m[d[0]] || '') + '">' + (d[4] ? '<p class="small"><a href="' + d[4] + '" target="_blank" rel="noopener noreferrer">' + T('Ka hubi bogga rasmiga ah', 'Check the official page') + ' ' + ic('external') + '</a></p>' : ''); }).join('')
      + '<button type="submit" class="btn cz-wide">' + T('Kaydi jawaabahayga', 'Save my answers') + '</button><p class="small muted" role="status" id="czMineOk"></p></form><p class="cz-source">' + T('Adiga ayaa mas’uul ka ah saxnaanta magacyadan — akadeemiyaddu ma buuxin karto, sababtoo ah way is beddelaan. Mar walba ka hubi bogagga rasmiga ah ka hor wareysigaaga.', 'You are responsible for these names — the academy cannot fill them in because they change. Always check the official pages before your interview.') + '</p></div>';
    app.innerHTML = h; wireBack();
    var st = document.getElementById('czState'), cap = document.getElementById('czM_capital');
    st.onchange = function () { if (cap && (!cap.value || Object.keys(CAPS).some(function (s) { return CAPS[s] === cap.value; }))) cap.value = CAPS[st.value] || ''; };
    document.getElementById('czMine').onsubmit = function (e) { e.preventDefault(); var o = { state: st.value, updated: todayStr() }; defs.forEach(function (d) { var v = document.getElementById('czM_' + d[0]).value.trim(); if (v) o[d[0]] = v; }); c.mine = o; save(); document.getElementById('czMineOk').textContent = T('Waa la kaydiyay. Kaararkaaga ayay hadda ka muuqdaan.', 'Saved. They now appear on your cards.'); };
  }

  /* (2) Listen and recognise — the real test is heard, never read */
  function startEar() {
    var ed = cz().edition, st = cz().civ[ed], p = pool(ed).filter(function (q) { return !q.changes; }), todo = p.filter(function (q) { return !st.known[q.n]; });
    C.ear = { ed: ed, qs: shuffled(todo.length >= 8 ? todo : p).slice(0, 8), i: 0, right: 0, pick: null, text: false, opts: null, done: false, missed: [] };
  }
  function earOpts(q) {
    var seen = {}, out = [], all = shuffled(DATA[C.ear.ed].questions.filter(function (x) { return x.n !== q.n && !x.changes; }));
    q.answers.forEach(function (a) { seen[plain(a)] = 1; });
    all.sort(function (a, b) { return (b.section === q.section) - (a.section === q.section); });
    for (var i = 0; i < all.length && out.length < 2; i++) { var a = all[i].answers[0]; if (!seen[plain(a)] && a.length < 70) { seen[plain(a)] = 1; out.push(a); } }
    return shuffled([q.answers[0]].concat(out));
  }
  function ear() {
    if (!C.ear) startEar();
    var e = C.ear, h = '<div class="cz">' + back() + '<h1>' + T('Dhegeyso oo garo', 'Listen and recognise') + '</h1>';
    if (e.done) h += '<section class="cz-result' + (e.right >= 6 ? ' ok' : '') + '">' + seal(e.right, e.qs.length, 6, e.right >= 6) + '<h1>' + (e.right >= 6 ? T('Dhegtaadu way diyaarsan tahay.', 'Your ear is ready.') : T('Dhegtu tababar ayay ku barataa.', 'The ear learns by practice.')) + '</h1><p class="simple-intro">' + T('Maalinta wareysiga su’aalaha waa lagu maqashiinayaa, laguma tusayo. Maalin kasta hal wareeg dhegeyso.', 'On interview day you hear the questions; you do not see them. Do one round a day.') + '</p><div class="cz-two"><button type="button" class="btn secondary" id="czHub">' + T('Ku noqo Jinsiyadda', 'Back to Citizenship') + '</button><button type="button" class="btn" id="czEarAgain">' + T('Wareeg kale', 'Another round') + '</button></div></section>';
    else {
      var q = e.qs[e.i]; if (!e.opts) e.opts = earOpts(q);
      h += '<p class="simple-intro">' + T('Su’aasha lama qorin — sida wareysiga dhabta ah. Dhegeyso, kadibna dooro jawaabta saxda ah.', 'The question is not written — just like the real interview. Listen, then choose the correct answer.') + '</p><div class="cz-meter"><span>' + (e.i + 1) + ' / ' + e.qs.length + '</span><span class="cz-tally">' + ic('check') + e.right + '</span>' + bar(e.i, e.qs.length, '') + '</div><article class="cz-card cz-officer"><div class="cz-ear"><button type="button" class="cz-earbtn" id="czEarPlay" aria-label="' + T('Dhegeyso su’aasha', 'Listen to the question') + '">' + ic('speaker') + '</button><div><b>' + T('Dhegeyso su’aasha', 'Listen to the question') + '</b><button type="button" class="simple-text-button" id="czEarSlow">' + T('Tartiib ku celi', 'Repeat slowly') + '</button></div></div>'
        + (e.text || e.pick !== null ? '<p class="cz-q" lang="en">' + esc(q.q) + '</p>' : '<button type="button" class="simple-text-button" id="czEarText">' + T('Ma maqli karo — i tus qoraalka', 'I cannot catch it — show the text') + '</button>')
        + '<div class="opts">' + e.opts.map(function (o, i) { var cls = e.pick === null ? '' : plain(o) === plain(q.answers[0]) ? ' correct' : e.pick === i ? ' wrong' : ''; return '<button type="button" class="opt keep-emoji' + cls + '" lang="en" data-o="' + i + '"' + (e.pick !== null ? ' disabled' : '') + '>' + esc(o) + '</button>'; }).join('') + '</div>'
        + (e.pick !== null ? '<div class="cz-reveal"><p class="cz-so" lang="so" style="margin-top:var(--s-4)">' + esc(q.explain_so) + '</p><button type="button" class="btn cz-wide" id="czEarNext">' + T('Xiga', 'Next') + ic('arrow') + '</button></div>' : '') + '</article>';
    }
    app.innerHTML = h + '</div>'; wireBack();
    var again = document.getElementById('czEarAgain'); if (again) again.onclick = function () { C.ear = null; paint(); }; var hb = document.getElementById('czHub'); if (hb) hb.onclick = function () { C.ear = null; go('hub'); };
    if (e.done) return; var q2 = e.qs[e.i];
    document.getElementById('czEarPlay').onclick = function () { speak(q2.q); }; document.getElementById('czEarSlow').onclick = function () { speak(q2.q, true); };
    var tx = document.getElementById('czEarText'); if (tx) tx.onclick = function () { e.text = true; paint(); };
    app.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () { e.pick = +b.dataset.o; if (plain(e.opts[e.pick]) === plain(q2.answers[0])) e.right++; else { e.missed.push(q2); toSRS(q2); save(); } paint(); }; });
    var nx = document.getElementById('czEarNext'); if (nx) nx.onclick = function () { e.i++; e.pick = null; e.text = false; e.opts = null; if (e.i >= e.qs.length) e.done = true; paint(); if (!e.done) speak(e.qs[e.i].q); window.scrollTo({ top: 0, behavior: 'instant' }); };
    if (e.i === 0 && e.pick === null && !e.started) { e.started = true; speak(q2.q); }
  }

  /* (3) Hands-free listening loop — question, a pause for her answer, then the answer */
  function say(text, done) {
    var fired = false, fin = function () { if (fired) return; fired = true; if (done) done(); };
    try { if (!('speechSynthesis' in window)) throw 0; var u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.9; u.onend = fin; u.onerror = fin; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); setTimeout(fin, 3000 + text.length * 120); }
    catch (e) { setTimeout(fin, 1500 + text.length * 60); }
  }
  function spoken(q) { var v = mineVal(q); if (v) return v; if (q.changes) return 'Check the current answer before your interview.'; return q.answers[0].replace(/\[[^\]]*\]/g, '').replace(/[()“”"]/g, '').trim(); }
  function stopLoop() { var l = C.loop; if (!l) return; l.token++; l.playing = false; clearTimeout(l.timer); try { window.speechSynthesis.cancel(); } catch (e) { } if (l.lock) { try { l.lock.release(); } catch (e) { } l.lock = null; } }
  function loopStep() {
    var l = C.loop, tk = ++l.token, q = l.list[l.i]; l.phase = 'q'; if (C.route === 'audio') paint();
    say(q.q, function () { if (tk !== l.token) return; l.phase = 'wait'; if (C.route === 'audio') paint();
      l.timer = setTimeout(function () { if (tk !== l.token) return; l.phase = 'a'; if (C.route === 'audio') paint();
        say(spoken(q), function () { if (tk !== l.token) return; l.timer = setTimeout(function () { if (tk !== l.token) return; l.i = (l.i + 1) % l.list.length; l.count++; loopStep(); }, 1600); }); }, l.pause * 1000); });
  }
  function audio() {
    var ed = cz().edition, st = cz().civ[ed];
    if (!C.loop) { var todo = pool(ed).filter(function (q) { return !st.known[q.n]; }); C.loop = { list: shuffled(todo.length >= 5 ? todo : pool(ed)), i: 0, phase: 'idle', playing: false, pause: 5, token: 0, count: 0, timer: null, lock: null }; }
    var l = C.loop, q = l.list[l.i], lab = { idle: T('Diyaar', 'Ready'), q: T('Su’aasha', 'The question'), wait: T('Adiga ayaa jawaabaya…', 'Your turn to answer…'), a: T('Jawaabta', 'The answer') }[l.phase];
    app.innerHTML = '<div class="cz">' + back() + '<h1>' + T('Dhegeyso adigoo mashquul ah', 'Listen while you are busy') + '</h1><p class="simple-intro">' + T('Jikada, baska, ama nasashada shaqada: taleefanku wuxuu akhrinayaa su’aasha, wuu ku sugayaa inta aad cod ku jawaabayso, kadibna jawaabta ayuu kuu sheegayaa.', 'In the kitchen, on the bus, on a work break: the phone reads the question, waits while you answer aloud, then tells you the answer.') + '</p>'
      + '<article class="cz-card cz-loop ' + l.phase + '"><p class="hero-eyebrow">' + lab + ' · ' + (l.i + 1) + ' / ' + l.list.length + '</p><h2 class="cz-q" lang="en">' + esc(q.q) + '</h2>' + (l.phase === 'wait' ? '<div class="cz-wait" style="--wait:' + l.pause + 's"><i></i></div>' : '') + (l.phase === 'a' ? '<div class="cz-reveal">' + answersHTML(q) + '</div>' : '')
      + '<div class="cz-two"><button type="button" class="btn secondary" id="czLoopSkip">' + T('Ka bood', 'Skip') + '</button><button type="button" class="btn" id="czLoopPlay">' + ic(l.playing ? 'close' : 'play') + (l.playing ? T('Jooji', 'Pause') : T('Bilow dhegeysiga', 'Start listening')) + '</button></div></article>'
      + '<h2 class="cz-h">' + T('Intee ayaan ku sugaa jawaabtaada?', 'How long should I wait for your answer?') + '</h2><div class="cz-chips">' + [3, 5, 8].map(function (s) { return '<button type="button" class="chipbtn' + (l.pause === s ? ' sel' : '') + '" data-pause="' + s + '">' + s + ' ' + T('ilbiriqsi', 'seconds') + '</button>'; }).join('') + '</div><p class="small muted">' + T('Codku waa kan aaladdaada. Shaashadda ha damin inta uu socdo.', 'The voice is your device’s own. Keep the screen on while it plays.') + '</p></div>';
    wireBack(function () { stopLoop(); C.loop = null; go('hub'); });
    document.getElementById('czLoopPlay').onclick = function () { if (l.playing) { stopLoop(); l.phase = 'idle'; paint(); } else { l.playing = true; try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (k) { l.lock = k; }).catch(function () { }); } catch (e) { } loopStep(); } };
    document.getElementById('czLoopSkip').onclick = function () { var was = l.playing; stopLoop(); l.i = (l.i + 1) % l.list.length; if (was) { l.playing = true; loopStep(); } else { l.phase = 'idle'; paint(); } };
    app.querySelectorAll('[data-pause]').forEach(function (b) { b.onclick = function () { l.pause = +b.dataset.pause; if (!l.playing) paint(); else b.parentNode.querySelectorAll('.chipbtn').forEach(function (x) { x.classList.toggle('sel', x === b); }); }; });
  }

  /* (4) The wall — every question as a square that fills in as she learns */
  function wall() {
    var c = cz(), ed = c.edition, st = c.civ[ed], p = pool(ed), kn = p.filter(function (q) { return st.known[q.n]; }).length;
    app.innerHTML = '<div class="cz">' + back() + '<h1>' + T('Darbiga ' + p.length + '-ka su’aalood', 'The wall of ' + p.length) + '</h1><p class="simple-intro">' + (kn === p.length ? T('Darbigu wuu buuxsamay. Adiga ayaa dhisay, leben leben.', 'The wall is full. You built it, brick by brick.') : T('Su’aal kasta oo aad barato hal leben ayay darbiga ku dartaa. ' + kn + ' ayaad dhigtay, ' + (p.length - kn) + ' ayaa kuu haray.', 'Every question you learn lays one brick. You have laid ' + kn + '; ' + (p.length - kn) + ' to go.')) + '</p>'
      + '<div class="cz-wall" role="list">' + p.map(function (q, i) { var s = st.known[q.n] ? 'k' : st.seen[q.n] ? 's' : ''; return '<button type="button" role="listitem" class="cz-sq ' + s + '" data-i="' + i + '" aria-label="' + T('Su’aasha ', 'Question ') + q.n + (s === 'k' ? T(' — waad taqaan', ' — known') : '') + '">' + q.n + '</button>'; }).join('') + '</div>'
      + '<p class="cz-legend"><span><i class="cz-sq k"></i>' + T('Waan aqaan', 'Known') + '</span><span><i class="cz-sq s"></i>' + T('Waan arkay', 'Seen') + '</span><span><i class="cz-sq"></i>' + T('Cusub', 'New') + '</span></p></div>';
    wireBack(); app.querySelectorAll('.cz-wall .cz-sq').forEach(function (b) { b.onclick = function () { C.topic = null; C.filter = 'all'; C.idx = +b.dataset.i; go('cards'); }; });
  }

  /* (5) Let your child be the officer — two people, one phone */
  function family() { if (!C.run || !C.run.family) startMock(null, true); mock(); }

  /* ---------- router ---------- */
  function paint() {
    document.body.classList.add('view-cit'); if (C.route !== 'audio') stopLoop();
    ({ hub: hub, cards: cards, topics: topics, mock: mock, read: function () { rw('read'); }, write: function () { rw('write'); }, n400: n400, interview: interview, report: report, mine: mine, ear: ear, audio: audio, wall: wall, family: family }[C.route] || hub)();
    app.querySelectorAll('[data-mine]').forEach(function (b) { b.onclick = function () { go('mine'); }; });
  }
  window.renderCitizenship = function () {
    var ed = cz().edition;
    if (DATA[ed]) { paint(); return; }
    app.innerHTML = '<div class="cz"><p class="hero-eyebrow">' + ic('flag') + T('Jinsiyadda', 'Citizenship') + '</p><div class="cz-skel"></div><div class="cz-skel short"></div><div class="cz-skel"></div></div>';
    load(ed).then(function () { if (view === 'cit') paint(); }).catch(function () {
      if (view !== 'cit') return;
      app.innerHTML = '<div class="cz"><div class="card empty">' + ic('signal') + '<h2>' + T('Su’aalaha lama soo rari karin', 'The questions could not load') + '</h2><p>' + T('Internet-ka hubi, kadibna mar kale isku day. Marka hal mar la soo raro, internet la’aan ayay ku shaqeeyaan.', 'Check your connection and try again. Once loaded, they work offline.') + '</p><p><button type="button" class="btn" id="czRetry">' + T('Mar kale isku day', 'Try again') + '</button></p></div></div>';
      document.getElementById('czRetry').onclick = window.renderCitizenship;
    });
  };
  window.openCitizenship = function (route) { C.route = route || 'hub'; C.run = null; C.rw = null; C.iv = null; setNav('cit'); render(); };

  /* ---------- progress on Home and Profile ---------- */
  function summary() { var c = cz(), ed = c.edition, tot = ed === '2025' ? 128 : 100; if (c.senior) tot = 20; var k = DATA[ed] ? knownCount(ed) : Object.keys(c.civ[ed].known).length; return { k: Math.min(k, tot), tot: tot, ed: ed, dl: daysLeft(), started: k > 0 || c.interviews.length > 0 || Object.keys(c.n400.seen).length > 0 }; }
  var home = renderHome, profile = renderProfile;
  renderHome = function () {
    home(); var box = app.querySelector('.simple-home-content'); if (!box || document.getElementById('homeCit') || !S || !S.profile) return;
    var s = summary(), b = document.createElement('button'); b.type = 'button'; b.id = 'homeCit'; b.className = 'cz-home';
    b.innerHTML = '<span class="cz-row-ic">' + ic('flag') + '</span><span class="cz-row-t"><b>' + T('Jinsiyadda', 'Citizenship') + (s.dl !== null && s.dl > 0 ? ' · ' + s.dl + ' ' + T('maalmood', 'days') : '') + '</b><small>' + (s.started ? s.k + ' / ' + s.tot + ' ' + T('su’aalood waad taqaan', 'questions known') + ' · ' + s.ed : T('U diyaargarow imtixaanka muwaadinimada — Af-Soomaali', 'Prepare for the naturalization test — in Somali')) + '</small>' + (s.started ? bar(s.k, s.tot, '') : '') + '</span>' + ic('chevron');
    b.onclick = function () { window.openCitizenship('hub'); };
    var anchor = document.getElementById('homeWatchNext') || box.querySelector('.simple-next'); if (anchor) anchor.insertAdjacentElement('afterend', b); else box.appendChild(b);
  };
  renderProfile = function () {
    profile(); var rows = app.querySelector('.simple-profile-rows'); if (!rows || document.getElementById('profileCit')) return;
    var s = summary(), c = cz(), b = document.createElement('button'); b.type = 'button'; b.id = 'profileCit'; b.className = 'simple-row';
    b.innerHTML = '<svg class="simple-icon" viewBox="0 0 24 24" aria-hidden="true">' + UI_ICONS.flag + '</svg><span>' + T('Jinsiyadda', 'Citizenship') + '</span><small>' + s.k + ' / ' + s.tot + (c.interviews.length ? ' · ' + T('wareysi ', 'interviews ') + c.interviews.length : '') + '</small><svg class="simple-icon" viewBox="0 0 24 24" aria-hidden="true">' + UI_ICONS.chevron + '</svg>';
    b.onclick = function () { window.openCitizenship(c.interviews.length ? 'report' : 'hub'); };
    rows.insertBefore(b, rows.children[1] || null);
  };
  var prevRender = render;
  render = function () { if (view !== 'cit') { document.body.classList.remove('view-cit'); stopLoop(); } prevRender(); };
  if (S && S.profile && S.profile.onboarded) render();
})();
