// Shared navigation for every page of the project: one "Podklady" menu instead of a row of buttons.
// The 3D model (index.html) is the public face; the menu shows up there only in a browser that has
// opened the site once with #podklady in the address, or has visited any of the documents.
(function(){
  'use strict';
  const GROUPS=[
    {name:'Stavba',pages:[['pudorys-1np','Půdorys 1NP'],['pudorys-2np','Půdorys 2NP'],['zalozeni-zdiva','První řada zdiva'],['nakup-zdeni','Nákup na zdění'],['rez-vyska','Výškový řez'],['krov','Krov']]},
    {name:'Instalace',pages:[['kanalizace','Kanalizace'],['vytapeni','Topení'],['voda','Voda'],['rekuperace','Rekuperace'],['elektro','Elektro']]},
    {name:'Peníze',pages:[['finance','Financování stavby']]}
  ];
  const KEY='hajek-podklady';
  const nav=document.querySelector('nav[data-nav]');
  if(!nav)return;
  const cur=nav.dataset.nav||'index';
  const store=(v)=>{try{v===null?localStorage.removeItem(KEY):localStorage.setItem(KEY,v)}catch(e){}};
  const read=()=>{try{return localStorage.getItem(KEY)==='1'}catch(e){return false}};
  if(/podklady/.test(location.hash)||/[?&]podklady\b/.test(location.search)||cur!=='index')store('1');
  const unlocked=cur!=='index'||read()||/podklady/.test(location.hash);

  const css=`.hnav{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.hnav a.hnav-home,.hnav summary{display:inline-flex;align-items:center;gap:6px;text-decoration:none;border:1px solid #cad6cc;background:#fff;color:#284638;border-radius:8px;padding:9px 12px;font:13px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;list-style:none;white-space:nowrap}
.hnav a.hnav-home:hover,.hnav summary:hover{background:#eef4ef}
.hnav summary::-webkit-details-marker{display:none}.hnav summary::after{content:"";width:7px;height:7px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:translateY(-2px) rotate(45deg);margin-left:2px}
.hnav details{position:relative}.hnav details[open] summary{background:#264b39;border-color:#264b39;color:#fff}
.hnav-panel{position:absolute;right:0;top:calc(100% + 6px);z-index:1000;background:#fff;border:1px solid #d8dfd9;border-radius:12px;box-shadow:0 14px 34px #1b352330;padding:8px;min-width:230px;display:grid;gap:6px}
.hnav-panel b{display:block;font:700 10.5px/1.2 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#64766b;margin:8px 8px 4px}
.hnav-panel a{display:block;padding:8px 10px;border-radius:7px;color:#26352f;text-decoration:none;font:14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif}
.hnav-panel a:hover{background:#eef4ef}.hnav-panel a[aria-current=page]{background:#264b39;color:#fff}
.hnav-panel button{font:12px system-ui,sans-serif;color:#738078;background:none;border:0;border-top:1px solid #e4e9e5;margin-top:4px;padding:8px 10px 4px;text-align:left;cursor:pointer}
@media(max-width:520px){.hnav-panel{right:auto;left:0}}
@media print{.hnav{display:none!important}}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  nav.classList.add('hnav');nav.setAttribute('aria-label','Stránky projektu');nav.replaceChildren();
  if(cur!=='index'){const a=document.createElement('a');a.className='hnav-home';a.href='./index.html';a.textContent='3D model';nav.appendChild(a)}
  if(!unlocked){nav.hidden=true;return}
  const det=document.createElement('details'),sum=document.createElement('summary'),panel=document.createElement('div');
  sum.textContent='Podklady';panel.className='hnav-panel';
  for(const g of GROUPS){const b=document.createElement('b');b.textContent=g.name;panel.appendChild(b);
    for(const [id,label] of g.pages){const a=document.createElement('a');a.href=`./${id}.html`;a.textContent=label;if(id===cur)a.setAttribute('aria-current','page');panel.appendChild(a)}}
  if(cur==='index'){const hide=document.createElement('button');hide.type='button';hide.textContent='Skrýt podklady v tomto prohlížeči';hide.addEventListener('click',()=>{store(null);nav.hidden=true});panel.appendChild(hide)}
  det.append(sum,panel);nav.appendChild(det);
  document.addEventListener('click',e=>{if(det.open&&!det.contains(e.target))det.open=false});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')det.open=false});
})();
