// Electrical installation shared by the 3D model (index.html, toggle "Elektro") and the page elektro.html.
// Coordinates are the 3D model's pre-mirror space: x across the house (0.3 = inner face of the kitchen/driveway-side wall, 7.7 = inner face
// of the HS/terrace-side wall), z along it (0.3 = inner face of the front gable), y up with the ground floor finished floor at +0.24, the attic
// floor at +3.30 and the flat attic ceiling at +5.90. schema.js uses the same plan [z, x] with heights from ±0, so the page subtracts 0.24.
//
// Concept (stav 10/2026): the main feeder from the meter pillar already ends in the plant room 1.02, so the main board HR is there (TČ,
// back-up heater, MVHR, outdoor circuits, gate, ČOV, retention pump, a wallbox spare) and feeds the house board RD in the hall 1.03 (behind
// the seat niche, next to R1 and the SLP, where DSP had the main board). From RD every room gets its own cables (a star per room): lighting
// in two separate systems, mains lights (230 V, relays and dimmers on DIN rails in RD) and night / orientation lights (24 V from two power
// supplies with a battery backup), sockets in radial circuits per room group, own circuits for appliances, one cable per blind motor.
// Routes: "up" for lights and blinds (attic: above the flat ceiling, ground floor: in the attic floor build-up and down through a panel
// core, or in the dropped ceilings), "down" for sockets and appliances (in the floor insulation in conduits, then up the wall).
(function(){
'use strict';
const Y0=.24,Y1=2.9,PY=2.64,U0=3.3,Uc=5.9;
// Route heights: gF ground-floor floor build-up, gC attic floor build-up (feeds the ground-floor ceiling), aF attic floor, aC above the flat
// attic ceiling, tC under the plant-room ceiling, oP in the passage soffit. Outdoor ground routes are plan polylines on the terrain.
const H={Y0,Y1,PY,U0,Uc,gF:Y0+.015,gC:3.19,aF:U0+.015,aC:Uc+.07,tC:2.78,oP:2.88};

const CAT={
 feed:{c:'#1f2427',t:'Napáječ HR → RD (CYKY-J 5×10)'},
 done:{c:'#8b948f',t:'Hotovo: přívod z pilíře, HDO, brána'},
 light:{c:'#f0b400',t:'Hlavní světlo 230 V'},
 night:{c:'#7a4fd6',t:'Noční a orientační světlo 24 V'},
 sock:{c:'#e03131',t:'Zásuvky'},
 appl:{c:'#c2188b',t:'Spotřebiče (vlastní okruh)'},
 blind:{c:'#2f9e44',t:'Žaluzie a střešní okna'},
 tech:{c:'#7a4b2a',t:'Technika (TČ, VZT, regulace)'},
 out:{c:'#0c9bb0',t:'Venku (světla, zásuvky, ČOV)'},
 ctl:{c:'#4c8fd6',t:'Tlačítka a čidla (Cat6 do RD/SLP)'},
 trunk:{c:'#5b6460',t:'Svazek kabelů / chráničky'}};

// Boards. box: [x0,x1,y0,y1,z0,z1].
const BOARDS=[
 {id:'HR',t:'Hlavní rozvaděč HR',where:'technická místnost 1.02, stěna k průjezdu',box:[2.5,3.3,1.04,2.24,16.5,16.65],
  note:'Nástěnný, 4 řady × 24 modulů. Hlavní vypínač, svodiče přepětí T1+T2, relé HDO, jističe TČ, záložního ohřevu, rekuperace, technické místnosti a venkovních okruhů, napáječ RD.'},
 {id:'RD',t:'Rozvaděč domu RD',where:'předsíň 1.03, za zadní stěnou sedací niky (servisní dvířka)',box:[2.59,2.74,.7,2.1,10.98,11.62],
  note:'Na příčce ke komoře vedle R1, 6 řad × 24 modulů: chrániče a jističe s chráničem, relé a stmívače světel, ovladače žaluzií, dva zdroje 24 V s bateriovou zálohou, moduly ESPHome pro tlačítka a čidla.'},
 {id:'SLP',t:'Slaboproud SLP',where:'předsíň 1.03, vestavěná skříň nad R1',box:[2.6,2.9,1.55,2.55,10.05,10.9],
  note:'Router, switch s PoE, mini-PC s Home Assistantem, UPS. Sem vede Cat6 z tlačítek, čidel, TČ, rekuperace a tabla u branky.'}];

// Circuits: board, category, breaker, cable, description. Lighting is two systems: L (mains) and N (24 V night lights).
const CIRCUITS=[
 // ---- RD, mains lights (relays and dimmers in RD, push-buttons on Cat6)
 {id:'L1',b:'RD',cat:'light',brk:'B10',cab:'CYKY-J 5×1,5 do místnosti (3 spínané vývody)',t:'Světla přízemí · obývák, jídelna, kuchyň',
  n:'Bodovky v pásu u TV a u HS, římsy (zdroj 24 V v podhledu), mechové svítidlo, lamelová stěna, vajíčko, Sofian nad stolem, vitrína, bodovky a LED nad linkou, koule a římsa nad ostrůvkem.'},
 {id:'L2',b:'RD',cat:'light',brk:'B10',cab:'CYKY-J 5×1,5',t:'Světla přízemí · předsíň, chodba, schodiště, koupelna, WC, komora',n:'Bodovky v podhledech 2,40 m, nika v předsíni, nástěnné nad schody, zrcadlo a nika nad vanou.'},
 {id:'L3',b:'RD',cat:'light',brk:'B10',cab:'CYKY-J 5×1,5',t:'Světla podkroví · ložnice, šatna, koupelna u ložnice, pokoje 2.04 a 2.08, šatna 2.09',n:'Strop, nástěnná u postele, LED nad lamelami, zrcadlo.'},
 {id:'L4',b:'RD',cat:'light',brk:'B10',cab:'CYKY-J 3×1,5',t:'Světla podkroví · chodba, podesta, prádelna, WC, koupelna 2.07',n:'Bodovky v chodbě, zrcadlo v koupelně.'},
 // ---- RD, night lights 24 V (SELV)
 {id:'N1',b:'RD',cat:'night',brk:'B6',cab:'2×1,5 (24 V), dvoubarevný pásek 3×1,5',t:'Noční světlo přízemí · zdroj 24 V + stmívač ESPHome',
  n:'Světla ve stěně 30 cm nad podlahou v chodbě a předsíni, LED pod schody, soklem linky a ostrůvku, stolkem TV, květináčem, komodou, v liště vajíčka, pod umyvadlem a WC.'},
 {id:'N2',b:'RD',cat:'night',brk:'B6',cab:'2×1,5 (24 V)',t:'Noční světlo podkroví · zdroj 24 V + stmívač ESPHome',
  n:'Světla ve stěnách chodby a ložnice, LED pod postelí, pod umyvadly a WC, příprava pod postelemi v pokojích.'},
 // ---- RD, sockets
 {id:'Z1',b:'RD',cat:'sock',brk:'B16 s chráničem',cab:'CYKY-J 3×2,5',t:'Zásuvky · obývák a jídelna'},
 {id:'Z2',b:'RD',cat:'sock',brk:'B16 s chráničem',cab:'CYKY-J 3×2,5',t:'Zásuvky · kuchyňská linka'},
 {id:'Z3',b:'RD',cat:'sock',brk:'B16 s chráničem',cab:'CYKY-J 3×2,5',t:'Zásuvky · ostrůvek a digestoř'},
 {id:'Z4',b:'RD',cat:'sock',brk:'B16 s chráničem',cab:'CYKY-J 3×2,5',t:'Zásuvky · předsíň, chodba, komora, koupelna 1.05'},
 {id:'Z5',b:'RD',cat:'sock',brk:'B16 s chráničem',cab:'CYKY-J 3×2,5',t:'Zásuvky · ložnice a koupelna u ložnice'},
 {id:'Z6',b:'RD',cat:'sock',brk:'B16 s chráničem',cab:'CYKY-J 3×2,5',t:'Zásuvky · pokoje 2.04, 2.08 a šatna 2.09'},
 {id:'Z7',b:'RD',cat:'sock',brk:'B16 s chráničem',cab:'CYKY-J 3×2,5',t:'Zásuvky · chodba podkroví, prádelna, koupelna 2.07'},
 // ---- RD, appliances
 {id:'S1',b:'RD',cat:'appl',brk:'B16/3 s chráničem',cab:'CYKY-J 5×2,5',t:'Varná deska 400 V (ostrůvek)'},
 {id:'S2',b:'RD',cat:'appl',brk:'B16 s chráničem',cab:'CYKY-J 3×2,5',t:'Trouba (ostrůvek)'},
 {id:'S3',b:'RD',cat:'appl',brk:'B16 s chráničem',cab:'CYKY-J 3×2,5',t:'Myčka'},
 {id:'S4',b:'RD',cat:'appl',brk:'B16, vlastní chránič (RCBO)',cab:'CYKY-J 3×2,5',t:'Lednice a mrazák v komoře',n:'Vlastní chránič, aby je nevypnula porucha jinde.'},
 {id:'S5',b:'RD',cat:'appl',brk:'B16 s chráničem',cab:'CYKY-J 3×2,5',t:'Pračka (prádelna 2.05)'},
 {id:'S6',b:'RD',cat:'appl',brk:'B16 s chráničem',cab:'CYKY-J 3×2,5',t:'Sušička (prádelna 2.05)'},
 {id:'S7',b:'RD',cat:'appl',brk:'B10 s chráničem',cab:'CYKY-J 3×1,5',t:'Elektrické žebříky v koupelnách (3×, přes relé)'},
 // ---- RD, blinds
 {id:'Ž1',b:'RD',cat:'blind',brk:'B10',cab:'CYKY-J 4×1,5 ke každému motoru',t:'Žaluzie přízemí · HS, fix, okno obýváku a kuchyně'},
 {id:'Ž2',b:'RD',cat:'blind',brk:'B10',cab:'CYKY-J 4×1,5',t:'Žaluzie podkroví · balkonové dveře ložnice, okna pokoje 2.08, rezerva ke střešním oknům'},
 // ---- RD, technology
 {id:'T1',b:'RD',cat:'tech',brk:'B10',cab:'CYKY-J 3×1,5',t:'Regulátory R1 a R2, kazetový fancoil'},
 {id:'T2',b:'RD',cat:'tech',brk:'B10, vlastní chránič (RCBO)',cab:'CYKY-J 3×2,5',t:'SLP (router, switch, Home Assistant, UPS)'},
 // ---- HR
 {id:'H1',b:'HR',cat:'feed',brk:'B25/3',cab:'CYKY-J 5×10',t:'Napáječ rozvaděče domu RD',n:'Přes E1 do skříně pokoje 2.08, nad stropem podkroví a stoupačkou E2 do předsíně.'},
 {id:'H2',b:'HR',cat:'tech',brk:'B16/3',cab:'CYKY-J 5×2,5',t:'Tepelné čerpadlo · venkovní jednotka'},
 {id:'H3',b:'HR',cat:'tech',brk:'B16/3, blokuje HDO',cab:'CYKY-J 5×2,5',t:'Záložní ohřev 9 kW'},
 {id:'H4',b:'HR',cat:'tech',brk:'B10',cab:'CYKY-J 3×1,5',t:'Rekuperační jednotka'},
 {id:'H5',b:'HR',cat:'tech',brk:'B10 s chráničem',cab:'CYKY-J 3×1,5 / 3×2,5',t:'Technická místnost · světla, zásuvky, ESP32, cirkulační čerpadlo'},
 {id:'V1',b:'HR',cat:'out',brk:'B10 s chráničem',cab:'CYKY-J 3×1,5',t:'Venkovní světla · průjezd'},
 {id:'V2',b:'HR',cat:'out',brk:'B10 s chráničem',cab:'CYKY-J 3×1,5 v zemi',t:'Venkovní světla · příjezdovka, terasa, schody do zahrady'},
 {id:'V3',b:'HR',cat:'out',brk:'B16 s chráničem',cab:'CYKY-J 3×2,5',t:'Venkovní zásuvky · průjezd a terasa'},
 {id:'V4',b:'HR',cat:'done',brk:'B16 s chráničem',cab:'CYKY-J 5×2,5',t:'Pohon brány (natažené)'},
 {id:'V5',b:'HR',cat:'out',brk:'B16 s chráničem',cab:'CYKY-J 5×2,5',t:'ČOV (rozvaděč ČOV na štítu)'},
 {id:'V6',b:'HR',cat:'out',brk:'B16 s chráničem',cab:'CYKY-J 5×2,5',t:'Čerpadlo retenční nádrže'},
 {id:'V7',b:'HR',cat:'out',brk:'(zatím bez jističe)',cab:'CYKY-J 5×6',t:'Wallbox v průjezdu · jen kabel na později'}];

// Trunks (bundles of cables in conduits). 3D polylines; ground:true are plan polylines on the terrain (outdoor trenches).
const T=(y,p)=>p.map(([x,z])=>[x,y,z]);
const TRUNKS=[
 // risers and connectors
 {id:'E2',fl:'g',pts:[[2.66,2.1,11.25],[2.66,2.75,11.25],[2.95,2.75,11.3],[2.95,H.aC,11.3]],t:'stoupačka E2: z RD do podkroví (skříň v předsíni, vývrt stropem, roh skříně pokoje 2.04)'},
 {id:'gF0',fl:'g',pts:[[2.66,.7,11.3],[2.66,H.gF,11.3]]},
 // ground floor: floor build-up from RD, attic floor build-up for the ceiling
 {id:'gF',fl:'g',mode:'f',pts:T(H.gF,[[2.66,11.3],[3.85,11.3],[3.85,1.2]])},
 {id:'gF',fl:'g',mode:'f',pts:T(H.gF,[[3.85,9.35],[5.6,9.35]])},
 {id:'gF',fl:'g',mode:'f',pts:T(H.gF,[[3.85,7.05],[1.0,7.05]])},
 {id:'gF',fl:'g',mode:'f',pts:T(H.gF,[[2.66,11.3],[1.3,11.3]])},
 {id:'gC',fl:'g',mode:'c',pts:T(H.gC,[[2.95,11.3],[3.5,11.3],[3.5,.8]])},
 {id:'gC',fl:'g',mode:'c',pts:T(H.gC,[[3.5,10.0],[6.4,10.0]])},
 // attic: floor and above the flat ceiling (warm space under the ridge)
 {id:'aF',fl:'a',mode:'f',pts:T(H.aF,[[2.95,11.3],[4.05,11.3]])},
 {id:'aF',fl:'a',mode:'f',pts:T(H.aF,[[4.05,3.8],[4.05,14.8]])},
 {id:'aC',fl:'a',mode:'c',pts:T(H.aC,[[2.95,11.3],[4.75,11.3]])},
 {id:'aC',fl:'a',mode:'c',pts:T(H.aC,[[4.75,.9],[4.75,18.05]])},
 // plant room: under the ceiling, from the top of HR
 {id:'tC0',fl:'t',pts:[[2.9,2.24,16.575],[2.9,H.tC,16.68]]},
 {id:'tC',fl:'t',mode:'c',pts:T(H.tC,[[.6,16.68],[7.4,16.68]])},
 {id:'tC',fl:'t',mode:'c',pts:T(H.tC,[[2.9,16.68],[2.9,18.15]])},
 // outdoor: passage soffit and trenches
 {id:'oP0',fl:'o',pts:[[2.9,H.tC,16.68],[2.9,H.oP,16.4],[2.9,H.oP,15.95],[2.0,H.oP,15.95]]},
 {id:'oP',fl:'o',mode:'c',pts:T(H.oP,[[2.0,15.95],[2.0,13.45]])},
 {id:'oP',fl:'o',mode:'c',pts:T(H.oP,[[1.0,15.45],[7.0,15.45]])},
 {id:'oP',fl:'o',mode:'c',pts:T(H.oP,[[1.0,13.45],[7.0,13.45]])},
 {id:'oG0',fl:'o',pts:[[2.9,1.04,16.56],[2.9,.05,16.56],[2.9,.05,15.9]]},
 {id:'oG',fl:'o',mode:'g',ground:true,pts:[[2.9,15.9],[-.45,15.9],[-.45,12.05]]},
 {id:'oG',fl:'o',mode:'g',ground:true,pts:[[2.9,15.9],[8.45,15.9],[8.45,6.95],[11.2,6.95]]},
 {id:'oG',fl:'o',mode:'g',ground:true,pts:[[-.45,15.9],[-5.45,15.9],[-5.45,-5.8]]}];

// Done: feeder from the meter pillar with the HDO pair, the gate cable in the same trench. Route by the actual trench (assumed here).
const DONE=[
 {t:'Přívod z elektroměrového pilíře CYKY-J 4×10 a HDO 3×1,5 (hotovo, trasa podle skutečnosti)',ground:[[-5.85,-7.0],[-5.85,16.75],[-.2,16.75]],pts:[[-.2,.05,16.75],[.4,.05,16.75],[.4,.05,16.6],[2.55,.05,16.6],[2.55,1.04,16.6]]},
 {t:'Kabel k bráně CYKY-J 5×2,5 (hotovo)',ground:[[-5.7,16.75],[-5.7,-6.9],[-5.5,-6.9]]}];

// Junctions (boxes where a room cable branches): id, floor, feed mode, point.
const JUNCTIONS=[
 {id:'Jband',fl:'g',mode:'c',p:[3.5,2.8,1.3],t:'krabice v pásu podhledu u TV'},
 {id:'Jisl',fl:'g',mode:'c',p:[2.375,2.8,7.7],t:'krabice v podhledu nad ostrůvkem'},
 {id:'Jhall',fl:'g',mode:'c',p:[4.3,2.78,10.85],t:'krabice v podhledu předsíně'},
 {id:'Jbath',fl:'g',mode:'c',p:[6.1,2.78,9.15],t:'krabice v podhledu koupelny'},
 {id:'Jbed',fl:'a',mode:'c',p:[4.6,H.aC,2.4],t:'krabice nad stropem ložnice'}];

// Devices: id, circuit, kind, position, options {n:[nx,nz] facing, t label, j junction, via [[x,z]] waypoints, drop [x,z] where the cable
// turns vertical, pts for strips, r explicit 3D route, far + g for remote equipment reached by a ground route, mode 'f'|'c'|'g' override}.
// Kinds: ceil, spot, pend, wall, strip, step, sock, sock2, btn, pir, appl, motor, rez, tech, up, boll, gate, re, cov, ret, ev.
const DEVICES=[];
const D=(c,k,p,o={})=>DEVICES.push(Object.assign({c,k,p},o));
const arc=(y,s=1,n=7)=>Array.from({length:n},(_,i)=>{const t=1.8*i/(n-1);return [6.48-1.15*s*Math.cos(t),y,.3+1.35*s*Math.sin(t)];});

// ---------------- ground floor
// L1 living, dining, kitchen
for(const x of [.9,1.9,2.9,3.9,4.9])D('L1','spot',[x,PY,.975],{j:'Jband',t:'Bodovka v pásu u TV stěny (5×, stmívané)'});
for(const z of [1.975,2.975,3.975])D('L1','spot',[5.9,PY,z],{j:'Jband',t:'Bodovka v pásu u HS (3×)'});
D('L1','strip',null,{pts:[[.35,2.62,1.7],[5.42,2.62,1.7],[5.42,2.62,4.15]],j:'Jband',t:'Osvětlená římsa obýváku, LED 24 V, zdroj a stmívač v podhledu'});
D('L1','strip',null,{pts:[[1.08,.32,.33],[1.08,2.6,.33]],j:'Jband',t:'LED profil na boku lamelové stěny'});
D('L1','strip',null,{pts:[[3.72,.32,.33],[3.72,2.6,.33]],j:'Jband',t:'LED profil na boku lamelové stěny'});
D('L1','strip',null,{pts:arc(2.62,.97),j:'Jband',t:'LED v podhledu kopíruje oblouk vajíčka'});
D('L1','ceil',[2.4,Y1,2.75],{t:'Mechové svítidlo nad sedačkou (stmívání ve 3 krocích)'});
D('L1','pend',[2.875,Y1,5.25],{t:'Závěsné Sofian nad stolem'});
D('L1','strip',null,{pts:[[1.15,2.88,3.83],[3.65,2.88,3.83]],t:'Lišta s LED pro rostliny nad přepážkou (časovač)'});
D('L1','strip',null,{pts:[[.62,1.95,4.85],[.62,1.95,5.75]],t:'LED ve vitríně v obkladu pilíře'});
for(const z of [6.85,8.65])D('L1','spot',[1.3,Y1,z],{t:'Přisazená bodovka nad linkou (vývrt do dutiny panelu)'});
D('L1','strip',null,{pts:[[.45,1.75,6.25],[.45,1.75,9.15]],t:'LED pod horními skříňkami'});
for(const z of [6.95,8.45])D('L1','pend',[2.375,PY,z],{j:'Jisl',t:'Jantarová koule nad ostrůvkem (v noci ztlumená)'});
D('L1','strip',null,{pts:[[1.85,2.62,6.65],[1.85,2.62,8.75]],j:'Jisl',t:'Římsa kolem podhledu nad ostrůvkem'});
// L2 hall, corridor, stair, bathroom, WC, pantry
for(const z of [10.35,11.35])D('L2','spot',[4.3,PY,z],{j:'Jhall',t:'Bodovka v podhledu předsíně'});
D('L2','strip',null,{pts:[[2.78,2.15,11.0],[2.78,2.15,11.62]],j:'Jhall',t:'LED ve stropě sedací niky'});
for(const z of [7.0,8.9])D('L2','spot',[3.95,Y1,z],{t:'Přisazená bodovka v chodbě'});
D('L2','wall',[7.68,2.55,6.3],{n:[-1,0],t:'Nástěnné svítidlo nad schodištěm'});
for(const z of [8.5,9.8])D('L2','spot',[6.1,PY,z],{j:'Jbath',t:'Bodovka v podhledu koupelny (IP44)'});
D('L2','wall',[6.1,1.6,7.575],{n:[0,1],j:'Jbath',t:'Podsvícené zrcadlo'});
D('L2','strip',null,{pts:[[5.4,1.75,10.41],[6.8,1.75,10.41]],j:'Jbath',t:'LED v nice nad vanou'});
D('L2','spot',[6.3,PY,11.15],{t:'Bodovka v podhledu WC'});
D('L2','ceil',[1.6,PY,10.95],{t:'Světlo v komoře (spíná kontakt dveří)'});
// N1 night lights, fed through the floor
for(const z of [7.9,9.4,10.4])D('N1','step',[5.01,Y0+.3,z],{n:[-1,0],t:'Orientační světlo ve stěně, 30 cm nad podlahou'});
D('N1','strip',null,{pts:[[.92,.27,6.25],[.92,.27,9.15]],t:'Dvoubarevný pásek v soklu linky (večer bílá, v noci jantar)'});
for(const x of [1.88,2.72])D('N1','strip',null,{pts:[[x,.27,6.75],[x,.27,8.65]],t:'Pásek v soklu ostrůvku'});
D('N1','strip',null,{pts:[[5.3,.45,7.05],[7.25,1.3,7.05],[7.35,1.95,5.6],[7.0,2.6,4.7],[6.1,3.2,4.85]],t:'LED pod hranou každého schodu'});
D('N1','strip',null,{pts:[[1.5,.36,.55],[3.3,.36,.55]],t:'LED pod televizním stolkem'});
D('N1','strip',null,{pts:[[1.2,.27,3.62],[3.6,.27,3.62]],t:'LED pod soklem květináče'});
D('N1','strip',null,{pts:arc(.27,.95),t:'LED v liště vajíčka, nasvítí lamely zespodu'});
D('N1','strip',null,{pts:[[.95,.3,4.8],[.95,.3,5.8]],t:'LED pod plovoucí komodou'});
D('N1','strip',null,{pts:[[5.35,.63,8.02],[6.85,.63,8.02]],t:'LED pod umyvadlovou skříňkou'});
D('N1','strip',null,{pts:[[7.38,.5,10.98],[7.38,.5,11.3]],t:'LED pod závěsným WC'});
// controls on the ground floor (Cat6 to RD, no route drawn)
D('ctl','btn',[3.21,1.44,11.45],{n:[1,0],t:'Panel u vchodu: předsíň, chodba, Odchod (vše vypnout, žaluzie), Noc'});
D('ctl','btn',[4.45,1.44,9.765],{n:[0,-1],t:'Panel u dveří z předsíně: chodba, kuchyň, jídelna'});
D('ctl','btn',[7.2,1.44,4.19],{n:[0,-1],t:'Panel v obýváku: bodovky, římsa, mech, scény, žaluzie HS a fixu, terasa'});
D('ctl','btn',[5.01,1.44,7.72],{n:[-1,0],t:'U schodů: schodiště, chodba v podkroví'});
D('ctl','btn',[5.01,1.44,8.18],{n:[-1,0],t:'Koupelna 1.05 (u dveří zvenku)'});
D('ctl','btn',[5.01,1.44,10.82],{n:[-1,0],t:'WC 1.04 (u dveří zvenku)'});
D('ctl','pir',[4.1,PY,10.75],{t:'Čidlo pohybu · předsíň'});
D('ctl','pir',[4.4,Y1,7.6],{t:'Čidlo pohybu · chodba a schody'});
D('ctl','pir',[1.4,Y1,7.75],{t:'Čidlo pohybu · kuchyň'});
D('ctl','pir',[6.7,PY,9.15],{t:'Čidlo pohybu · koupelna'});
D('ctl','pir',[6.9,PY,11.15],{t:'Čidlo přítomnosti · WC'});
D('ctl','pir',[8.3,2.95,4.2],{t:'Čidlo větru pro žaluzie (fasáda u HS)'});
// Z sockets and S appliances, through the floor
D('Z1','sock2',[2.4,1.15,.31],{n:[0,1],t:'Za televizí (2× + data)'});
D('Z1','sock2',[1.8,.42,.31],{n:[0,1],t:'V televizním stolku'});
D('Z1','sock2',[2.4,.33,3.67],{n:[0,-1],t:'V soklu květináče za sedačkou (+ USB)'});
D('Z1','sock',[.31,Y0+.3,2.0],{n:[1,0],t:'Pod oknem obýváku'});
D('Z1','sock',[5.42,Y0+.3,.31],{n:[0,1],t:'Ve vajíčku (lampa na čtení)'});
D('Z1','sock',[7.69,Y0+.3,3.75],{n:[-1,0],t:'U HS'});
D('Z1','sock2',[.66,Y0+.3,4.55],{n:[1,0],t:'U komody v jídelně'});
D('Z2','sock2',[.5,1.29,6.19],{n:[0,1],t:'Linka u pilíře'});
D('Z2','sock2',[.62,1.29,9.19],{n:[0,-1],t:'Linka u lednice'});
D('Z3','sock2',[2.62,1.15,8.45],{up:true,t:'Výsuvná zásuvka v desce ostrůvku'});
D('Z3','appl',[2.375,PY,7.7],{j:'Jisl',mode:'c',t:'Digestoř v podhledu nad ostrůvkem'});
D('Z4','sock',[5.01,Y0+.3,10.05],{n:[-1,0],t:'Předsíň'});
D('Z4','sock',[5.01,Y0+.3,7.5],{n:[-1,0],t:'Chodba (vysavač)'});
D('Z4','sock',[2.43,Y0+.3,10.35],{n:[-1,0],t:'Komora (robotický vysavač, nabíječky)'});
D('Z4','sock2',[7.05,1.44,7.555],{n:[0,1],t:'U umyvadla v koupelně (IP44, mimo zóny)'});
D('S1','appl',[2.3,.75,7.7],{t:'Varná deska 400 V v ostrůvku'});
D('S2','appl',[2.4,.3,8.2],{t:'Trouba pod varnou deskou'});
D('S3','appl',[.33,.45,7.75],{n:[1,0],t:'Myčka (vývod ve skříňce dřezu)'});
D('S4','appl',[.33,2.45,9.5],{n:[1,0],t:'Lednice (vývod nad vestavnou lednicí)'});
D('S4','appl',[2.2,Y0+.3,11.69],{n:[0,-1],t:'Mrazák v komoře'});
D('S7','appl',[5.19,1.0,9.38],{n:[1,0],t:'Elektrický žebřík v koupelně (přes relé)'});
// Ž1 ground-floor blinds: motor in the head box outside, cable down the wall
D('Ž1','motor',[8.3,2.72,1.82],{j:'Jband',via:[[7.6,1.3],[7.6,1.82]],drop:[7.95,1.82],t:'Žaluzie HS, motor v nadpraží'});
D('Ž1','motor',[6.48,2.72,-.33],{j:'Jband',via:[[6.48,1.3]],drop:[6.48,.05],t:'Žaluzie fixu'});
D('Ž1','motor',[-.33,1.82,2.9],{drop:[.05,2.9],t:'Žaluzie okna obýváku'});
D('Ž1','motor',[-.33,1.82,7.7],{drop:[.05,7.7],t:'Žaluzie okna kuchyně'});
// T1 / T2 next to RD
D('T1','tech',[2.61,1.3,10.45],{n:[1,0],r:[[2.66,1.3,10.98],[2.66,1.3,10.6],[2.61,1.3,10.45]],t:'Zónový regulátor R1 nad rozdělovačem'});

// ---------------- attic (D1.3 layout)
D('L3','ceil',[5.2,Uc,2.25],{fl:'a',j:'Jbed',t:'Stropní svítidlo ložnice'});
for(const z of [1.25,3.24])D('L3','wall',[4.14,U0+1.2,z],{fl:'a',n:[1,0],j:'Jbed',t:'Nástěnné u postele (jantarová koule)'});
D('L3','strip',null,{fl:'a',pts:[[4.1,U0+2.3,1.15],[4.1,U0+2.3,3.35]],j:'Jbed',t:'LED nad lamelami za postelí'});
D('L3','ceil',[2.6,Uc,2.6],{fl:'a',j:'Jbed',t:'Šatna v ložnici · strop'});
D('L3','ceil',[2.1,Uc,4.95],{fl:'a',t:'Koupelna u ložnice · strop'});
D('L3','wall',[1.77,U0+1.6,6.37],{fl:'a',n:[0,-1],t:'Podsvícené zrcadlo'});
D('L3','ceil',[2.5,Uc,8.3],{fl:'a',t:'Pokoj 2.04 · strop'});
D('L3','ceil',[2.5,Uc,13.0],{fl:'a',t:'Šatna 2.09 · strop'});
D('L3','ceil',[4.9,Uc,16.3],{fl:'a',t:'Pokoj 2.08 · strop'});
for(const z of [9.6,11.6,13.5])D('L4','spot',[4.05,Uc,z],{fl:'a',t:'Bodovka v chodbě'});
D('L4','spot',[3.85,Uc,4.85],{fl:'a',t:'Bodovka na podestě'});D('L4','spot',[4.3,Uc,6.8],{fl:'a',t:'Bodovka na podestě'});
D('L4','ceil',[5.4,Uc,8.9],{fl:'a',t:'Prádelna · strop'});
D('L4','ceil',[5.3,Uc,10.7],{fl:'a',t:'WC 2.06 · strop'});
D('L4','ceil',[5.5,Uc,12.2],{fl:'a',t:'Koupelna 2.07 · strop'});
D('L4','wall',[4.76,U0+1.6,12.35],{fl:'a',n:[1,0],t:'Podsvícené zrcadlo'});
// N2
D('N2','strip',null,{fl:'a',pts:[[4.3,U0+.03,1.57],[6.05,U0+.03,1.57],[6.05,U0+.03,2.93],[4.3,U0+.03,2.93]],t:'LED pod plovoucí postelí'});
for(const x of [3.0,5.0])D('N2','step',[x,U0+.3,4.28],{fl:'a',n:[0,-1],t:'Orientační světlo u dveří v ložnici'});
for(const z of [5.6,9.8,13.6])D('N2','step',[3.5,U0+.3,z],{fl:'a',n:[1,0],t:'Orientační světlo v chodbě'});
for(const z of [7.95,12.2])D('N2','step',[4.59,U0+.3,z],{fl:'a',n:[-1,0],t:'Orientační světlo v chodbě'});
D('N2','step',[4.9,U0+.3,4.45],{fl:'a',n:[0,1],t:'Orientační světlo nahoře u schodů'});
D('N2','strip',null,{fl:'a',pts:[[.6,U0+.28,4.94],[.6,U0+.28,5.26]],t:'LED pod WC v koupelně u ložnice'});
D('N2','strip',null,{fl:'a',pts:[[5.22,U0+.39,11.7],[5.22,U0+.39,13.0]],t:'LED pod umyvadly 2.07'});
D('N2','strip',null,{fl:'a',pts:[[7.4,U0+.28,13.64],[7.4,U0+.28,13.96]],t:'LED pod WC 2.07'});
D('N2','strip',null,{fl:'a',pts:[[7.4,U0+.28,10.54],[7.4,U0+.28,10.86]],t:'LED pod WC 2.06'});
D('N2','strip',null,{fl:'a',pts:[[1.38,U0+.03,8.95],[1.38,U0+.03,10.9]],t:'Pod postelí v pokoji 2.04 (příprava)'});
D('N2','strip',null,{fl:'a',pts:[[5.7,U0+.03,17.03],[7.6,U0+.03,17.03]],t:'Pod postelí v pokoji 2.08 (příprava)'});
// attic controls
D('ctl','btn',[4.55,U0+1.2,4.28],{fl:'a',n:[0,-1],t:'Ložnice u dveří'});
for(const z of [1.15,3.35])D('ctl','btn',[4.14,U0+.85,z],{fl:'a',n:[1,0],t:'U postele: světlo, Noc (vše vypnout), žaluzie'});
D('ctl','btn',[2.5,U0+1.2,4.45],{fl:'a',n:[0,1],t:'Koupelna u ložnice'});
D('ctl','btn',[3.5,U0+1.2,6.0],{fl:'a',n:[1,0],t:'Nahoře u schodů: chodba, schodiště'});
D('ctl','btn',[3.33,U0+1.2,7.75],{fl:'a',n:[-1,0],t:'Pokoj 2.04'});
D('ctl','btn',[2.5,U0+1.2,14.23],{fl:'a',n:[0,-1],t:'Šatna 2.09'});
D('ctl','btn',[4.55,U0+1.2,14.38],{fl:'a',n:[0,1],t:'Pokoj 2.08'});
D('ctl','btn',[4.76,U0+1.2,8.38],{fl:'a',n:[1,0],t:'Prádelna'});
D('ctl','btn',[4.59,U0+1.2,11.2],{fl:'a',n:[-1,0],t:'WC 2.06 (zvenku)'});
D('ctl','btn',[4.59,U0+1.2,13.25],{fl:'a',n:[-1,0],t:'Koupelna 2.07 (zvenku)'});
for(const [p,t] of [[[3.9,Uc,6.2],'podesta'],[[4.05,Uc,12.6],'chodba'],[[4.3,Uc,3.9],'ložnice u dveří'],[[1.9,Uc,5.7],'koupelna u ložnice'],[[6.0,Uc,13.6],'koupelna 2.07'],[[6.4,Uc,10.7],'WC 2.06']])
 D('ctl','pir',p,{fl:'a',t:'Čidlo pohybu · '+t});
// sockets, appliances
for(const z of [1.3,3.2])D('Z5','sock2',[4.14,U0+.35,z],{fl:'a',n:[1,0],t:'U postele'});
D('Z5','sock',[1.3,U0+.3,4.28],{fl:'a',n:[0,-1],t:'U dveří do koupelny'});
D('Z5','sock',[6.9,U0+.3,4.28],{fl:'a',n:[0,-1],t:'U lavice'});
D('Z5','sock',[4.0,U0+.3,.31],{fl:'a',n:[0,1],t:'Mezi balkonovými dveřmi'});
D('Z5','sock',[1.0,U0+1.1,6.37],{fl:'a',n:[0,-1],t:'U umyvadla (IP44)'});
D('Z6','sock2',[1.75,U0+.3,6.56],{fl:'a',n:[0,1],t:'Pokoj 2.04 · u stolu'});
D('Z6','sock',[.31,U0+.3,8.75],{fl:'a',n:[1,0],t:'Pokoj 2.04 · u postele'});
D('Z6','sock',[3.33,U0+.3,8.2],{fl:'a',n:[-1,0],t:'Pokoj 2.04 · u dveří'});
D('Z6','sock',[1.8,U0+.3,11.74],{fl:'a',n:[0,1],t:'Šatna 2.09'});
for(const z of [15.25,17.15])D('Z6','sock',[7.69,U0+.3,z],{fl:'a',n:[-1,0],t:'Pokoj 2.08 · u postele'});
D('Z6','sock2',[6.0,U0+.3,18.29],{fl:'a',n:[0,-1],t:'Pokoj 2.08 · u stolu'});
D('Z6','sock',[.31,U0+.3,16.6],{fl:'a',n:[1,0],t:'Pokoj 2.08 · u křesla'});
D('Z7','sock',[3.5,U0+.3,12.6],{fl:'a',n:[1,0],t:'Chodba'});
D('Z7','sock',[4.59,U0+.3,9.6],{fl:'a',n:[-1,0],t:'Chodba'});
D('Z7','sock',[7.0,U0+1.05,7.39],{fl:'a',n:[0,1],t:'Prádelna (žehlička)'});
D('Z7','sock2',[4.76,U0+1.15,13.2],{fl:'a',n:[1,0],t:'U umyvadel 2.07 (IP44)'});
D('S5','appl',[5.3,U0+1.05,7.39],{fl:'a',n:[0,1],t:'Pračka'});
D('S6','appl',[5.92,U0+1.05,7.39],{fl:'a',n:[0,1],t:'Sušička'});
D('S7','appl',[3.32,U0+1.1,4.8],{fl:'a',n:[-1,0],t:'Žebřík v koupelně u ložnice'});
D('S7','appl',[4.77,U0+1.3,13.22],{fl:'a',n:[1,0],t:'Žebřík v koupelně 2.07'});
// Ž2 attic blinds and the roof-window spares, from above the ceiling
for(const x of [2.75,5.25])D('Ž2','motor',[x,5.55,-.33],{fl:'a',drop:[x,.05],t:'Žaluzie balkonových dveří ložnice'});
for(const x of [2.75,5.25])D('Ž2','motor',[x,5.55,18.93],{fl:'a',drop:[x,18.55],t:'Žaluzie okna v pokoji 2.08'});
for(const z of [4.84,7.55,10.45,12.3])D('Ž2','rez',[6.15,5.82,z+.33],{fl:'a',t:'Rezerva ke střešnímu oknu (otevírání, markýza)'});
for(const z of [4.96,10.33])D('Ž2','rez',[1.85,5.82,z+.33],{fl:'a',t:'Rezerva ke střešnímu oknu (otevírání, markýza)'});
D('T1','tech',[4.3,Uc+.12,5.6],{fl:'a',t:'Kazetový fancoil FC'});
D('T1','tech',[3.5,U0+1.4,10.95],{fl:'a',n:[1,0],t:'Zónový regulátor R2'});

// ---------------- plant room and outdoors (HR)
D('H2','tech',[1.77,.9,19.08],{fl:'t',drop:[1.77,18.2],t:'Venkovní jednotka TČ 400 V'});
D('H3','tech',[2.6,1.3,18.28],{fl:'t',n:[0,-1],t:'Záložní ohřev 9 kW, blokovaný HDO'});
D('H4','tech',[5.38,2.0,18.0],{fl:'t',t:'Rekuperační jednotka'});
D('H5','tech',[1.55,1.5,18.28],{fl:'t',n:[0,-1],t:'ESP32, cirkulační čerpadlo, teploměry'});
D('H5','ceil',[2.0,Y1,17.4],{fl:'t',t:'Světlo technické místnosti'});D('H5','ceil',[5.5,Y1,17.0],{fl:'t',t:'Světlo technické místnosti'});
D('H5','sock',[4.3,1.44,16.66],{fl:'t',n:[0,1],t:'Zásuvka u HR'});D('H5','sock',[7.69,1.0,17.4],{fl:'t',n:[-1,0],t:'Zásuvka u rekuperace'});
D('ctl','btn',[5.65,1.44,16.66],{fl:'t',n:[0,1],t:'Vypínač u dveří technické místnosti'});
for(const x of [1,3,5,7])for(const z of [13.1,15.1])D('V1','spot',[x,2.86,z],{fl:'o',t:'Bodovka v podhledu průjezdu'});
for(const [x,z] of [[-.45,12.05],[8.45,12.05],[-.45,16.15],[8.45,16.15]])D('V1','up',[x,-.1,z],{fl:'o',t:'Zemní světlo, nasvítí dřevo na nároží'});
for(const z of [-5,0,5,10])D('V2','boll',[-5.45,-.095,z],{fl:'o',t:'Sloupkové světlo 60 cm u příjezdovky'});
D('V2','strip',null,{fl:'o',pts:[[11.44,.08,.0],[11.44,.08,6.5]],t:'LED pod okrajem terasy'});
D('V2','strip',null,{fl:'o',pts:[[11.84,-.03,.9],[11.84,-.03,5.4]],t:'LED pod plovoucím schodem terasy'});
for(const x of [8.57,8.99])D('V2','strip',null,{fl:'o',pts:[[x,.03,12.35],[x,.03,15.85]],t:'LED pod hranou schodů do zahrady'});
D('V3','sock',[4.6,.45,15.99],{fl:'o',n:[0,-1],t:'Venkovní zásuvka v průjezdu (IP44)'});
D('V3','sock',[8.26,.45,3.7],{fl:'o',n:[1,0],t:'Venkovní zásuvka na terase (IP44)'});
D('V4','gate',[-5.5,.25,-6.95],{fl:'o',t:'Pohon posuvné brány (natažené)'});
D('V5','tech',[7.9,1.0,18.86],{fl:'t',n:[0,1],drop:[7.45,18.2],mode:'c',far:[9.6,-.16,23.0],g:[[7.9,18.9],[7.9,19.3],[9.6,19.3],[9.6,23.0]],t:'Rozvaděč ČOV na štítu, kabel k ČOV v zemi'});
D('V6','tech',[-.25,.1,17.95],{fl:'t',n:[-1,0],drop:[.45,17.95],mode:'c',far:[-3.0,-.16,23.5],g:[[-.25,17.95],[-3.0,17.95],[-3.0,23.5]],t:'Čerpadlo retenční nádrže (kabel v zemi)'});
D('V7','ev',[.9,1.3,15.98],{fl:'o',n:[0,-1],r:[[2.5,1.3,16.56],[2.5,1.3,16.25],[.9,1.3,16.25],[.9,1.3,15.98]],t:'Wallbox v průjezdu, zatím jen kabel 5×6'});
D('ctl','btn',[-.1,1.3,-6.95],{fl:'o',t:'Tablo zvonku u branky (IP, PoE, Cat6 ve výkopu)'});
D('done','re',[-6.3,.6,-6.95],{fl:'o',t:'Elektroměrový pilíř u silnice (mimo model)'});

// New penetrations for the panel drawing P-01 (all trades), [z, x] like schema.js PEN.
const PEN=[
 {id:'E1',who:'ele',at:[18.1,4.45],d:.11,t:'elektro HR → podkroví (napáječ RD, rezerva) v dobetonávce u štítu'},
 {id:'E2',who:'ele',at:[11.3,2.95],d:.11,t:'elektro RD → podkroví, 2× Ø 110 v sousedních dutinách (vedle B a P3)'}];

// ---------------- routing
const byId=id=>CIRCUITS.find(c=>c.id===id);
const catOf=d=>d.c==='ctl'?'ctl':d.c==='done'?'done':(byId(d.c)||{}).cat||'tech';
const floorOf=d=>d.fl||'g';
const modeOf=d=>{if(d.mode)return d.mode;const c=catOf(d);if(floorOf(d)==='o')return d.k==='spot'?'c':'g';
 return c==='light'||c==='blind'||(c==='tech'&&floorOf(d)!=='t')||d.k==='rez'?'c':floorOf(d)==='t'?'c':'f';};
const anchor=d=>d.p||d.pts[0];
// Nearest point on the trunks of a floor and mode (plan distance), with the segment direction.
function nearest(fl,mode,q){let best=null;
 for(const t of TRUNKS)if(t.fl===fl&&t.mode===mode)for(let i=1;i<t.pts.length;i++){const a=t.pts[i-1],b=t.pts[i],ax=a[0],az=t.ground?a[1]:a[2],bx=b[0],bz=t.ground?b[1]:b[2];
  const dx=bx-ax,dz=bz-az,L2=dx*dx+dz*dz||1,s=Math.max(0,Math.min(1,((q[0]-ax)*dx+(q[1]-az)*dz)/L2)),px=ax+s*dx,pz=az+s*dz,dd=Math.hypot(q[0]-px,q[1]-pz);
  if(!best||dd<best.d)best={d:dd,p:[px,pz],alongX:Math.abs(dx)>Math.abs(dz),y:t.ground?null:a[1]};}
 return best;}
// L-shaped path in plan from a to b: first along the given axis, then the other one.
const ell=(a,b,alongX)=>alongX?[a,[b[0],a[1]],b]:[a,[a[0],b[1]],b];
const dedupe=p=>p.filter((q,i)=>i===0||Math.hypot(...q.map((v,k)=>v-p[i-1][k]))>1e-6);
// 3D route of a device (array of [x,y,z]); outdoor ground routes come back as {ground:[[x,z]...], up:[[x,y,z]...]}.
function route(d){if(d.r)return {pts:d.r};const fl=floorOf(d),mode=modeOf(d),p=anchor(d),target=d.drop||[p[0],p[2]];
 let start,y,alongX;
 if(d.j){const J=JUNCTIONS.find(j=>j.id===d.j);start=[J.p[0],J.p[2]];y=J.p[1];alongX=true;}
 else{const n=nearest(fl,mode,target);if(!n)return null;start=n.p;y=n.y;alongX=n.alongX;}
 const plan=dedupe([...ell(start,(d.via||[])[0]||target,alongX),...(d.via||[]).slice(1),...(d.via?[target]:[])]);
 if(mode==='g')return {ground:dedupe([...plan,[p[0],p[2]]]),up:[[p[0],p[1]>.3?.05:p[1],p[2]],[p[0],p[1],p[2]]]};
 const pts=plan.map(([x,z])=>[x,y,z]);pts.push([target[0],p[1],target[1]]);if(d.drop)pts.push([p[0],p[1],p[2]]);return {pts:dedupe(pts)};}
// Junction feeds: trunk → junction.
function junctionRoute(J){const n=nearest(J.fl,J.mode,[J.p[0],J.p[2]]);const plan=ell(n.p,[J.p[0],J.p[2]],n.alongX);return dedupe([...plan.map(([x,z])=>[x,n.y,z]),J.p]);}
const FEED=[[2.9,2.24,16.575],[2.9,2.84,16.62],[4.5,2.84,16.62],[4.5,2.84,18.12],[4.5,H.aC+.06,18.12],[4.82,H.aC+.06,18.12],[4.82,H.aC+.06,11.4],[3.02,H.aC+.06,11.4],[3.02,2.84,11.4],[2.7,2.84,11.4],[2.7,2.1,11.4]];
const hex=h=>h.match(/\w\w/g).map(v=>parseInt(v,16)/255);
window.Elektro={H,CAT,BOARDS,CIRCUITS,TRUNKS,DONE,JUNCTIONS,DEVICES,PEN,FEED,circuit:byId,catOf,floorOf,modeOf,route,junctionRoute,color:d=>CAT[catOf(d)].c,rgb:k=>hex(CAT[k].c),hex};
})();
