/** @OnlyCurrentDoc */
// Backend of the house website: finance.html (key-protected budget overview), nakup-zdeni.html (encrypted shopping list,
// opened with the same key) and navstevy.js (anonymous visit log). Bound to the builder's finance spreadsheet, deployed
// as a web app. No secrets live here: keys are rows of the "Přístupy" sheet, the content key is a script property and
// the spreadsheet itself stays private.
//
// Nasazení (jednou):
//  1. V tabulce Rozšíření → Apps Script, smazat obsah Code.gs, vložit celý tento soubor, Uložit.
//  2. Nasadit → Nové nasazení → typ Webová aplikace; Spustit jako: Já; Kdo má přístup: Kdokoli → Nasadit.
//  3. Autorizovat přístup (jen k této tabulce, díky @OnlyCurrentDoc) a zkopírovat URL končící /exec.
//  4. URL vložit do navstevy.js (const API='…'). Test: otevřít URL /exec v prohlížeči → {"ok":true,"service":"dum"}.
//  5. Znovu načíst tabulku → objeví se menu „Web domu“ (odkazy s klíčem, kategorie plateb, vzorce Reality).
//  6. Nákup na zdění: Nastavení projektu (ozubené kolo) → Vlastnosti skriptu → Přidat vlastnost skriptu, název OBSAH_KLIC,
//     hodnota = obsah souboru soukrome/klic.txt (vytvoří ho node tools/zamek.mjs, git ho ignoruje) → Uložit.
// Změna kódu: vložit nový kód, Uložit, Nasadit → Spravovat nasazení → upravit (tužka) → Verze: Nová verze → Nasadit.
// URL /exec zůstane stejná.
// POZOR: tabulka nesmí být sdílená odkazem („Kdokoli s odkazem“) – kdokoli s odkazem by viděl klíče i návštěvy.
// Listy „Přístupy“ a „Návštěvy“ si skript založí sám. Zrušení odkazu = smazat jeho řádek v listu Přístupy.
// Návštěvy se přestanou zapisovat po 20 000 řádcích (aby list nezpomaloval tabulku) – staré řádky smaž.

const SHEETS=['Cena','Odhad ceny'];                       // the only sheets the finance action returns
const KEYS='Přístupy',VISITS='Návštěvy',CONTENT_PROP='OBSAH_KLIC'; // CONTENT_PROP: script property with the content key
const KEYS_HEAD=['Komu','Klíč','Platí do','Plný přehled','Naposledy otevřeno','Počet otevření'];
const VISITS_HEAD=['Čas','Kdo','Návštěvník','Stránka','Zařízení','Systém','Prohlížeč','Obrazovka','Jazyk','Časová zóna','Odkud','Doba (s)','ID'];
const VISIT_FIELDS=['','who','visitor','page','device','os','browser','screen','lang','tz','ref','','id']; // body field per VISITS_HEAD column
const SITE='https://hajeklu.github.io/rodinny-dum/finance.html';
const DAY_CAP=3000,VISITOR_CAP=60,CACHE_TTL=21600,MAX_SECONDS=86400,MIN_KEY=20;
const MAX_VISIT_ROWS=20000,PENDING_TTL=600;               // hard ceiling of the Návštěvy log; how long a duration waits for its visit

// ---- web app ----
function doGet(){return json_({ok:true,service:'dum'})}

function doPost(e){
  try{
    const b=JSON.parse(e&&e.postData&&e.postData.contents||'{}')||{};
    switch(b.action){
      case 'finance':return json_(finance_(b));
      case 'obsah':return json_(content_(b));
      case 'visit':return json_(visit_(b));
      case 'duration':return json_(duration_(b));
      default:return json_({ok:false,error:'action'});
    }
  }catch(err){console.error(err&&err.stack||err);return json_({ok:false,error:'server'})}
}

// A valid key → {ss,tz,now,sh,c,v: values of "Přístupy",r: its row in v}; null = unknown or expired key
function access_(b){
  const key=String(b.key==null?'':b.key).trim();
  if(key.length<MIN_KEY)return null;
  const ss=SpreadsheetApp.getActive(),tz=ss.getSpreadsheetTimeZone(),now=new Date();
  const {sh,c}=sheet_(ss,KEYS,KEYS_HEAD),v=sh.getDataRange().getValues();
  let r=-1;for(let i=1;i<v.length;i++)if(String(v[i][c[1]]).trim()===key){r=i;break}
  if(r<0)return null;
  const until=day_(v[r][c[2]],tz);
  if(until===null||(until&&until<Utilities.formatDate(now,tz,'yyyy-MM-dd')))return null; // valid through the end of that day
  return {ss,tz,now,sh,c,v,r};
}

function finance_(b){
  const a=access_(b);if(!a)return {ok:false,error:'key'};
  const {ss,tz,now,sh,c,v,r}=a;
  const lock=LockService.getScriptLock();                  // usage stats are best effort, never block the data
  if(lock.tryLock(5000))try{
    sh.getRange(r+1,c[4]+1).setValue(now);
    const n=sh.getRange(r+1,c[5]+1);n.setValue((Number(n.getValue())||0)+1);
  }finally{lock.releaseLock()}
  const sheets={};
  for(const name of SHEETS){const s=ss.getSheetByName(name);sheets[name]=s?trim_(s.getDataRange().getValues()).map(row=>row.map(x=>cell_(x,tz))):[]}
  return {ok:true,who:String(v[r][c[0]]).trim(),owner:v[r][c[3]]===true,asOf:Utilities.formatDate(now,tz,"yyyy-MM-dd'T'HH:mm:ssXXX"),tz,sheets};
}

// Encrypted pages (nakup-zdeni.html, see tools/zamek.mjs) get their decryption key for any valid access key.
// Not counted in "Naposledy otevřeno" / "Počet otevření", those stay about finance.html.
function content_(b){
  const a=access_(b);if(!a)return {ok:false,error:'key'};
  const k=PropertiesService.getScriptProperties().getProperty(CONTENT_PROP);
  if(!k)return {ok:false,error:'setup'};
  const row=a.v[a.r];
  return {ok:true,who:String(row[a.c[0]]).trim(),owner:row[a.c[3]]===true,contentKey:k.trim()};
}

function visit_(b){
  const id=clean_(b.id,120),vis=clean_(b.visitor,120);
  return locked_(()=>{
    const ss=SpreadsheetApp.getActive(),cache=CacheService.getScriptCache(),now=new Date();
    const dk='day:'+Utilities.formatDate(now,ss.getSpreadsheetTimeZone(),'yyyyMMdd'),day=Number(cache.get(dk))||0;
    // over a limit: drop silently. A rejected hit re-puts the day counter, so steady traffic cannot outwait its 6 h TTL.
    if(day>=DAY_CAP){cache.put(dk,String(day),CACHE_TTL);return {ok:true}}
    const vk=ck_('vis:',vis),win=JSON.parse(cache.get(vk)||'null')||{n:0,t:now.getTime()};
    if(win.n>=VISITOR_CAP)return {ok:true};
    // the cache caps are soft (entries expire or get evicted); the row ceiling is the real bound of the log
    const {sh,c,w}=sheet_(ss,VISITS,VISITS_HEAD);
    if(sh.getLastRow()>MAX_VISIT_ROWS)return {ok:true};
    cache.put(dk,String(day+1),CACHE_TTL);
    win.n++;cache.put(vk,JSON.stringify(win),Math.max(1,Math.ceil(CACHE_TTL-(now.getTime()-win.t)/1000))); // fixed 6 h window
    const row=new Array(w).fill('');
    VISIT_FIELDS.forEach((f,i)=>{if(f)row[c[i]]=safe_(f==='id'?id:f==='visitor'?vis:clean_(b[f],f==='who'?40:120))});
    row[c[0]]=now;
    const pd=id&&cache.get(ck_('dur:',id));if(pd)row[c[11]]=Number(pd); // a duration that came before this visit
    sh.appendRow(row);
    if(id)cache.put(ck_('row:',id),String(sh.getLastRow()),CACHE_TTL);
    return {ok:true};
  });
}

function duration_(b){
  const id=clean_(b.id,120),s=Math.min(Math.max(0,Math.round(Number(b.seconds)||0)),MAX_SECONDS),who=clean_(b.who,40);
  if(!id)return {ok:true};
  // look the row up under the lock: a duration racing its visit waits for the append and then finds the row
  return locked_(()=>{
    const cache=CacheService.getScriptCache(),r=Number(cache.get(ck_('row:',id)));
    if(!r){cache.put(ck_('dur:',id),String(s),PENDING_TTL);return {ok:true}} // visit not written yet: visit_ takes it from here
    const {sh,c}=sheet_(SpreadsheetApp.getActive(),VISITS,VISITS_HEAD);
    // rows may have been deleted since the visit: write only if the ID on that row still matches
    if(r<=sh.getLastRow()&&String(sh.getRange(r,c[12]+1).getValue()).replace(/^'/,'')===id){
      sh.getRange(r,c[11]+1).setValue(s);
      // finance.html names the visitor only after its visit row went out: fill an empty Kdo, never overwrite one
      const k=sh.getRange(r,c[1]+1);if(who&&String(k.getValue()).trim()==='')k.setValue(safe_(who));
    }
    return {ok:true};
  });
}

// ---- menu ----
function onOpen(){
  SpreadsheetApp.getUi().createMenu('Web domu')
    .addItem('Můj odkaz (plný přehled)…','menuOwnLink')
    .addItem('Nový odkaz pro banku / další osobu…','menuNewLink')
    .addSeparator()
    .addItem('Nastavit výběr kategorií ve sloupci D','menuCategories')
    .addItem('Dopočítat Realitu z evidence','menuRealityFormulas')
    .addToUi();
}

function menuOwnLink(){newLink_('Já',true)}

function menuNewLink(){
  const ui=SpreadsheetApp.getUi(),p=ui.prompt('Nový odkaz','Komu odkaz posíláš? (např. Banka – KB)',ui.ButtonSet.OK_CANCEL);
  if(p.getSelectedButton()!==ui.Button.OK)return;
  const who=p.getResponseText().trim();
  if(!who){ui.alert('Jméno příjemce nesmí být prázdné.');return}
  newLink_(who,false);
}

function newLink_(who,owner){
  const ui=SpreadsheetApp.getUi(),p=ui.prompt('Platnost odkazu','Počet dní platnosti (prázdné = bez omezení):',ui.ButtonSet.OK_CANCEL);
  if(p.getSelectedButton()!==ui.Button.OK)return;
  const t=p.getResponseText().trim(),days=Number(t);
  if(t&&!(Number.isInteger(days)&&days>=0&&days<=3650)){ui.alert('Počet dní musí být celé číslo 0–3650 (0 = jen dnes).');return}
  const until=t?new Date(Date.now()+days*864e5):'';
  const key=(Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,'').slice(0,32);
  const ss=SpreadsheetApp.getActive(),tz=ss.getSpreadsheetTimeZone();
  locked_(()=>{
    const {sh,c,w}=sheet_(ss,KEYS,KEYS_HEAD),r=sh.getLastRow()+1,row=new Array(w).fill('');
    row[c[0]]=safe_(who);row[c[1]]=key;row[c[2]]=until;row[c[5]]=0;
    if(r>sh.getMaxRows())sh.insertRowsAfter(sh.getMaxRows(),10);
    sh.getRange(r,c[1]+1).setNumberFormat('@');             // keep the key a text, never a number/date
    sh.getRange(r,1,1,w).setValues([row]);
    if(until)sh.getRange(r,c[2]+1).setNumberFormat('d. m. yyyy');
    sh.getRange(r,c[3]+1).insertCheckboxes().setValue(owner);
  });
  // ?od=ja (before the hash, or it would end up in the key) marks the owner's browser for navstevy.js, so it is never logged
  ui.alert(owner?'Můj odkaz (plný přehled)':'Odkaz pro: '+who,
    `${SITE}${owner?'?od=ja':''}#k=${key}\n\n`+(until?`Platí do ${Utilities.formatDate(until,tz,'d. M. yyyy')} včetně.`:'Platí bez omezení.')+
    '\nZrušení: smaž řádek v listu Přístupy.',ui.ButtonSet.OK);
}

function menuCategories(){
  const ui=SpreadsheetApp.getUi(),ss=SpreadsheetApp.getActive(),names=sections_(ss).map(s=>s.name);
  if(!names.length){ui.alert(`V listu „${SHEETS[1]}“ jsem nenašel oddíly (řádky s číslem ve sloupci #).`);return}
  const sh=ss.getSheetByName(SHEETS[0]);
  if(!sh){ui.alert(`Chybí list „${SHEETS[0]}“.`);return}
  const h=findHead_(sh.getRange(1,1,Math.min(5,Math.max(1,sh.getLastRow())),Math.max(1,sh.getLastColumn())).getValues(),{cat:/^kategorie/});
  let col=4,top=1;                                         // default: column D, header in row 1
  if(h){col=h.cat+1;top=h.row+1}
  else{const d1=sh.getRange(1,4);
    if(d1.getValue()!==''){ui.alert(`Buňka D1 v listu „${SHEETS[0]}“ už obsahuje „${d1.getValue()}“. Uvolni ji, nebo nadepiš sloupec s kategoriemi „Kategorie“.`);return}
    d1.setValue('Kategorie').setFontWeight('bold')}
  if(sh.getMaxRows()<=top)sh.insertRowsAfter(top,100);
  const rule=SpreadsheetApp.newDataValidation().requireValueInList(names,true).setAllowInvalid(true).build();
  sh.getRange(top+1,col,sh.getMaxRows()-top,1).setDataValidation(rule);
  ui.alert('Hotovo',`Ve sloupci ${col_(col-1)} listu „${SHEETS[0]}“ je teď výběr z ${names.length} oddílů rozpočtu. Jiná hodnota je povolená, jen se označí.`,ui.ButtonSet.OK);
}

function menuRealityFormulas(){
  const ui=SpreadsheetApp.getUi(),ss=SpreadsheetApp.getActive(),bs=ss.getSheetByName(SHEETS[1]),cs=ss.getSheetByName(SHEETS[0]);
  if(!bs||!cs){ui.alert(`Chybí list „${bs?SHEETS[0]:SHEETS[1]}“.`);return}
  const bh=findHead_(bs.getDataRange().getValues(),{num:/^#$/,name:/^polozka/,real:/^realita/});
  const ch=findHead_(cs.getDataRange().getValues(),{amt:/^(cena|castka)/,cat:/^kategorie/});
  if(!bh){ui.alert(`V listu „${SHEETS[1]}“ jsem nenašel hlavičku se sloupci #, Položka a Realita.`);return}
  if(!ch){ui.alert(`V listu „${SHEETS[0]}“ chybí sloupec Kategorie (nebo Cena). Nejdřív použij „Nastavit výběr kategorií ve sloupci D“.`);return}
  const rows=sections_(ss).map(s=>s.row);
  if(!rows.length){ui.alert(`V listu „${SHEETS[1]}“ jsem nenašel oddíly (řádky s číslem ve sloupci #).`);return}
  const ok=ui.alert('Dopočítat Realitu z evidence',`Do sloupce Realita u ${rows.length} oddílů vložím vzorec SUMIF, který sečte platby z listu „${SHEETS[0]}“ podle sloupce Kategorie. Ručně psané hodnoty Reality se přepíšou. Pokračovat?`,ui.ButtonSet.YES_NO);
  if(ok!==ui.Button.YES)return;
  const src=q_(SHEETS[0]),cat=col_(ch.cat),amt=col_(ch.amt),name=col_(bh.name);
  // setFormula always takes the English syntax (comma separators), whatever the spreadsheet locale
  for(const r of rows)bs.getRange(r,bh.real+1).setFormula(`=SUMIF(${src}!$${cat}:$${cat},$${name}${r},${src}!$${amt}:$${amt})`);
  ui.alert('Hotovo',`Realita se teď počítá z evidence u ${rows.length} oddílů.`,ui.ButtonSet.OK);
}

// ---- helpers ----
const json_=o=>ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);

function locked_(fn){const l=LockService.getScriptLock();l.waitLock(10000);try{return fn()}finally{l.releaseLock()}}

// Sheet by name, created on demand with a bold frozen header; missing header columns are appended.
// A new sheet keeps only the header columns (26 by default), so every logged row costs half the cells.
// Returns {sh, c: column index (0-based) per head item, w: header width}.
function sheet_(ss,name,head){
  const old=ss.getSheetByName(name),sh=old||ss.insertSheet(name),last=sh.getLastColumn();
  const top=last?sh.getRange(1,1,1,last).getValues()[0].map(norm_):[],c=[],miss=[];
  let w=last;
  for(const h of head){let i=top.indexOf(norm_(h));if(i<0){i=w++;miss.push(h)}c.push(i)}
  if(miss.length){
    if(w>sh.getMaxColumns())sh.insertColumnsAfter(sh.getMaxColumns(),w-sh.getMaxColumns());
    sh.getRange(1,last+1,1,miss.length).setValues([miss]);sh.getRange(1,1,1,w).setFontWeight('bold');sh.setFrozenRows(1)}
  if(!old&&sh.getMaxColumns()>w)sh.deleteColumns(w+1,sh.getMaxColumns()-w);
  return {sh,c,w};
}

// Budget sections: rows of "Odhad ceny" with a numeric # → {row (1-based), name}
function sections_(ss){
  const sh=ss.getSheetByName(SHEETS[1]);if(!sh)return [];
  const v=sh.getDataRange().getValues(),h=findHead_(v,{num:/^#$/,name:/^polozka/});if(!h)return [];
  const out=[];
  for(let i=h.row+1;i<v.length;i++){const n=v[i][h.num],t=String(v[i][h.name]).trim();
    if(t&&(typeof n==='number'||/^\d+$/.test(String(n).trim())))out.push({row:i+1,name:t})}
  return out;
}

// Header row within the first 5 rows: every spec regex must match some (normalized) cell → {row, <name>: col}
function findHead_(v,spec){
  for(let r=0;r<Math.min(5,v.length);r++){
    const row=v[r].map(norm_),o={row:r};
    for(const k in spec)o[k]=row.findIndex(x=>spec[k].test(x));
    if(Object.keys(spec).every(k=>o[k]>=0))return o;
  }
  return null;
}

// Drop trailing empty rows and columns
function trim_(v){
  const empty=x=>x===''||x==null;
  let rows=v.length;while(rows&&v[rows-1].every(empty))rows--;
  let cols=0;for(let i=0;i<rows;i++)for(let j=v[i].length-1;j>=cols;j--)if(!empty(v[i][j])){cols=j+1;break}
  return v.slice(0,rows).map(r=>r.slice(0,cols));
}

// Cell → JSON value; dates as yyyy-MM-dd (or yyyy-MM-dd HH:mm) in the spreadsheet time zone
function cell_(x,tz){
  if(Object.prototype.toString.call(x)==='[object Date]'){
    if(isNaN(x.getTime()))return '';
    return Utilities.formatDate(x,tz,Utilities.formatDate(x,tz,'HH:mm:ss')==='00:00:00'?'yyyy-MM-dd':'yyyy-MM-dd HH:mm');
  }
  return x==null?'':x;
}

// "Platí do" → '' (no limit) | 'yyyy-MM-dd' | null (unreadable → treat as expired)
function day_(x,tz){
  if(x===''||x==null)return '';
  if(Object.prototype.toString.call(x)==='[object Date]')return isNaN(x.getTime())?null:Utilities.formatDate(x,tz,'yyyy-MM-dd');
  const s=String(x).trim();let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)||s.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
  if(!m)return null;
  const [y,mo,d]=m[1].length===4?[m[1],m[2],m[3]]:[m[3],m[2],m[1]];
  return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
}

// String, no control characters, clipped
const clean_=(v,max)=>String(v==null?'':v).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g,'').trim().slice(0,max);
// Neutralize formulas: a leading = + - @ or tab would make appendRow store a formula (e.g. IMPORTXML exfiltrating data)
const safe_=s=>/^[=+\-@\t]/.test(s)?"'"+s:s;
// Cache key; hash anything that is not a short plain token (keys are limited to 250 bytes)
const ck_=(p,s)=>p+(/^[\w.-]{1,100}$/.test(s)?s:Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8)));
const norm_=s=>String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const col_=i=>{let s='';for(i++;i>0;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s}; // 0 → A
const q_=n=>/^[A-Za-z_]\w*$/.test(n)?n:"'"+n.replace(/'/g,"''")+"'";
