// Shared drawing kit for the installation pages (rekuperace.html, vytapeni.html, voda.html).
// The house is in the 3D model's pre-mirror coordinates: z runs along the house (0 = outer masonry face of the front gable, the EPS
// is at -0.2, the inner face 0.3), x runs across (0.3 = inner face of the kitchen/driveway-side wall, 8.0 = inner face of the
// terrace/HS-side wall). Plan points are [z, x]. Heights are relative to the finished ground floor (±0).
// As built: masonry 8.3 × 11.9 m (inner 7.7 × 11.3), passage 11.9–16.1, plant room 16.1–18.5 (inner 16.4–18.2).
// It draws technical plan sheets (walls with insulation, windows, door openings, fixtures, room tags, dimensions, legend, scale bar,
// north arrow, title block), an exploded oblique projection for the 3D schematics, and the drawings both pages share: the ceiling
// penetrations of all trades and the plant room detail.
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const PAL={ink:'#22312a',txt:'#2c3e34',sub:'#66756b',faint:'#a3aea7',sheet:'#ffffff',frame:'#c9d1cb',
 wall:'#a7b0aa',wallEdge:'#66716b',eps:'#f1f3ef',epsEdge:'#b9c2bc',part:'#d2d8d4',partEdge:'#8f9a93',glass:'#6f9db3',fix:'#c3cbc6',
 sup:'#2a6fd6',ext:'#e0761c',oda:'#3a9a4c',eha:'#8a5a2b',air:'#8b62c9',hs:'#c0392b',hr:'#2e6fb5',steel:'#4d5961',
 warm:'#fff3df',warmEdge:'#ecd3a6',drop:'#e7edf5',dropEdge:'#a9b8cc',vb:'#c0392b',wood:'#c99a5b',sen:'#6d4bb3',pen:'#b0303a'};
const f1=n=>n.toFixed(1).replace('.',','),f2=n=>n.toFixed(2).replace('.',','),mm=n=>Math.round(n*1000).toLocaleString('cs-CZ');
function el(p,tag,a,t){const e=document.createElementNS(NS,tag);if(a)for(const k in a)if(a[k]!=null)e.setAttribute(k,a[k]);if(t!=null)e.textContent=t;p.appendChild(e);return e;}

// ---------------------------------------------------------------- geometry
// Openings in exterior walls: side, from, to, kind. Sides: k kitchen/driveway wall (x -0.2..0.3), t terrace wall (x 8.0..8.5),
// f front gable (z -0.2..0.3), b back wall of the main house to the passage (z 11.6..12.1), p plant-room wall to the passage
// (z 15.9..16.4), g plant-room / attic back gable (z 18.2..18.7). Kinds: w window, d door, hs sliding door, s sidelight.
const OPEN={
 g:[['k',1.4,4.4,'w'],['k',6.2,9.2,'w'],['t',.32,3.32,'hs'],['t',8.0,9.0,'w'],['f',5.78,7.78,'w'],['b',1.15,2.15,'w'],['b',3.35,4.55,'d'],['b',4.55,5.15,'s'],['b',6.15,7.15,'w'],
  ['g',1.15,2.15,'w'],['g',3.65,4.65,'w'],['g',6.15,7.15,'w'],['p',5.95,6.95,'d']],
 a:[['f',2.4,3.4,'d'],['f',4.9,5.9,'d'],['g',2.4,3.4,'w'],['g',4.9,5.9,'w']]};
// Interior walls [x0,x1,z0,z1,doorGaps,axis]: axis 'z' = wall running along z with gaps in z, otherwise gaps in x.
const PARTS={
 g:[[.3,2.59,9.87,10.02,[[1.7,2.4]]],[2.59,2.74,9.67,11.6,[],'z'],[2.74,5.17,9.67,9.82,[[3.5,4.4]]],[5.17,5.32,7.39,11.6,[[8.3,9.0],[10.85,11.55]],'z'],[5.32,8.0,10.33,10.48],[5.32,8.0,7.39,7.54]],
 compact:[[.3,8.0,4.29,4.44,[[1.7,2.5],[3.75,4.55]]],[.3,3.49,6.4,6.55],[3.49,3.64,4.44,12.9,[[6.7,7.4],[8.4,9.2],[12.05,12.75]],'z'],[.3,3.49,7.6,7.75],[.3,3.49,11.8,11.95],[4.75,4.9,7.38,12.9,[[8.4,9.1],[9.6,10.4]],'z'],[4.9,8.0,9.4,9.55],[4.75,8.0,7.23,7.38],[4.07,4.22,1.15,3.35,[],'z']],
 d13:[[.3,8.0,4.29,4.44,[[1.7,2.5],[3.75,4.55]]],[.3,3.49,6.4,6.55],[3.49,3.64,4.44,14.14,[[6.8,7.6]],'z'],[.3,3.49,11.48,11.63],[.3,8.0,14.14,14.27,[[1.75,2.55],[3.75,4.55]]],[4.75,4.9,7.38,14.14,[[8.5,9.2],[10.25,10.95],[13.3,14.0]],'z'],[4.9,8.0,9.85,10.0],[4.9,8.0,11.2,11.35],[4.75,8.0,7.23,7.38],[4.07,4.22,1.15,3.35,[],'z']]};
// Rooms: id, name, rectangles [x0,x1,z0,z1], tag position [z,x], area shown unless noArea.
const ROOMS={
 g:[['1.11','Obývák',[[.3,8.0,.3,4.2]],[3.55,3.15]],['1.10','Jídelna',[[.3,5.25,4.2,6.2]],[5.35,2.85]],['1.07','Kuchyň',[[.3,3.05,6.2,9.67],[.3,2.59,9.67,9.87]],[6.85,1.6]],['1.06','Chodba',[[3.05,5.17,6.2,9.67]],[7.0,4.2]],
  ['1.09','Schodiště a krb',[[5.25,8.0,4.2,7.39]],[6.75,6.6]],['1.05','Koupelna',[[5.32,8.0,7.54,10.33]],[8.25,6.9]],['1.04','WC',[[5.32,8.0,10.48,11.6]],[11.2,6.7]],['1.03','Předsíň',[[2.74,5.17,9.82,11.6]],[11.2,4.35]],
  ['1.08','Komora',[[.3,2.59,10.02,11.6]],[11.2,1.6]],['1.02','Technická m.',[[.3,8.0,16.4,18.2]],[16.75,3.0]]],
 compact:[['2.02','Ložnice',[[.3,8.0,.3,4.29]],[.85,6.55]],['2.03','Koupelna',[[.3,3.49,4.44,6.4]],[5.95,1.45]],['','Úklid',[[.3,3.49,6.55,7.6]],[7.08,1.4]],['','Dětský pokoj 1',[[.3,3.49,7.75,11.8]],[11.15,1.5]],
  ['','Komora',[[.3,3.49,11.95,12.9]],[12.45,1.5]],['','Koupelna dětí',[[4.9,8.0,7.38,9.4]],[8.0,7.1]],['','Dětský pokoj 2',[[4.9,8.0,9.55,12.9]],[12.1,6.75]],['2.01','Chodba',[[3.64,4.75,7.23,12.9]],[12.2,4.2],1]],
 d13:[['2.02','Ložnice',[[.3,8.0,.3,4.29]],[.85,6.55]],['2.03','Koupelna',[[.3,3.49,4.44,6.4]],[5.95,1.45]],['2.04','Pokoj',[[.3,3.49,6.55,11.48]],[10.9,1.5]],['2.09','Šatna',[[.3,3.49,11.63,14.14]],[12.9,1.5]],
  ['2.08','Pokoj',[[.3,8.0,14.27,18.2]],[16.5,1.75]],['2.05','Prádelna',[[4.9,8.0,7.38,9.85]],[8.65,7.15]],['2.06','WC',[[4.9,8.0,10.0,11.2]],[10.6,7.15]],['2.07','Koupelna',[[4.9,8.0,11.35,14.14]],[12.75,7.15]],['2.01','Chodba',[[3.64,4.75,7.23,14.14]],[12.8,4.2],1]]};
const FLAT=[1.78,6.52];                                   // edges of the flat attic ceiling (+5.66); outside them the slope
const FRAMES=[['R1',4.365],['R2',9.91],['R3',14.205]];    // steel ridge frames over the corridor
const CHIMNEY=[5.27,5.65,5.2,5.6];
const ROOFWIN={compact:{k:[5.5,8.6,10.7],t:[4.8,8.0,10.35,11.65]},d13:{k:[4.96,10.23],t:[4.84,7.55,10.35,12.2]}};
// Plant room: tanks, the heat pump outdoor unit, the MVHR unit.
const PLANT={tv:[17.5,1.15,.45],aku:[17.75,2.3,.27],rtl:[3.15,4.05,17.85,18.15],ctl:[1.9,2.2,16.55,17.15],hp:[1.37,2.47,19.0,19.4],unit:[5.1,5.85,17.64,18.2]};
// Ceiling penetrations of the ground floor (all trades). at [z,x], d diameter (m), who: vzt, top, kan, ele. Grouped as on stropni-panely:
// P1, C, E1 in the cast strip DB at the plant-room gable; B, P3, E2, K1, V2 in the installation strip Z2 at the wall to the passage
// (z 10.835–11.6 over the rooms); S2 + V3 in a cut-out on the edge of panel 06; P2, P9 and K2 are core holes in the middle of a panel.
const PEN=[
 {id:'P1',who:'vzt',at:[18.0,3.87],d:.23,t:'přívod Ø 180 (V1)'},{id:'P1',who:'vzt',at:[18.0,4.23],d:.23,t:'odvod Ø 180 (V1)'},{id:'C',who:'top',at:[18.0,3.5],d:.2,t:'topení 2× 32, voda, data'},
 {id:'P2',who:'vzt',at:[1.22,3.99],d:.11,t:'přívod obýváku Ø 90 (ventil u TV)'},{id:'P2',who:'vzt',at:[1.42,3.99],d:.11,t:'přívod obýváku Ø 90 (ventil u HS)'},
 {id:'P3',who:'vzt',at:[11.0,3.25],d:.14,t:'odvod přízemí Ø 125 (V3) v pásu Z2'},{id:'P9',who:'vzt',at:[9.45,2.95],d:.14,t:'odvod kuchyně Ø 125 (ventil ve stropě)'},{id:'B',who:'top',at:[11.0,3.06],d:.16,t:'stoupačka R2 → R1 + 2 chráničky v pásu Z2'},
 {id:'S2',who:'kan',at:[5.85,.5],d:.13,t:'odpad DN 110 z koupelny u ložnice'},{id:'K2',who:'kan',at:[10.27,7.7],d:.13,t:'stoupačka K2 (ZTI)'},{id:'K1',who:'kan',at:[11.42,7.7],d:.13,t:'stoupačka K1 (ZTI) v pásu Z2'},
 {id:'V3',who:'top',at:[5.71,.5],d:.11,t:'stoupačka vody V3 (SV 26 + TV 20) vedle S2'},{id:'V2',who:'top',at:[11.42,7.88],d:.06,t:'stoupačka vody V2 (vratka cirkulace 16) vedle K1'},
 {id:'E1',who:'ele',at:[18.0,4.6],d:.11,t:'elektro HR → podkroví (napáječ RD) v dobetonávce u štítu'},{id:'E2',who:'ele',at:[11.3,2.95],d:.11,t:'elektro RD → podkroví, chránička Ø 110 nad RD'},{id:'E2',who:'ele',at:[11.3,3.11],d:.11,t:'elektro RD → podkroví, druhá chránička Ø 110'}];
const area=r=>r.reduce((t,[x0,x1,z0,z1])=>t+(x1-x0)*(z1-z0),0);

// ---------------------------------------------------------------- plan sheet
const PX={W:1200,H:744,K:55,OX:30,OY:92,Z0:-.7,X0:-.75};
PX.X=z=>PX.OX+(z-PX.Z0)*PX.K;PX.Y=x=>PX.OY+(x-PX.X0)*PX.K;
function defs(svg){const id=svg.id,d=el(svg,'defs');
 const pat=(n,w,h,tr,fn)=>{const p=el(d,'pattern',{id:`${id}-${n}`,width:w,height:h,patternUnits:'userSpaceOnUse',patternTransform:tr});fn(p);};
 pat('eps',6,6,null,p=>{el(p,'rect',{width:6,height:6,fill:PAL.eps});el(p,'circle',{cx:3,cy:3,r:.7,fill:'#c2cac4'});});
 pat('h',6,6,'rotate(45)',p=>{el(p,'rect',{width:6,height:6,fill:'#f4f6f3'});el(p,'line',{x1:0,y1:0,x2:0,y2:6,stroke:'#c3cbc5','stroke-width':1.6});});
 pat('loft',9,9,'rotate(45)',p=>{el(p,'rect',{width:9,height:9,fill:'#f6f4ee'});el(p,'line',{x1:0,y1:0,x2:0,y2:9,stroke:'#e2ddcf','stroke-width':2});});
 pat('drop',8,8,null,p=>{el(p,'rect',{width:8,height:8,fill:PAL.drop});el(p,'circle',{cx:4,cy:4,r:.9,fill:'#9fb0c8'});});
 pat('ins',7,7,'rotate(-45)',p=>{el(p,'rect',{width:7,height:7,fill:'#fbf3dc'});el(p,'line',{x1:0,y1:0,x2:0,y2:7,stroke:'#e2c98a','stroke-width':2.2});});
 const mk=(n,c,w)=>{const m=el(d,'marker',{id:`${id}-${n}`,viewBox:'0 0 10 10',refX:7,refY:5,markerWidth:w,markerHeight:w,markerUnits:'userSpaceOnUse',orient:'auto-start-reverse'});el(m,'path',{d:'M0,0 L10,5 L0,10 z',fill:c});};
 for(const [n,c] of [['air',PAL.air],['sup',PAL.sup],['ext',PAL.ext],['oda',PAL.oda],['eha',PAL.eha],['ink',PAL.sub],['hs',PAL.hs],['hr',PAL.hr]])mk(n,c,12);}
// Returns a drawing context for a plan sheet in the shared mapping.
function plan(svg,o){svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${PX.W} ${PX.H}`);defs(svg);const id=svg.id,X=PX.X,Y=PX.Y,K=PX.K;
 const g={svg,id,X,Y,K,o,url:n=>`url(#${id}-${n})`};
 g.el=(tag,a,t,p)=>el(p||svg,tag,a,t);
 g.rect=(x0,x1,z0,z1,a,p)=>el(p||svg,'rect',Object.assign({x:X(Math.min(z0,z1)),y:Y(Math.min(x0,x1)),width:Math.abs(z1-z0)*K,height:Math.abs(x1-x0)*K},a));
 g.pts=p=>p.map(([z,x])=>X(z).toFixed(1)+','+Y(x).toFixed(1)).join(' ');
 g.line=(p,col,w,a={},par)=>el(par||svg,'polyline',Object.assign({points:g.pts(p),fill:'none',stroke:col,'stroke-width':w,'stroke-linecap':'round','stroke-linejoin':'round'},a));
 g.poly=(p,a,par)=>el(par||svg,'polygon',Object.assign({points:g.pts(p)},a));
 g.circle=(z,x,r,a,par)=>el(par||svg,'circle',Object.assign({cx:X(z),cy:Y(x),r},a));
 g.text=(z,x,t,a={},par)=>el(par||svg,'text',Object.assign({x:X(z),y:Y(x),'text-anchor':'middle','font-size':11,fill:PAL.txt,'paint-order':'stroke',stroke:'#fff','stroke-width':3,'stroke-linejoin':'round'},a),t);
 // duct / pipe with a white casing, so crossings read as one over the other
 g.duct=(p,col,w,a={})=>{g.line(p,'#fff',w+3,a);return g.line(p,col,w,a);};
 g.pair=(p,col,a={})=>{g.line(p,'#fff',7,a);g.line(p,col,5.2,a);g.line(p,'#fff',1.5,a);};
 g.tag=(z,x,t,col,r=10)=>{g.circle(z,x,r,{fill:col,stroke:'#fff','stroke-width':2});el(svg,'text',{x:X(z),y:Y(x)+4,'text-anchor':'middle','font-size':r>9?11:10,'font-weight':800,fill:'#fff'},t);};
 g.callout=(z,x,lz,lx,t,col=PAL.ink)=>{g.line([[z,x],[lz,lx]],col,1.1);g.circle(z,x,2.4,{fill:col});g.tag(lz,lx,t,col,10.5);};
 // sheet frame, title and subtitle
 el(svg,'rect',{x:4,y:4,width:PX.W-8,height:PX.H-8,fill:PAL.sheet,stroke:PAL.frame,'stroke-width':1.2,rx:8});
 el(svg,'text',{x:24,y:36,'font-size':18,'font-weight':800,fill:PAL.ink},o.title||'');
 el(svg,'text',{x:24,y:57,'font-size':12,fill:PAL.sub},o.sub||'');
 if(o.code){el(svg,'rect',{x:PX.W-96,y:18,width:76,height:30,rx:6,fill:PAL.ink});el(svg,'text',{x:PX.W-58,y:38,'text-anchor':'middle','font-size':14,'font-weight':800,fill:'#fff'},o.code);}
 g.layer=()=>el(svg,'g');
 return g;}

// Exterior shell: EPS 200 outside, masonry 300, inner face. ring = [x0,x1,z0,z1] outer.
function shell(g,r,o={}){const [x0,x1,z0,z1]=r;g.rect(x0,x1,z0,z1,{fill:g.url('eps'),stroke:PAL.epsEdge,'stroke-width':.8});
 g.rect(x0+.2,x1-.2,z0+.2,z1-.2,{fill:o.fade?'#c4cbc6':PAL.wall,stroke:PAL.wallEdge,'stroke-width':.8});g.rect(x0+.5,x1-.5,z0+.5,z1-.5,{fill:'#fff',stroke:PAL.wallEdge,'stroke-width':.6});}
function openings(g,list){for(const [s,a,b,k] of list){let r;
  if(s==='k')r=[-.2,.3,a,b];else if(s==='t')r=[8.0,8.5,a,b];else if(s==='f')r=[a,b,-.2,.3];else if(s==='b')r=[a,b,11.6,12.1];else if(s==='p')r=[a,b,15.9,16.4];else r=[a,b,18.2,18.7];
  const along=s==='k'||s==='t';g.rect(...r,{fill:'#fff'});
  const [x0,x1,z0,z1]=r,mid=along?(x0+x1)/2:(z0+z1)/2;
  if(k==='d'){const p=along?[[mid,a],[mid,b]]:[[a,mid],[b,mid]];g.line(along?[[a,x0],[a,x1]]:[[z0,a],[z1,a]],PAL.wallEdge,.8);g.line(along?[[b,x0],[b,x1]]:[[z0,b],[z1,b]],PAL.wallEdge,.8);g.line(along?[[a,(x0+x1)/2],[b,(x0+x1)/2]]:[[(z0+z1)/2,a],[(z0+z1)/2,b]],PAL.faint,1,{'stroke-dasharray':'3 3'});}
  else for(const off of [-.05,.05]){const c=(along?(x0+x1)/2:(z0+z1)/2)+off;g.line(along?[[a,c],[b,c]]:[[c,a],[c,b]],PAL.glass,k==='hs'?1.8:1.3);}
  if(k!=='d')g.line(along?[[a,x0],[a,x1]]:[[z0,a],[z1,a]],PAL.wallEdge,.8),g.line(along?[[b,x0],[b,x1]]:[[z0,b],[z1,b]],PAL.wallEdge,.8);}}
function partitions(g,list){for(const [x0,x1,z0,z1,doors=[],axis] of list){
 const c=axis==='z'?[z0,...doors.flat(),z1]:[x0,...doors.flat(),x1];
 for(let i=0;i<c.length;i+=2)axis==='z'?g.rect(x0,x1,c[i],c[i+1],{fill:PAL.part,stroke:PAL.partEdge,'stroke-width':.7}):g.rect(c[i],c[i+1],z0,z1,{fill:PAL.part,stroke:PAL.partEdge,'stroke-width':.7});
 for(const [a,b] of doors)axis==='z'?g.line([[a,(x0+x1)/2],[b,(x0+x1)/2]],PAL.faint,1,{'stroke-dasharray':'3 3'}):g.line([[(z0+z1)/2,a],[(z0+z1)/2,b]],PAL.faint,1,{'stroke-dasharray':'3 3'});}}
const fixRect=(g,r,a={})=>g.rect(...r,Object.assign({fill:'none',stroke:PAL.fix,'stroke-width':1.1},a));
function stairs(g,x0,x1,z0,z1){g.rect(x0,x1,z0,z1,{fill:'#f7f8f6',stroke:PAL.fix,'stroke-width':1});for(let z=z0+.28;z<z1-.05;z+=.28)g.line([[z,x0],[z,x1]],PAL.fix,.8);}

// Ground floor base: main house, passage, plant room, fixtures. o.fade draws it lighter (penetration plan).
function groundBase(g,o={}){
 g.rect(-.2,8.5,12.1,15.9,{fill:'#f3f4f1',stroke:PAL.epsEdge,'stroke-dasharray':'5 4'});
 shell(g,[-.2,8.5,-.2,12.1],o);shell(g,[-.2,8.5,15.9,18.7],o);openings(g,OPEN.g);if(o.under)o.under(g);partitions(g,PARTS.g);
 fixRect(g,[.3,.9,6.2,9.22]);fixRect(g,[2.0,3.05,6.65,8.75],{rx:3});fixRect(g,[5.35,7.05,9.62,10.32],{rx:8});fixRect(g,[2.75,3.35,9.9,11.55],{'stroke-dasharray':'4 3'});
 stairs(g,5.25,8.0,4.45,7.23);g.rect(5.25,6.25,3.85,5.2,{fill:'#d9dcd9',stroke:PAL.fix});g.text(4.52,5.83,'krb',{'font-size':9.5,fill:PAL.sub});
 g.circle(PLANT.tv[0],PLANT.tv[1],PLANT.tv[2]*PX.K,{fill:'#fff',stroke:'#8e9a93','stroke-width':1.3});g.text(PLANT.tv[0],PLANT.tv[1]+.08,'TV 300',{'font-size':9,fill:PAL.sub});
 g.circle(PLANT.aku[0],PLANT.aku[1],PLANT.aku[2]*PX.K,{fill:'#fff',stroke:'#8e9a93','stroke-width':1.3});g.text(PLANT.aku[0],PLANT.aku[1]+.08,'AKU',{'font-size':9,fill:PAL.sub});
 g.rect(...PLANT.rtl,{fill:'#fff',stroke:'#8e9a93'});g.text((PLANT.rtl[2]+PLANT.rtl[3])/2-.36,(PLANT.rtl[0]+PLANT.rtl[1])/2+.06,'RTL',{'font-size':8.5,fill:PAL.sub});
 g.rect(...PLANT.hp,{fill:'#e3e7e4',stroke:'#7d8b83'});g.text((PLANT.hp[2]+PLANT.hp[3])/2,PLANT.hp[0]-.18,'TČ',{'font-size':10,'font-weight':700});
 g.text(14.0,4.2,'Průjezd',{'font-size':12,fill:PAL.sub,'font-weight':600});g.text(14.0,4.6,'venkovní prostor',{'font-size':9.5,fill:PAL.faint});}
// Attic base for the variant: shell, gable openings, partitions, slopes and roof windows, stair opening, chimney, frames.
function atticBase(g,variant,o={}){const cmp=variant==='compact';
 shell(g,[-.2,8.5,-.2,18.7],o);openings(g,OPEN.a);
 for(const [a,b] of [[.3,FLAT[0]],[FLAT[1],8.0]])g.rect(a,b,.3,18.2,{fill:'#f3f5f2'});
 const rw=ROOFWIN[variant];for(const z of rw.k)g.rect(.93,1.92,z,z+.66,{fill:'#e3eef3',stroke:PAL.glass,'stroke-width':.8,'stroke-dasharray':'3 2'});for(const z of rw.t)g.rect(6.38,7.37,z,z+.66,{fill:'#e3eef3',stroke:PAL.glass,'stroke-width':.8,'stroke-dasharray':'3 2'});
 if(cmp){g.rect(.3,8.0,13.17,18.2,{fill:g.url('loft')});g.rect(.3,8.0,12.9,13.17,{fill:'#e7dfc4',stroke:PAL.partEdge});g.rect(3.8,4.6,12.9,13.17,{fill:'#fff'});
  g.text(15.7,3.3,'Půda – neobytná',{'font-size':12,'font-weight':600,fill:PAL.sub});g.text(15.7,3.7,'nevytápěná, studená (mimo obálku)',{'font-size':9.5,fill:PAL.faint});}
 g.rect(5.25,8.0,5.57,7.23,{fill:g.url('h'),stroke:PAL.fix});g.rect(6.25,8.0,4.45,5.57,{fill:g.url('h'),stroke:PAL.fix});g.text(6.4,6.77,'otvor schodiště',{'font-size':9,fill:PAL.sub});
 if(o.under)o.under(g);partitions(g,PARTS[variant]);
 fixRect(g,[4.28,6.33,1.45,3.05],{rx:3});
 if(cmp){fixRect(g,[2.49,3.49,5.3,6.4]);fixRect(g,[5.7,6.6,8.45,9.4]);fixRect(g,[2.87,3.47,9.4,11.3],{'stroke-dasharray':'4 3'});}
 else fixRect(g,[2.49,3.49,5.3,6.4]);
 if(o.flat!==false)for(const x of FLAT)g.line([[.3,x],[18.2,x]],'#93a097',1.1,{'stroke-dasharray':'9 5'});
 g.rect(CHIMNEY[0],CHIMNEY[1],CHIMNEY[2],CHIMNEY[3],{fill:'#7b5a46'});
 if(o.frames)for(const [n,z] of FRAMES){g.rect(3.5,4.9,z-.035,z+.035,{fill:PAL.steel,'fill-opacity':.5});g.rect(4.12,4.27,z-.07,z+.07,{fill:PAL.steel});g.text(z+.16,4.65,n,{'font-size':9,fill:PAL.steel,'font-weight':700,'text-anchor':'start'});}}
// Room tags, drawn after the installations so they stay legible. over: {id or name: [z,x]} moves a tag, hide: [names].
function roomTags(g,which,o={}){for(const [id,n,r,at,noArea] of ROOMS[which]){const key=id||n;if((o.hide||[]).includes(key))continue;const [z,x]=(o.over||{})[key]||at;
 const stack=(o.stack||[]).includes(key);
 if(stack){if(id)g.text(z,x-.3,id,{'font-size':11.5,'font-weight':800,fill:PAL.ink});g.text(z,x,n,{'font-size':11.5,'font-weight':500,fill:PAL.ink});}
 else{const t=g.text(z,x,'',{'font-size':11.5,fill:PAL.ink});if(id)el(t,'tspan',{'font-weight':800},id+' ');el(t,'tspan',{'font-weight':500},n);}
 if(!noArea&&!o.noArea)g.text(z,x+.3,f1(area(r))+' m²',{'font-size':9.5,fill:PAL.sub});}}
// Overall dimensions (metres from the model) along the terrace side and across the front gable.
function dims(g,list,xAt){const tick=(z,x)=>g.line([[z-.09,x+.09],[z+.09,x-.09]],PAL.ink,1.2);
 g.line([[list[0],xAt],[list[list.length-1],xAt]],PAL.ink,.8);for(const z of list){tick(z,xAt);g.line([[z,xAt-.14],[z,xAt+.08]],PAL.faint,.7);}
 for(let i=1;i<list.length;i++)g.text((list[i]+list[i-1])/2,xAt-.08,f2(list[i]-list[i-1]),{'font-size':10,fill:PAL.ink});}
function dimX(g,zAt,a,b){g.line([[zAt,a],[zAt,b]],PAL.ink,.8);for(const x of [a,b])g.line([[zAt-.09,x+.09],[zAt+.09,x-.09]],PAL.ink,1.2);
 g.text(zAt-.1,(a+b)/2,f2(b-a),{'font-size':10,fill:PAL.ink,transform:`rotate(-90 ${PX.X(zAt-.1)} ${PX.Y((a+b)/2)})`});}
// Legend, scale bar, north arrow and title block in the bottom strip.
// items: {k:'line'|'pair'|'dash'|'disc'|'sq'|'fill'|'tag'|'arrow'|'riser', c, w, f, t}
function finish(g,items,tb){const svg=g.svg,y0=PX.H-112;
 el(svg,'line',{x1:16,y1:y0-8,x2:PX.W-16,y2:y0-8,stroke:PAL.frame,'stroke-width':1});
 items.forEach((it,i)=>{const col=Math.floor(i/5),row=i%5,x=24+col*232,y=y0+10+row*20,c=it.c||PAL.ink;
  if(it.k==='line'||it.k==='dash')el(svg,'line',{x1:x,y1:y,x2:x+28,y2:y,stroke:c,'stroke-width':it.w||3,'stroke-dasharray':it.k==='dash'?'6 4':null,'stroke-linecap':'round'});
  else if(it.k==='pair'){el(svg,'line',{x1:x,y1:y,x2:x+28,y2:y,stroke:c,'stroke-width':5.2});el(svg,'line',{x1:x,y1:y,x2:x+28,y2:y,stroke:'#fff','stroke-width':1.5});}
  else if(it.k==='disc'){el(svg,'circle',{cx:x+14,cy:y,r:7,fill:'#fff',stroke:c,'stroke-width':2.4});el(svg,'circle',{cx:x+14,cy:y,r:2.4,fill:c});}
  else if(it.k==='sq')el(svg,'rect',{x:x+7,y:y-7,width:14,height:14,rx:2.5,fill:'#fff',stroke:c,'stroke-width':2.4});
  else if(it.k==='fill')el(svg,'rect',{x:x+2,y:y-6,width:24,height:12,fill:it.f,stroke:c,'stroke-width':1});
  else if(it.k==='tag'){el(svg,'circle',{cx:x+14,cy:y,r:8,fill:c});el(svg,'text',{x:x+14,y:y+3.5,'text-anchor':'middle','font-size':9,'font-weight':800,fill:'#fff'},it.s||'');}
  else if(it.k==='riser'){el(svg,'circle',{cx:x+14,cy:y,r:8,fill:'#fff',stroke:c,'stroke-width':2.4});el(svg,'text',{x:x+14,y:y+4,'text-anchor':'middle','font-size':10,'font-weight':800,fill:c},it.s||'↑');}
  else if(it.k==='arrow'){el(svg,'line',{x1:x,y1:y,x2:x+26,y2:y,stroke:c,'stroke-width':2.2,'stroke-dasharray':'6 4','marker-end':g.url('air')});}
  el(svg,'text',{x:x+36,y:y+4,'font-size':10.5,fill:PAL.txt},it.t);});
 // north arrow: plan up is the driveway side at 344°, so north is 16° clockwise from up
 const nx=748,ny=y0+42;el(svg,'circle',{cx:nx,cy:ny,r:22,fill:'#fff',stroke:PAL.frame});const a=el(svg,'g',{transform:`rotate(16 ${nx} ${ny})`});
 el(a,'path',{d:`M${nx} ${ny-19} L${nx+6} ${ny+5} L${nx} ${ny} L${nx-6} ${ny+5} z`,fill:PAL.ink});el(a,'text',{x:nx,y:ny-24,'text-anchor':'middle','font-size':11,'font-weight':800,fill:PAL.ink},'S');
 el(svg,'text',{x:nx,y:ny+38,'text-anchor':'middle','font-size':9,fill:PAL.sub},'sever');
 // scale bar 0-3 m
 const sx=790,sy=y0+48;for(let i=0;i<3;i++)el(svg,'rect',{x:sx+i*PX.K,y:sy-5,width:PX.K,height:6,fill:i%2?'#fff':PAL.ink,stroke:PAL.ink,'stroke-width':.8});
 for(let i=0;i<=3;i++)el(svg,'text',{x:sx+i*PX.K,y:sy+16,'text-anchor':'middle','font-size':9.5,fill:PAL.txt},i+(i===3?' m':''));
 el(svg,'text',{x:sx,y:sy-12,'font-size':9.5,fill:PAL.sub},'grafické měřítko');
 // title block
 const bx=PX.W-268,by=y0-2,bw=252,bh=100;el(svg,'rect',{x:bx,y:by,width:bw,height:bh,fill:'#fff',stroke:PAL.ink,'stroke-width':1.2});
 for(const yy of [24,62,82])el(svg,'line',{x1:bx,y1:by+yy,x2:bx+bw,y2:by+yy,stroke:PAL.ink,'stroke-width':.7});
 el(svg,'text',{x:bx+10,y:by+16,'font-size':9.5,'font-weight':700,fill:PAL.sub,'letter-spacing':'.06em'},'RD HÁJEK · KRÁSNÝ LES 49/5');
 el(svg,'text',{x:bx+10,y:by+41,'font-size':13.5,'font-weight':800,fill:PAL.ink},tb.title);el(svg,'text',{x:bx+10,y:by+56,'font-size':10,fill:PAL.sub},tb.sub||'');
 el(svg,'text',{x:bx+10,y:by+76,'font-size':10,fill:PAL.txt},`výkres ${tb.code} · stav 10/2026`);
 el(svg,'text',{x:bx+10,y:by+94,'font-size':9,fill:PAL.sub},'pracovní podklad, souřadnice z 3D modelu ±10 cm');}

// ---------------------------------------------------------------- exploded oblique projection
// Looking at the terrace (HS) side from slightly above: z to the right, height up, depth (8.5 - x) recedes up and right, so the
// kitchen side is at the back, as on the plans. lev(y) maps a height to the exploded drawing height.
function iso(svg,o){svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${o.W} ${o.H}`);defs(svg);const id=svg.id;
 const P=(x,y,z)=>{const d=8.5-x,yy=o.lev(y);return [o.OX+z*o.K+d*o.K*o.cx,o.OY-yy*o.K-d*o.K*o.cy];};
 const S=a=>a.map(q=>P(...q).map(n=>n.toFixed(1)).join(',')).join(' ');
 const shade=(c,f)=>'#'+c.slice(1).match(/../g).map(h=>Math.max(0,Math.min(255,Math.round(parseInt(h,16)*f))).toString(16).padStart(2,'0')).join('');
 const i={svg,id,P,shade,url:n=>`url(#${id}-${n})`};
 i.poly=(a,at,p)=>el(p||svg,'polygon',Object.assign({points:S(a)},at));
 i.line=(a,col,w,at={},p)=>el(p||svg,'polyline',Object.assign({points:S(a),fill:'none',stroke:col,'stroke-width':w,'stroke-linecap':'round','stroke-linejoin':'round'},at));
 i.pipe=(a,col,w,at={})=>{i.line(a,shade(col,.62),w+1.8,at);i.line(a,col,w,at);i.line(a,'#fff',Math.max(.8,w*.28),Object.assign({opacity:.45},at));};
 i.box=(x0,x1,y0,y1,z0,z1,c,op=1,at={})=>{const a=Object.assign({stroke:shade(c,.66),'stroke-width':.8,opacity:op},at);
  i.poly([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],Object.assign({fill:c},a));
  i.poly([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],Object.assign({fill:shade(c,1.06)},a));
  i.poly([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],Object.assign({fill:shade(c,.86)},a));};
 i.plate=(x0,x1,z0,z1,y,at)=>i.poly([[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]],at);
 i.cyl=(x,z,y0,y1,r,c)=>{const [ax,ay]=P(x,y0,z),[bx,by]=P(x,y1,z),w=r*o.K;el(svg,'rect',{x:ax-w,y:by,width:2*w,height:ay-by,fill:c,stroke:shade(c,.66),'stroke-width':.8});
  el(svg,'ellipse',{cx:bx,cy:by,rx:w,ry:w*.38,fill:shade(c,1.06),stroke:shade(c,.66),'stroke-width':.8});};
 i.walls=(list,y,at={stroke:'#a8b3ac','stroke-width':1.3})=>{for(const [x0,x1,z0,z1,doors=[],axis] of list){
  if(axis==='z'){const c=[z0,...doors.flat(),z1],x=(x0+x1)/2;for(let k=0;k<c.length;k+=2)i.line([[x,y,c[k]],[x,y,c[k+1]]],at.stroke,at['stroke-width']);}
  else{const c=[x0,...doors.flat(),x1],z=(z0+z1)/2;for(let k=0;k<c.length;k+=2)i.line([[c[k],y,z],[c[k+1],y,z]],at.stroke,at['stroke-width']);}}};
 i.text=(x,y,z,t,at={})=>{const [px,py]=P(x,y,z);return el(svg,'text',Object.assign({x:px,y:py,'font-size':11,fill:PAL.sub,'text-anchor':'middle','paint-order':'stroke',stroke:'#fff','stroke-width':3,'stroke-linejoin':'round'},at),t);};
 const marks=[];i.mark=(q,dx,dy,n,col,text)=>marks.push({q,dx,dy,n,col,text});
 i.marks=(list)=>{for(const m of marks){const [x,y]=P(...m.q),cx=x+m.dx,cy=y+m.dy;if(m.dx||m.dy)el(svg,'line',{x1:x,y1:y,x2:cx,y2:cy,stroke:'#5f6d65','stroke-width':1.1});
  el(svg,'circle',{cx:x,cy:y,r:2.6,fill:'#5f6d65'});el(svg,'circle',{cx,cy,r:11,fill:m.col,stroke:'#fff','stroke-width':2});el(svg,'text',{x:cx,y:cy+4.2,'text-anchor':'middle','font-size':11.5,'font-weight':800,fill:'#fff'},String(m.n));}
  if(list)list.innerHTML=marks.sort((a,b)=>a.n-b.n).map(m=>`<li><b style="background:${m.col}">${m.n}</b><span>${m.text}</span></li>`).join('');};
 return i;}

// ---------------------------------------------------------------- shared drawing: ceiling penetrations
const WHO={vzt:['#2a6fd6','rekuperace'],top:['#c0392b','topení a voda'],kan:['#2f8a4c','kanalizace'],ele:['#8e44ad','elektro']};
function penetrations(svg){const g=plan(svg,{title:'Prostupy stropem přízemí · všechny profese',sub:'Pohled shora na strop přízemí (stropní panely 250 mm). Otvory dělá výrobce panelů podle výrobního výkresu, na stavbě se nevrtá.',code:'P-01'});
 groundBase(g,{fade:true});
 // panels span across the house between the long walls
 g.line([[13.1,.4],[13.1,7.9]],'#9aa59f',1.2,{'marker-end':g.url('ink'),'marker-start':g.url('ink')});
 for(const [x,t] of [[1.15,'panely vedou napříč domem,'],[1.45,'nesou je podélné zdi,'],[1.75,'rozpětí ~7,7 m']])g.text(14.3,x,t,{'font-size':9.5,fill:PAL.sub});
 // cast strips: DB at the plant-room gable for P1 + C + E1, Z2 at the wall to the passage; cut-out for S2 + V3 on the edge of panel 06
 g.rect(3.35,4.75,17.85,18.2,{fill:'#f6e2c7',stroke:'#c79a5a','stroke-dasharray':'4 3'});g.rect(.3,8.0,10.835,11.6,{fill:'#f6e2c7',stroke:'#c79a5a','stroke-dasharray':'4 3'});
 g.rect(.38,.62,5.645,5.945,{fill:'#fff',stroke:'#c79a5a','stroke-dasharray':'3 2'});
 for(const p of PEN){const c=WHO[p.who][0];g.circle(...p.at,Math.max(4.5,p.d/2*PX.K),{fill:'#fff',stroke:c,'stroke-width':2.4});g.line([[p.at[0]-.16,p.at[1]],[p.at[0]+.16,p.at[1]]],c,.8);g.line([[p.at[0],p.at[1]-.16],[p.at[0],p.at[1]+.16]],c,.8);}
 // dimension each penetration from the inner wall faces
 const dz=(z,x,z0)=>{g.line([[z0,x],[z,x]],PAL.ink,.7,{'stroke-dasharray':'2 2'});g.text((z+z0)/2,x-.1,f2(Math.abs(z-z0)),{'font-size':9.5,fill:PAL.ink});};
 const dx=(z,x,x0)=>{g.line([[z,x0],[z,x]],PAL.ink,.7,{'stroke-dasharray':'2 2'});g.text(z+.12,(x+x0)/2,f2(Math.abs(x-x0)),{'font-size':9.5,fill:PAL.ink,'text-anchor':'start'});};
 dz(1.22,3.99,.3);dz(1.42,4.27,.3);dx(1.22,3.99,.3);dz(11.0,3.75,11.6);dz(11.3,2.6,11.6);dx(9.45,2.95,.3);dz(5.85,.5,.3);dx(5.85,.5,.3);dx(10.27,7.7,8.0);
 for(const [x,t] of [[2.6,'pás Z2 u zadní stěny (z 10,84–11,60):'],[2.9,'osy B 2,76 · P3 2,95 · E2 2,65 a 2,81 m'],[3.2,'od líce stěny na straně příjezdu,'],[3.5,'K1 0,30 a V2 0,12 m od líce u terasy']])g.text(14.0,x,t,{'font-size':9.5,fill:PAL.ink});
 for(const [x,t] of [[5.5,'P1 + C + E1 u štítu technické m.:'],[5.8,'osy C 3,20 · P1 3,57 a 3,93 · E1 4,30 m'],[6.1,'od líce stěny na straně příjezdu,'],[6.4,'0,20 m od líce štítu']])g.text(14.0,x,t,{'font-size':9.5,fill:PAL.ink});
 const lab=(z,x,t,c,anchor='middle')=>g.text(z,x,t,{'font-size':11,'font-weight':800,fill:c,'text-anchor':anchor});
 lab(17.52,3.45,'C',WHO.top[0]);lab(17.52,4.07,'P1',WHO.vzt[0]);lab(1.75,3.99,'P2',WHO.vzt[0]);lab(11.0,3.55,'P3',WHO.vzt[0]);lab(9.05,2.99,'P9',WHO.vzt[0],'end');lab(10.86,3.12,'B',WHO.top[0],'end');lab(17.52,4.7,'E1',WHO.ele[0]);lab(11.3,2.82,'E2',WHO.ele[0]);
 lab(6.25,.62,'S2',WHO.kan[0],'start');lab(10.27,7.35,'K2',WHO.kan[0]);lab(11.42,7.5,'K1',WHO.kan[0]);lab(5.55,.62,'V3',WHO.top[0],'end');lab(11.3,7.98,'V2',WHO.top[0],'end');g.text(5.55,.9,'0,14 od S2',{'font-size':9,fill:PAL.ink,'text-anchor':'end'});
 g.text(14.0,6.75,'v dobetonávce (oranžově)',{'font-size':9.5,fill:'#8a5a17'});g.text(14.0,3.8,'v pásu Z2 (oranžově), chráničky před betonáží',{'font-size':9.5,fill:'#8a5a17'});
 roomTags(g,'g',{noArea:true,hide:['1.02']});
 finish(g,[{k:'disc',c:WHO.vzt[0],t:'rekuperace (P1–P3)'},{k:'disc',c:WHO.top[0],t:'topení, voda, data (B, C, V2, V3)'},{k:'disc',c:WHO.kan[0],t:'kanalizace (S2, K1, K2 podle ZTI)'},{k:'disc',c:WHO.ele[0],t:'elektro (E1, E2)'},
  {k:'fill',c:'#c79a5a',f:'#f6e2c7',t:'beton na stavbě (DB, pás Z2)'},{k:'line',c:'#b9c2bc',w:1.4,t:'směr rozpětí panelů'},{k:'dash',c:PAL.ink,w:1,t:'kóta od líce zdi (m)'}],
  {title:'Prostupy stropem přízemí',sub:'všechny profese, pro výrobce panelů',code:'P-01'});}

// ---------------------------------------------------------------- shared drawing: plant room detail (elevation of the gable + plan)
function plantRoom(svg){svg.replaceChildren();svg.setAttribute('viewBox','0 0 1120 980');defs(svg);const K=104;
 const EX=x=>100+(x+.2)*K,EY=h=>410-h*K;                     // elevation: inner face of the gable, seen from the room
 const PXx=x=>100+(x+.2)*K,PYz=z=>575+(18.7-z)*K;              // plan: gable at the top, passage at the bottom
 const T=(x,y,t,a={})=>el(svg,'text',Object.assign({x,y,'font-size':11,fill:PAL.txt,'paint-order':'stroke',stroke:'#fff','stroke-width':3,'stroke-linejoin':'round'},a),t);
 const R=(x,y,w,h,a)=>el(svg,'rect',Object.assign({x,y,width:w,height:h},a));
 const L=(p,c,w,a={})=>el(svg,'polyline',Object.assign({points:p.map(q=>q.map(n=>n.toFixed(1)).join(',')).join(' '),fill:'none',stroke:c,'stroke-width':w,'stroke-linecap':'round','stroke-linejoin':'round'},a));
 const D=(p,c,w,a={})=>{L(p,'#fff',w+3,a);L(p,c,w,a);};
 el(svg,'rect',{x:4,y:4,width:1112,height:972,fill:'#fff',stroke:PAL.frame,'stroke-width':1.2,rx:8});
 el(svg,'text',{x:24,y:34,'font-size':18,'font-weight':800,fill:PAL.ink},'Technická místnost 1.02 · štít a půdorys');
 el(svg,'text',{x:24,y:54,'font-size':12,fill:PAL.sub},'Nahoře štítová stěna zevnitř (okna ve výšce 1,50–2,20 m), dole půdorys se štítem nahoře. Vlevo strana příjezdu, vpravo strana terasy.');
 // ---- elevation
 R(EX(-.2),EY(3.06),8.7*K,(3.06-2.91)*K,{fill:'#eef0ed'});R(EX(-.2),EY(2.91),8.7*K,.25*K,{fill:'#9aa3a0'});T(EX(1.35),EY(2.74),'stropní panel 250',{'font-size':9.5,fill:'#fff',stroke:'none','text-anchor':'start'});
 R(EX(.3),EY(2.66),7.7*K,2.66*K,{fill:'#fbfcfa',stroke:PAL.wallEdge});R(EX(-.2),EY(2.66),.5*K,2.91*K,{fill:PAL.wall});R(EX(8.0),EY(2.66),.5*K,2.91*K,{fill:PAL.wall});
 // ring beam in the cut side walls (bottom +2.435 above the floor): the ceiling panels bear on it, so P4 and P5 pass under it
 for(const x of [-.2,8.0])R(EX(x),EY(2.66),.5*K,(2.66-2.435)*K,{fill:'#7d8784',stroke:PAL.wallEdge});T(EX(8.25),EY(2.55)+4,'věnec',{'text-anchor':'middle','font-size':9,fill:'#fff',stroke:'none'});R(EX(-.2),EY(0),8.7*K,.25*K,{fill:'#c9cfcb'});
 for(const [a,b] of [[1.15,2.15],[3.65,4.65],[6.15,7.15]])R(EX(a),EY(2.2),(b-a)*K,.7*K,{fill:'#e3eef3',stroke:PAL.glass,'stroke-width':1.4});
 L([[EX(.3),EY(2.2)],[EX(8.0),EY(2.2)]],PAL.faint,.8,{'stroke-dasharray':'4 4'});T(EX(2.3),EY(2.2)-4,'nadpraží oken +2,20',{'font-size':9.5,fill:PAL.sub});
 // tanks and heat pump group (schematic)
 R(EX(.7),EY(1.85),.9*K,1.85*K,{fill:'#fff',stroke:'#8e9a93',rx:10});T(EX(1.15),EY(.95),'TV 300',{'text-anchor':'middle','font-size':10,fill:PAL.sub});
 R(EX(2.03),EY(1.0),.54*K,1.0*K,{fill:'#fff',stroke:'#8e9a93',rx:8});T(EX(2.3),EY(.5),'AKU',{'text-anchor':'middle','font-size':10,fill:PAL.sub});
 R(EX(3.15),EY(.75),.9*K,.35*K,{fill:'#fff',stroke:'#8e9a93'});T(EX(3.6),EY(.53),'RTL',{'text-anchor':'middle','font-size':9.5,fill:PAL.sub});
 // heating: from the heat pump through the gable low down, to the plant, up through C
 L([[EX(1.75),EY(.45)],[EX(2.85),EY(.45)],[EX(2.85),EY(1.25)],[EX(3.43),EY(1.25)],[EX(3.43),EY(2.91)]],PAL.hs,3);L([[EX(1.9),EY(.32)],[EX(3.0),EY(.32)],[EX(3.0),EY(1.12)],[EX(3.57),EY(1.12)],[EX(3.57),EY(2.91)]],PAL.hr,3);
 for(const x of [1.75,1.9])el(svg,'circle',{cx:EX(x),cy:EY(x===1.75?.45:.32),r:4,fill:'#fff',stroke:PAL.ink});T(EX(1.81),EY(.1),'z TČ',{'font-size':9.5,fill:PAL.sub,'text-anchor':'middle'});
 // MVHR unit and ducts: mains and their bends stay above the window heads, the exhaust crosses over them; the exhaust and the intake
 // drop just before their side wall and pass through it under the ring beam.
 R(EX(5.1),EY(1.95),.75*K,.85*K,{fill:'#263a30',rx:4});T(EX(5.48),EY(1.5),'jednotka',{'text-anchor':'middle',fill:'#fff',stroke:'none','font-weight':700,'font-size':10.5});
 D([[EX(5.45),EY(1.95)],[EX(5.45),EY(2.33)],[EX(3.87),EY(2.33)],[EX(3.87),EY(2.91)]],PAL.sup,7);
 L([[EX(5.65),EY(1.95)],[EX(5.65),EY(2.33)],[EX(4.23),EY(2.33)],[EX(4.23),EY(2.91)]],PAL.ext,6,{'stroke-dasharray':'7 4'});
 D([[EX(5.25),EY(1.95)],[EX(5.25),EY(2.55)],[EX(1.0),EY(2.55)],[EX(.7),EY(2.25)],[EX(-.35),EY(2.25)]],PAL.eha,7);D([[EX(5.85),EY(1.95)],[EX(5.85),EY(2.38)],[EX(7.25),EY(2.38)],[EX(7.45),EY(2.25)],[EX(8.6),EY(2.25)]],PAL.oda,7);
 R(EX(-.45),EY(2.37),.25*K,.24*K,{fill:PAL.eha,rx:3});R(EX(8.5),EY(2.37),.25*K,.24*K,{fill:PAL.oda,rx:3});
 for(const [x,c] of [[3.87,PAL.sup],[4.23,PAL.ext],[3.5,PAL.hs],[4.6,WHO.ele[0]]])R(EX(x-.11),EY(3.06),.22*K,.4*K,{fill:'#fff',stroke:c,'stroke-width':1.6,'stroke-dasharray':'3 2'});
 T(EX(3.87),EY(3.2),'P1',{'text-anchor':'middle','font-weight':800,fill:PAL.sup});T(EX(4.27),EY(3.2),'P1',{'text-anchor':'middle','font-weight':800,fill:PAL.ext});T(EX(3.45),EY(3.2),'C',{'text-anchor':'middle','font-weight':800,fill:PAL.hs});T(EX(4.67),EY(3.2),'E1',{'text-anchor':'middle','font-weight':800,fill:WHO.ele[0]});
 T(EX(7.97),EY(2.0)+4,'P4 sání bokem',{'text-anchor':'end','font-weight':700,fill:PAL.oda});T(EX(-.3),EY(2.25)-13,'P5 výfuk bokem',{'text-anchor':'start','font-weight':700,fill:PAL.eha});
 // vertical dimensions on the right
 const vd=(h0,h1,t)=>{const x=EX(8.5)+36;L([[x,EY(h0)],[x,EY(h1)]],PAL.ink,.8);for(const h of [h0,h1])L([[x-5,EY(h)+5],[x+5,EY(h)-5]],PAL.ink,1.2);T(x+8,(EY(h0)+EY(h1))/2+4,t,{'font-size':10});};
 vd(0,1.5,'1,50');vd(1.5,2.2,'0,70 okno');vd(2.2,2.66,'0,46 rozvody');
 T(EX(6.0),EY(1.3),'přívod a odvod Ø 180',{'font-size':10,fill:PAL.sub});T(EX(6.0),EY(1.3)+14,'vedou nad okny k P1',{'font-size':10,fill:PAL.sub});T(EX(6.0),EY(1.3)+28,'(odvod za přívodem)',{'font-size':10,fill:PAL.sub});T(EX(1.2),EY(2.55)+15,'výfuk nad nimi, u stěny pod věnec',{'font-size':10,fill:PAL.sub});
 // ---- plan
 const PR=(x0,x1,z0,z1,a)=>R(PXx(x0),PYz(z1),(x1-x0)*K,(z1-z0)*K,a);
 PR(-.2,8.5,15.9,18.7,{fill:`url(#${svg.id}-eps)`,stroke:PAL.epsEdge});PR(0,8.3,16.1,18.5,{fill:PAL.wall,stroke:PAL.wallEdge});PR(.3,8.0,16.4,18.2,{fill:'#fff',stroke:PAL.wallEdge});
 for(const [a,b] of [[1.15,2.15],[3.65,4.65],[6.15,7.15]]){PR(a,b,18.2,18.7,{fill:'#fff'});for(const off of [-.05,.05])L([[PXx(a),PYz(18.45+off)],[PXx(b),PYz(18.45+off)]],PAL.glass,1.3);}
 PR(5.95,6.95,15.9,16.4,{fill:'#fff'});T(PXx(6.45),PYz(16.15)+4,'dveře z průjezdu',{'text-anchor':'middle','font-size':9.5,fill:PAL.sub});
 el(svg,'circle',{cx:PXx(1.15),cy:PYz(17.5),r:.45*K,fill:'#fff',stroke:'#8e9a93','stroke-width':1.3});T(PXx(1.15),PYz(17.5)+4,'TV 300',{'text-anchor':'middle','font-size':10,fill:PAL.sub});
 el(svg,'circle',{cx:PXx(2.3),cy:PYz(17.75),r:.27*K,fill:'#fff',stroke:'#8e9a93','stroke-width':1.3});T(PXx(2.3),PYz(17.75)+4,'AKU',{'text-anchor':'middle','font-size':10,fill:PAL.sub});
 PR(3.15,4.05,17.85,18.15,{fill:'#fff',stroke:'#8e9a93'});PR(1.9,2.2,16.55,17.15,{fill:'#fff',stroke:'#8e9a93'});T(PXx(2.05),PYz(16.4),'řízení TČ',{'text-anchor':'middle','font-size':9.5,fill:PAL.sub});
 PR(1.37,2.47,19.0,19.4,{fill:'#e3e7e4',stroke:'#7d8b83'});T(PXx(1.92),PYz(19.2)+4,'TČ venku',{'text-anchor':'middle','font-size':10,'font-weight':700});
 PR(3.35,4.75,17.85,18.2,{fill:'#f6e2c7',stroke:'#c79a5a','stroke-dasharray':'4 3'});
 L([[PXx(1.71),PYz(19.0)],[PXx(1.71),PYz(17.2)],[PXx(3.43),PYz(17.2)],[PXx(3.43),PYz(17.95)]],PAL.hs,3);L([[PXx(1.89),PYz(19.0)],[PXx(1.89),PYz(17.36)],[PXx(3.57),PYz(17.36)],[PXx(3.57),PYz(17.95)]],PAL.hr,3);
 PR(5.1,5.85,17.64,18.2,{fill:'#263a30',rx:3});
 D([[PXx(5.45),PYz(17.9)],[PXx(5.45),PYz(17.7)],[PXx(3.87),PYz(17.7)],[PXx(3.87),PYz(18.0)]],PAL.sup,7);D([[PXx(5.65),PYz(17.9)],[PXx(5.65),PYz(18.05)],[PXx(4.23),PYz(18.05)]],PAL.ext,7);
 D([[PXx(5.25),PYz(17.9)],[PXx(5.25),PYz(17.25)],[PXx(.7),PYz(17.25)],[PXx(.7),PYz(17.1)],[PXx(-.33),PYz(17.1)]],PAL.eha,7);D([[PXx(5.85),PYz(17.9)],[PXx(8.63),PYz(17.9)]],PAL.oda,7);
 R(PXx(-.47),PYz(17.22),.26*K,.24*K,{fill:PAL.eha,rx:3});R(PXx(8.5),PYz(18.02),.26*K,.24*K,{fill:PAL.oda,rx:3});
 for(const [x,z,c,t] of [[3.87,18.0,PAL.sup,'↑'],[4.23,18.05,PAL.ext,'↑'],[3.5,18.0,PAL.hs,'↑'],[4.6,18.0,WHO.ele[0],'↑']]){el(svg,'circle',{cx:PXx(x),cy:PYz(z),r:9,fill:'#fff',stroke:c,'stroke-width':2.4});T(PXx(x),PYz(z)+4,t,{'text-anchor':'middle','font-weight':800,fill:c,stroke:'none'});}
 // short branches for the room itself and the condensate
 L([[PXx(4.9),PYz(17.7)],[PXx(4.9),PYz(17.45)]],PAL.sup,2.4);L([[PXx(5.65),PYz(17.9)],[PXx(5.65),PYz(17.52)],[PXx(6.35),PYz(17.52)],[PXx(6.35),PYz(17.45)]],PAL.ext,2.4);
 for(const [x,c] of [[4.9,PAL.sup],[6.35,PAL.ext]]){el(svg,'circle',{cx:PXx(x),cy:PYz(17.38),r:7,fill:'#fff',stroke:c,'stroke-width':2.2});el(svg,'circle',{cx:PXx(x),cy:PYz(17.38),r:2.4,fill:c});}
 T(PXx(4.9),PYz(17.38)+20,'15',{'text-anchor':'middle','font-size':10,'font-weight':700,fill:PAL.sup});T(PXx(6.35),PYz(17.38)+20,'15',{'text-anchor':'middle','font-size':10,'font-weight':700,fill:PAL.ext});
 L([[PXx(5.45),PYz(17.64)],[PXx(5.45),PYz(16.8)]],PAL.sub,1.4,{'stroke-dasharray':'4 3'});T(PXx(5.45),PYz(16.8)+15,'kondenzát → podlahová vpusť (D1.2)',{'text-anchor':'middle','font-size':9.5,fill:PAL.sub});
 // plan labels and dimensions from the kitchen-side wall
 PR(2.65,3.45,16.4,16.55,{fill:'#263a30'});T(PXx(3.05),PYz(16.55)-8,'HR',{'text-anchor':'middle','font-size':11,'font-weight':800,fill:'#263a30'});
 T(PXx(4.05),PYz(18.2)-8,'dobetonávka P1 + C + E1',{'text-anchor':'middle','font-size':10,fill:'#8a5a17','font-weight':700});
 const hd=(x0,x1,z,t)=>{L([[PXx(x0),PYz(z)],[PXx(x1),PYz(z)]],PAL.ink,.8);for(const x of [x0,x1])L([[PXx(x)-5,PYz(z)+5],[PXx(x)+5,PYz(z)-5]],PAL.ink,1.2);T((PXx(x0)+PXx(x1))/2,PYz(z)-5,t,{'text-anchor':'middle','font-size':10});};
 hd(.3,3.5,15.65,'3,20');hd(3.5,3.87,15.65,'0,37');hd(3.87,4.23,15.65,'0,36');hd(4.23,8.0,15.65,'3,77');
 for(const x of [3.5,3.87,4.23,4.6])L([[PXx(x),PYz(17.85)],[PXx(x),PYz(15.6)]],PAL.faint,.6,{'stroke-dasharray':'2 3'});
 T(PXx(.35),PYz(15.85),'osy prostupů od líce stěny na straně příjezdu (m)',{'font-size':10,fill:PAL.sub});
 T(PXx(-.33),PYz(17.1)+24,'P5',{'font-weight':800,fill:PAL.eha,'text-anchor':'middle'});T(PXx(8.63),PYz(17.9)+24,'P4',{'font-weight':800,fill:PAL.oda,'text-anchor':'middle'});T(PXx(8.63),PYz(17.9)+38,'0,30 od líce štítu',{'font-size':9.5,fill:PAL.sub,'text-anchor':'middle'});
 // projection lines between plan and elevation for the penetrations
 for(const x of [3.5,3.87,4.23,4.6])L([[EX(x),EY(3.06)],[EX(x),PYz(18.7)]],PAL.faint,.6,{'stroke-dasharray':'1 4'});
 // legend
 const lg=[[PAL.sup,'přívod (V1, P1)'],[PAL.ext,'odvod (V1, P1)'],[PAL.oda,'sání P4'],[PAL.eha,'výfuk P5'],[PAL.hs,'topení přívod (C)'],[PAL.hr,'topení zpátečka']];
 lg.forEach(([c,t],i)=>{const x=24+i*178,y=955;el(svg,'line',{x1:x,y1:y,x2:x+28,y2:y,stroke:c,'stroke-width':5,'stroke-linecap':'round'});el(svg,'text',{x:x+36,y:y+4,'font-size':10.5,fill:PAL.txt},t);});}

window.Dum={PAL,PX,OPEN,PARTS,ROOMS,FLAT,FRAMES,CHIMNEY,PLANT,PEN,el,f1,f2,mm,area,plan,shell,openings,partitions,groundBase,atticBase,roomTags,dims,dimX,finish,iso,penetrations,plantRoom,defs};
})();
