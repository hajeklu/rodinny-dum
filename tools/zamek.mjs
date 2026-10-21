// Encrypted page content (nakup-zdeni.html). The readable source lives in soukrome/<page>.html, which git ignores; the
// page in the repo carries only its AES-256-GCM ciphertext in <script type="text/plain" id="obsah">. The page gets the
// decryption key from the Apps Script (script property OBSAH_KLIC) for a valid access key, see apps-script/Code.gs.
//
//   node tools/zamek.mjs zamknout nakup-zdeni    soukrome/nakup-zdeni.html → ciphertext in nakup-zdeni.html
//   node tools/zamek.mjs odemknout nakup-zdeni   ciphertext in nakup-zdeni.html → soukrome/nakup-zdeni.html
//
// The key is soukrome/klic.txt; zamknout creates it when missing, and a new key has to go to OBSAH_KLIC as well.
// On another machine: copy OBSAH_KLIC into soukrome/klic.txt and run odemknout.
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..'),DIR=join(ROOT,'soukrome'),KEY_FILE=join(DIR,'klic.txt');
const BLOCK=/(<script type="text\/plain" id="obsah">)([^<]*)(<\/script>)/;
const {subtle}=globalThis.crypto,enc=new TextEncoder();
const fail=msg=>{console.error(msg);process.exit(1)};

const [cmd,page]=process.argv.slice(2);
if(!['zamknout','odemknout'].includes(cmd)||!/^[\w-]+$/.test(page||''))fail('Použití: node tools/zamek.mjs zamknout|odemknout <stránka>, např. nakup-zdeni');
const pagePath=join(ROOT,page+'.html'),srcPath=join(DIR,page+'.html');
if(!existsSync(pagePath))fail(`Chybí ${page}.html.`);
const html=readFileSync(pagePath,'utf8'),m=BLOCK.exec(html);
if(!m)fail(`${page}.html nemá blok <script type="text/plain" id="obsah">.`);

function readKey(create){
  if(existsSync(KEY_FILE)){const k=readFileSync(KEY_FILE,'utf8').trim();
    if(Buffer.from(k,'base64url').length!==32)fail('soukrome/klic.txt není 32bajtový klíč v base64url.');return k}
  if(!create)fail('Chybí soukrome/klic.txt. Zkopíruj do něj hodnotu vlastnosti skriptu OBSAH_KLIC.');
  const k=Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
  mkdirSync(DIR,{recursive:true});writeFileSync(KEY_FILE,k+'\n',{mode:0o600});
  console.log('Nový klíč je v soukrome/klic.txt. Vlož ho do Apps Script jako vlastnost skriptu OBSAH_KLIC.');
  return k;
}
const aes=k=>subtle.importKey('raw',Buffer.from(k,'base64url'),'AES-GCM',false,['encrypt','decrypt']);
// the page name is the additional data, so a ciphertext cannot be moved to another page
const algo=iv=>({name:'AES-GCM',iv,additionalData:enc.encode(page)});
async function decrypt(key){
  const raw=Buffer.from(m[2].replace(/\s+/g,''),'base64');if(raw.length<29)return null; // 12 B IV + 16 B tag + content
  try{return Buffer.from(await subtle.decrypt(algo(raw.subarray(0,12)),key,raw.subarray(12))).toString('utf8')}catch(e){return null}
}

if(cmd==='zamknout'){
  if(!existsSync(srcPath))fail(`Chybí soukrome/${page}.html se zdrojem obsahu.`);
  const src=readFileSync(srcPath,'utf8'),key=await aes(readKey(true));
  // a new IV changes the whole ciphertext, so leave the page alone when the content is the same
  if(await decrypt(key)===src){console.log(`${page}.html je aktuální, beze změny.`);process.exit(0)}
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=Buffer.concat([iv,new Uint8Array(await subtle.encrypt(algo(iv),key,enc.encode(src)))]).toString('base64');
  writeFileSync(pagePath,html.replace(BLOCK,(_,a,_b,c)=>a+ct.replace(/.{1,100}/g,'\n$&')+'\n'+c));
  console.log(`Zašifrováno do ${page}.html (${src.length} znaků obsahu).`);
}else{
  const src=await decrypt(await aes(readKey(false)));
  if(src===null)fail(`Obsah ${page}.html nejde tímto klíčem rozšifrovat.`);
  if(existsSync(srcPath)&&readFileSync(srcPath,'utf8')!==src)fail(`soukrome/${page}.html už existuje a liší se. Přejmenuj ho, ať o něj nepřijdeš.`);
  mkdirSync(DIR,{recursive:true});writeFileSync(srcPath,src);
  console.log(`Rozšifrováno do soukrome/${page}.html.`);
}
