// JARVIS V9 — dynamic Home Assistant entity dashboard
import { haWsCall } from "./ha.js";
import { log, logError, logOK } from "./logger.js";
import { getHAUrl } from "./config.js";

const V9 = "V9.0";
const ENTITY_KEY = "jarvis_v9_entities";
const CATEGORIES = [
  ["light", "💡", "Lumière", ["light"]],
  ["climate", "🌡️", "Climatisation / Chauffage", ["climate"]],
  ["access", "🔐", "Accès", ["lock", "binary_sensor"]],
  ["pool", "🏊", "Piscine", ["switch", "sensor", "binary_sensor"]],
  ["car", "🚗", "Voiture", ["device_tracker", "sensor", "binary_sensor"]],
  ["energy", "⚡", "Énergie", ["sensor"]],
  ["media", "🎵", "Média", ["media_player"]],
  ["camera", "📷", "Caméra", ["camera"]],
  ["cover", "🪟", "Volets", ["cover"]],
  ["insideOutside", "🏠", "Intérieur / Extérieur", ["sensor", "binary_sensor"]],
  ["news", "📰", "News / Actualité", ["sensor", "feedreader"]],
  ["sport", "⚽", "Sport", ["sensor"]]
];
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c[0], c]));
const DOMAIN_HINTS = {
  light: "light", climate: "climate", lock: "access", camera: "camera", cover: "cover", media_player: "media",
  device_tracker: "car", update: "system", sensor: null, binary_sensor: null
};
function token(){try{return localStorage.getItem("jarvis_ha_token")?.trim()||""}catch{return ""}}
function loadSelection(){try{return JSON.parse(localStorage.getItem(ENTITY_KEY)||"{}")}catch{return {}}}
function saveSelection(v){try{localStorage.setItem(ENTITY_KEY,JSON.stringify(v));return true}catch{return false}}
function friendly(id){return id.split(".")[1]?.replaceAll("_"," ")||id}
function inferCategory(s){
  const d=s.entity_id.split(".")[0];
  if(DOMAIN_HINTS[d]) return DOMAIN_HINTS[d];
  const t=`${s.entity_id} ${s.attributes?.friendly_name||""}`.toLowerCase();
  if(/pool|piscine|filtration|pompe.*pisc/.test(t)) return "pool";
  if(/volet|shutter|blind/.test(t)) return "cover";
  if(/voiture|car|tesla|ev|charge|battery.*vehicle/.test(t)) return "car";
  if(/salon|cuisine|chambre|bureau|maison|extérieur|exterieur|temperature.*ext/.test(t)) return "insideOutside";
  if(/news|actualit|rss|sport|foot|football|match/.test(t)) return /sport|foot|match/.test(t)?"sport":"news";
  return null;
}
function fmtState(s){
  const a=s.attributes||{}, d=s.entity_id.split(".")[0];
  if(d==="light") return s.state==="on"?`ALLUMÉE${a.brightness!=null?` • ${Math.round(a.brightness/255*100)}%`:""}`:"ÉTEINTE";
  if(d==="climate") return `${s.state?.toUpperCase()||"--"}${a.current_temperature!=null?` • ${a.current_temperature}°C`:""}${a.temperature!=null?` → ${a.temperature}°C`:""}`;
  if(d==="lock") return s.state==="locked"?"VERROUILLÉ":"DÉVERROUILLÉ";
  if(d==="cover") return a.current_position!=null?`${s.state?.toUpperCase()} • ${a.current_position}%`:s.state?.toUpperCase()||"--";
  if(d==="media_player") return `${s.state?.toUpperCase()||"--"}${a.media_title?` • ${a.media_title}`:""}${a.volume_level!=null?` • ${Math.round(a.volume_level*100)}%`:""}`;
  if(a.battery_level!=null) return `${s.state} • Batterie ${a.battery_level}%`;
  if(a.unit_of_measurement) return `${s.state} ${a.unit_of_measurement}`;
  return s.state?.toUpperCase()||"--";
}
function detail(s){
  const a=s.attributes||{}, out=[];
  if(a.battery_level!=null)out.push(`🔋 ${a.battery_level}%`);
  if(a.current_temperature!=null)out.push(`🌡️ ${a.current_temperature}°C`);
  if(a.temperature!=null)out.push(`🎯 ${a.temperature}°C`);
  if(a.current_position!=null)out.push(`📐 ${a.current_position}%`);
  if(a.power!=null)out.push(`⚡ ${a.power} W`);
  if(a.media_artist)out.push(`🎤 ${a.media_artist}`);
  return out.join(" • ");
}
async function states(){if(!token()||!getHAUrl())return [];return await haWsCall("get_states",{},token())}
async function callService(s,on){const [domain,entity]=s.entity_id.split(".");let service=on?"turn_on":"turn_off";if(domain==="lock")service=on?"lock":"unlock";if(domain==="cover")service=on?"open_cover":"close_cover";await haWsCall("call_service",{domain,service,service_data:{entity_id:s.entity_id}},token())}
function css(){
 const st=document.createElement("style");st.id="jarvisV9Style";st.textContent=`
 #jarvisV9Nav{position:fixed;top:max(12px,env(safe-area-inset-top));right:12px;z-index:2147483001;display:flex;gap:6px}.jarvisV9Btn{width:38px;height:38px;border:1px solid rgba(126,239,255,.35);border-radius:10px;background:rgba(2,8,18,.88);color:#7eefff;font-size:18px;box-shadow:0 0 14px rgba(0,200,238,.12)}
 #jarvisV9Refresh{position:fixed;right:10px;bottom:8px;z-index:2147483002;width:34px;height:34px;border:1px solid rgba(126,239,255,.28);border-radius:9px;background:rgba(2,8,18,.92);color:#7eefff;font-size:17px}
 .jarvisV9Modal{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.76);display:none;align-items:center;justify-content:center;padding:16px}.jarvisV9Modal.open{display:flex}.jarvisV9Card{width:min(760px,100%);max-height:88vh;overflow:auto;background:#07111f;border:1px solid rgba(0,220,255,.5);border-radius:16px;padding:18px;color:#dffaff;font-family:Rajdhani,Arial}.jarvisV9Card h2{margin:0 0 12px;font:900 18px Orbitron;color:#7eefff}.jarvisV9Tabs{display:flex;gap:6px;overflow:auto;margin-bottom:12px}.jarvisV9Tab{white-space:nowrap;border:1px solid #24516b;background:#0a1b2a;color:#bcefff;border-radius:8px;padding:8px}.jarvisV9Tab.active{background:#064b5b;border-color:#00c8ee}.jarvisV9Entity{display:grid;grid-template-columns:1fr auto;gap:4px;padding:10px;border:1px solid rgba(126,239,255,.12);border-radius:9px;margin:6px 0;background:rgba(2,8,18,.48)}.jarvisV9Name{font-weight:700}.jarvisV9State{font-size:12px;color:#7eefff;text-align:right}.jarvisV9Detail{grid-column:1/-1;font-size:11px;opacity:.72}.jarvisV9Actions{display:flex;gap:6px;grid-column:1/-1}.jarvisV9Actions button{flex:1;border:1px solid #24516b;background:#0a1b2a;color:#dffaff;border-radius:6px;padding:6px}.jarvisV9Pick{display:flex;align-items:center;gap:8px}.jarvisV9Pick input{accent-color:#00c8ee}.jarvisV9Dash{margin-top:18px}.jarvisV9DashTitle{font:800 15px Orbitron;color:#7eefff;margin:18px 0 8px}.jarvisV9Grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}.jarvisV9Mini{padding:12px;border:1px solid rgba(126,239,255,.14);border-radius:12px;background:linear-gradient(145deg,rgba(7,17,31,.9),rgba(2,8,18,.9))}.jarvisV9Mini strong{display:block}.jarvisV9Mini .state{margin-top:5px;color:#7eefff;font-size:12px}.jarvisV9Mini .detail{margin-top:5px;opacity:.7;font-size:11px}.jarvisV9Hidden{display:none!important}
 body.jarvisV9ModalOpen #jarvisV9Nav,body.jarvisV9ModalOpen #jarvisV9Refresh{display:none!important}
 `;document.head.appendChild(st)
}
function hideLegacy(){["jarvisAccountButton","jarvisRefreshButton"].forEach(id=>document.getElementById(id)?.classList.add("jarvisV9Hidden"));const s=document.getElementById("jarvisSettingsButton");if(s){s.title="Réglages";s.setAttribute("aria-label","Réglages")}}
function nav(){if(document.getElementById("jarvisV9Nav"))return;hideLegacy();const n=document.createElement("div");n.id="jarvisV9Nav";n.innerHTML=`<button class="jarvisV9Btn" id="jarvisV9Categories" title="Catégories">🗂️</button><button class="jarvisV9Btn" id="jarvisV9Settings" title="Réglages">⚙️</button>`;document.body.append(n);const r=document.createElement("button");r.id="jarvisV9Refresh";r.title="Mise à jour";r.textContent="↻";document.body.append(r);document.getElementById("jarvisV9Settings").onclick=()=>{document.getElementById("jarvisSettingsButton")?.click()};r.onclick=()=>location.reload();document.getElementById("jarvisV9Categories").onclick=openCategories}
function modal(){if(document.getElementById("jarvisV9Modal"))return;const m=document.createElement("div");m.id="jarvisV9Modal";m.className="jarvisV9Modal";m.innerHTML=`<div class="jarvisV9Card"><h2>CATÉGORIES V9</h2><div class="jarvisV9Tabs" id="jarvisV9Tabs"></div><div id="jarvisV9Entities"></div><div class="jarvisModalActions"><button id="jarvisV9Close">FERMER</button><button id="jarvisV9Save" class="jarvisPrimary">ENREGISTRER</button></div><div class="jarvisNote">Les entités sont détectées automatiquement depuis Home Assistant. Tu choisis uniquement celles qui apparaissent dans ton menu.</div></div>`;document.body.append(m);m.onclick=e=>{if(e.target===m)closeCategories()};m.querySelector("#jarvisV9Close").onclick=closeCategories;m.querySelector("#jarvisV9Save").onclick=()=>{saveSelection(window.__jarvisV9Draft||{});closeCategories();renderDashboard();logOK("🗂️ Catégories V9 enregistrées.")}}
let currentCategory="light";
async function openCategories(){modal();document.body.classList.add("jarvisV9ModalOpen");document.getElementById("jarvisV9Modal").classList.add("open");const list=await states();window.__jarvisV9States=list;window.__jarvisV9Draft=structuredClone(loadSelection());renderTabs(list);renderEntities(list)}
function closeCategories(){document.getElementById("jarvisV9Modal")?.classList.remove("open");document.body.classList.remove("jarvisV9ModalOpen")}
function renderTabs(list){const t=document.getElementById("jarvisV9Tabs");t.innerHTML="";CATEGORIES.forEach(([key,icon,label])=>{const b=document.createElement("button");b.className=`jarvisV9Tab ${key===currentCategory?"active":""}`;b.textContent=`${icon} ${label}`;b.onclick=()=>{currentCategory=key;renderTabs(list);renderEntities(list)};t.append(b)})}
function allowed(key,s){const c=CATEGORY_MAP[key];if(!c)return false;const d=s.entity_id.split(".")[0];if(c[3].includes(d))return true;return inferCategory(s)===key}
function renderEntities(list){const box=document.getElementById("jarvisV9Entities");if(!box)return;const selected=window.__jarvisV9Draft?.[currentCategory]||[];const arr=list.filter(s=>allowed(currentCategory,s));if(!arr.length){box.innerHTML=`<div class="jarvisNote">Aucune entité détectée pour cette catégorie. Elle pourra être ajoutée automatiquement dès qu'une entité correspondante apparaît dans Home Assistant.</div>`;return}box.innerHTML=arr.map(s=>{const checked=selected.includes(s.entity_id);return `<label class="jarvisV9Entity jarvisV9Pick"><input type="checkbox" data-entity="${s.entity_id}" ${checked?"checked":""}><span><span class="jarvisV9Name">${s.attributes?.friendly_name||friendly(s.entity_id)}</span><span class="jarvisV9State">${fmtState(s)}</span><span class="jarvisV9Detail">${s.entity_id}${detail(s)?` • ${detail(s)}`:""}</span></span></label>`}).join("");box.querySelectorAll("input").forEach(i=>i.onchange=e=>{const a=window.__jarvisV9Draft[currentCategory]||[];window.__jarvisV9Draft[currentCategory]=e.target.checked?[...new Set([...a,e.target.dataset.entity])]:a.filter(x=>x!==e.target.dataset.entity)})}
function renderDashboard(){const root=document.getElementById("jarvisRoot");if(!root)return;let host=document.getElementById("jarvisV9Dashboard");if(!host){host=document.createElement("section");host.id="jarvisV9Dashboard";host.className="jarvisV9Dash";root.append(host)}host.innerHTML="<div class='jarvisV9DashTitle'>V9 • ÉTATS HOME ASSISTANT</div><div id='jarvisV9DashGrid'></div>";refreshDashboard()}
async function refreshDashboard(){const grid=document.getElementById("jarvisV9DashGrid");if(!grid)return;try{const list=await states();window.__jarvisV9States=list;const sel=loadSelection();let html="";CATEGORIES.forEach(([key,icon,label])=>{const ids=sel[key]||[];const arr=ids.map(id=>list.find(s=>s.entity_id===id)).filter(Boolean);if(!arr.length)return;html+=`<div><div class='jarvisV9DashTitle'>${icon} ${label}</div><div class='jarvisV9Grid'>${arr.map(s=>`<div class='jarvisV9Mini'><strong>${s.attributes?.friendly_name||friendly(s.entity_id)}</strong><div class='state'>${fmtState(s)}</div><div class='detail'>${detail(s)}</div>${["light","switch","input_boolean","fan","lock","cover"].includes(s.entity_id.split(".")[0])?`<div class='jarvisV9Actions'><button data-v9-on='${s.entity_id}'>ON / OUVRIR</button><button data-v9-off='${s.entity_id}'>OFF / FERMER</button></div>`:""}</div>`).join("")}</div></div>`});grid.innerHTML=html||`<div class='jarvisNote'>Ouvre 🗂️ Catégories pour choisir les entités à afficher.</div>`;grid.querySelectorAll("[data-v9-on]").forEach(b=>b.onclick=async()=>{const s=list.find(x=>x.entity_id===b.dataset.v9On);if(s)try{await callService(s,true);setTimeout(refreshDashboard,350)}catch(e){logError(`Commande ${s.entity_id} : ${e.message}`)}});grid.querySelectorAll("[data-v9-off]").forEach(b=>b.onclick=async()=>{const s=list.find(x=>x.entity_id===b.dataset.v9Off);if(s)try{await callService(s,false);setTimeout(refreshDashboard,350)}catch(e){logError(`Commande ${s.entity_id} : ${e.message}`)}})}catch(e){grid.innerHTML=`<div class='jarvisNote'>Home Assistant indisponible : ${e.message}</div>`}}
function patchVersion(){document.title=`JARVIS ${V9}`;const sub=document.querySelector(".subtitle");if(sub)sub.textContent="HOME ASSISTANT • V9";const obs=new MutationObserver(()=>{document.querySelectorAll("#co *").forEach(el=>{if(el.childElementCount===0&&el.textContent.includes("JARVIS V8.9"))el.textContent=el.textContent.replaceAll("JARVIS V8.9","JARVIS V9.0")});const old=[...document.querySelectorAll("body > div, body > span")].find(el=>el.textContent?.trim()==="JARVIS V8.9");if(old)old.classList.add("jarvisV9Hidden")});obs.observe(document.body,{subtree:true,childList:true,characterData:true})}
function boot(){css();nav();modal();patchVersion();const obs=new MutationObserver(()=>{hideLegacy();if(document.getElementById("jarvisRoot")?.children.length) {renderDashboard();obs.disconnect()}});obs.observe(document.body,{childList:true,subtree:true});if(document.getElementById("jarvisRoot")?.children.length)renderDashboard()}
if(document.readyState==="loading")window.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
