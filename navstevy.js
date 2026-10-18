// Anonymous visit log shared by every page: one row per page view in the "Návštěvy" sheet of the builder's
// Google Sheet, sent to the Apps Script web app (apps-script/Code.gs) and later updated with the seconds the page
// was actually visible. No cookies; a random id in localStorage only ties together the views of one browser.
// A shared link may carry ?od=<name> (e.g. ?od=banka) to label the browser; ?od=ja marks the owner's own browser,
// which is never logged (with site data blocked, only that view itself is skipped). Rows are written only from
// *.github.io, so local testing never touches the real sheet, unless the page sets window.DUM_TEST=true before this
// script loads.
(function(){
  'use strict';
  const API=''; // web app URL ending in /exec (Nasadit → Webová aplikace); empty = nothing is logged and finance.html stays offline
  window.DUM_API=window.DUM_API||API;
  const api=window.DUM_API,nav=navigator,ua=String(nav.userAgent||''),uad=nav.userAgentData;
  const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
  const put=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
  const clean=(v,n)=>String(v==null?'':v).normalize('NFC').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,n);
  const rnd=n=>{const A='abcdefghijkmnpqrstuvwxyz23456789',b=new Uint8Array(n);
    try{crypto.getRandomValues(b)}catch(e){for(let i=0;i<n;i++)b[i]=Math.random()*256}return Array.from(b,x=>A[x&31]).join('')};
  let off=false,tag='';
  // finance.html labels the browser with the name its access key was issued to (an existing label wins). The visit
  // row has usually gone out by then without a name, so the durations of this view carry it (tag) and the server
  // fills the empty Kdo cell. owner=true (optional, a full-access key) marks the browser as the owner's, like ?od=ja;
  // a view whose visit already went out stays logged, so the owner opens the site once with ?od=ja first
  window.dumNavstevy={label(name,owner){if(owner===true){put('dum-ja','1');off=true;return}
    const v=clean(name,40),had=get('dum-kdo');if(v&&!had)put('dum-kdo',v);tag=clean(had||v,40)}};

  // ?od=<label> from a shared link: remember it for this browser and drop it from the address, keeping the rest
  let od=null;try{od=new URLSearchParams(location.search).get('od')}catch(e){}
  if(od!==null){const v=clean(od,40);
    if(/^j[aá]$/i.test(v)){put('dum-ja','1');off=true}else if(v)put('dum-kdo',v);
    const isOd=p=>{try{return decodeURIComponent(p.split('=')[0].replace(/\+/g,' '))==='od'}catch(e){return false}};
    try{const q=location.search.slice(1).split('&').filter(p=>p&&!isOd(p)).join('&');history.replaceState(history.state,'',location.pathname+(q?'?'+q:'')+location.hash)}catch(e){}}

  const bot=nav.webdriver===true||/bot\/|crawl|spider|slurp|headless|lighthouse/i.test(ua);
  if(!api||off||get('dum-ja')==='1'||!(window.DUM_TEST===true||!bot&&/\.github\.io$/i.test(location.hostname)))return;
  let visitor=get('dum-navstevnik');if(!/^[a-z0-9]{12}$/.test(visitor||'')){visitor=rnd(12);put('dum-navstevnik',visitor)}
  const id=rnd(16);

  const v2=(a,b)=>a+(b&&+b?'.'+b:''); // "17","5" → 17.5; "26","0" → 26
  const touchMac=/Macintosh/.test(ua)&&nav.maxTouchPoints>1; // iPadOS asks for desktop sites with a Mac user agent
  const device=uad&&uad.mobile?'mobil':/iPad/.test(ua)||touchMac||/Android/.test(ua)&&!/Mobile/.test(ua)||/Tablet(?! PC)/.test(ua)?'tablet'
    :/iPhone|iPod|Mobi/.test(ua)?'mobil':'počítač';
  const osOf=()=>{let m;
    if(m=ua.match(/(iPhone|iPad|iPod).*? OS (\d+)(?:_(\d+))?/)){
      // iOS 26 freezes "OS 18_6" in the user agent; Safari's Version/ and Facebook's FBSV/ still carry the real one
      const s=ua.match(/(?:Version|FBSV)\/(\d+)(?:\.(\d+))?/);
      return(m[1]==='iPad'?'iPadOS ':'iOS ')+(s&&+s[1]>+m[2]?v2(s[1],s[2]):v2(m[2],m[3]))}
    if(touchMac)return'iPadOS'+((m=ua.match(/Version\/(\d+)(?:\.(\d+))?/))?' '+v2(m[1],m[2]):'');
    if(m=ua.match(/Android (\d+)/))return'Android '+m[1];
    if(/CrOS/.test(ua))return'ChromeOS';
    if(m=ua.match(/Windows NT (\d+\.\d+)/))return{'10.0':'Windows 10/11','6.3':'Windows 8.1','6.2':'Windows 8','6.1':'Windows 7'}[m[1]]||'Windows';
    if(m=ua.match(/Mac OS X (\d+)[_.](\d+)/))return m[1]==='10'&&+m[2]<15?'macOS 10.'+m[2]:'macOS'; // every browser freezes 10.15
    if(/Linux/.test(ua))return'Linux';
    return clean(uad&&uad.platform,40)||'jiný'};
  const APPS=[['Messenger',/FBAN\/Messenger|FB_IAB\/(?:MESSENGER|Orca)|Orca-Android/i],['Facebook',/FBAN\/|FBAV\/|FB_IAB\//],['Instagram',/Instagram/],
    ['WhatsApp',/WhatsApp/i],['TikTok',/musical_ly|BytedanceWebview|TikTok/i],['LinkedIn',/LinkedInApp/],['Google app',/ GSA\//]];
  const BROWSERS=[['Edge',/Edg(?:e|A|iOS)?\/(\d+)/],['Opera',/(?:OPR|OPiOS|OPT)\/(\d+)/],['Samsung Internet',/SamsungBrowser\/(\d+)/],['Seznam',/SznProhlizec\/(\d+)/],
    ['Vivaldi',/Vivaldi\/(\d+)/],['Firefox',/(?:Firefox|FxiOS)\/(\d+)/],['WebView',/; wv\).*?Chrome\/(\d+)/],['Chrome',/(?:Chrome|CriOS)\/(\d+)/],['Safari',/Version\/(\d+).*Safari\//]];
  const browserOf=()=>{for(const[n,re]of APPS)if(re.test(ua))return n;
    for(let[n,re]of BROWSERS){const m=ua.match(re);if(!m)continue;
      if(n==='Chrome'&&(nav.brave||(uad&&uad.brands||[]).some(b=>/Brave/.test(b.brand))))n='Brave';return n+' '+m[1]}
    return/AppleWebKit/.test(ua)?'WebView':'jiný'};
  const pageOf=p=>{let f=String(p||'').split('/').pop();try{f=decodeURIComponent(f)}catch(e){}return f.replace(/\.html?$/i,'')||'index'};
  const refOf=()=>{const r=document.referrer;if(!r)return'přímo';
    try{const u=new URL(r);return u.hostname===location.hostname?'web: '+pageOf(u.pathname):u.hostname||u.protocol.replace(/:$/,'')}catch(e){return r}};
  let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
  const navEl=document.querySelector('nav[data-nav]'),sc=window.screen||{};
  const info={action:'visit',id,visitor,who:get('dum-kdo')||'',page:navEl&&navEl.dataset.nav||pageOf(location.pathname),device,os:osOf(),browser:browserOf(),
    screen:`${sc.width}×${sc.height} @${+(window.devicePixelRatio||1).toFixed(2)}x`,lang:nav.language||'',tz,ref:refOf()};

  // a string body goes out as text/plain, so the cross-origin POST needs no preflight
  const send=o=>{if(off)return;const body=JSON.stringify(o);
    try{if(nav.sendBeacon&&nav.sendBeacon(api,body))return}catch(e){}
    try{fetch(api,{method:'POST',body,keepalive:true,mode:'no-cors'}).catch(()=>{})}catch(e){}};
  let sent=false;
  const visit=()=>{if(sent)return;sent=true;if(!info.who)info.who=tag;for(const k in info)info[k]=clean(info[k],k==='who'?40:120);send(info)};
  // Chromium keeps the real Android, Windows 10/11 and macOS versions in client hints; wait for them briefly
  let hints=null;try{hints=uad&&uad.getHighEntropyValues&&uad.getHighEntropyValues(['platformVersion'])}catch(e){}
  Promise.race([Promise.resolve(hints).then(h=>{if(!h||sent)return;const[a,b]=String(h.platformVersion||'').split('.'),M=+a;if(!a||isNaN(M))return;
      if(h.platform==='Windows'&&info.os==='Windows 10/11')info.os=M>=13?'Windows 11':M>0?'Windows 10':info.os;
      else if(h.platform==='macOS'&&M>=10)info.os='macOS '+v2(a,b);else if(h.platform==='Android'&&M)info.os='Android '+M}),
    new Promise(r=>setTimeout(r,500))]).catch(()=>{}).then(visit);

  // time on the page counts only while it is visible; every hide sends the running total, which overwrites the last one.
  // A label that came after the visit rides along (who) and is sent again even when the total has not changed
  let acc=0,since=document.visibilityState==='hidden'?null:Date.now(),last=0,told='';
  const flush=()=>{if(since!==null){acc+=Date.now()-since;since=null}visit();const s=Math.round(acc/1000),who=info.who?'':tag;
    if(s>=1&&(s!==last||who!==told)){last=s;told=who;send(who?{action:'duration',id,seconds:s,who}:{action:'duration',id,seconds:s})}};
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();else if(since===null)since=Date.now()});
  window.addEventListener('pagehide',flush);
  window.addEventListener('pageshow',e=>{if(e.persisted&&document.visibilityState!=='hidden'&&since===null)since=Date.now()});
})();
