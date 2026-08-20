// JARVIS V8 — account and dashboard settings
// Secrets stay only in the browser localStorage and are never committed.

const TOKEN_KEY = "jarvis_ha_token";
const URL_KEY = "jarvis_ha_url";
const CARD_SETTINGS_KEY = "jarvis_card_visibility";
const CARD_ORDER_KEY = "jarvis_card_order";

const DEFAULT_CARDS = { energy: true, voice: true, music: true, system: true, console: true };
const DEFAULT_ORDER = ["energy", "voice", "music", "system", "console"];
const CARD_LABELS = {
  energy: "☀️ Énergie / solaire",
  voice: "🎤 Commandes vocales",
  music: "🎵 Musique",
  system: "🖥️ État système",
  console: "📋 Console JARVIS"
};

function getStored(key) { try { return localStorage.getItem(key) || ""; } catch { return ""; } }
function saveStored(key, value) { try { if (value) localStorage.setItem(key, value); else localStorage.removeItem(key); return true; } catch { return false; } }
function getCards() { try { return { ...DEFAULT_CARDS, ...(JSON.parse(getStored(CARD_SETTINGS_KEY) || "{}")) }; } catch { return { ...DEFAULT_CARDS }; } }
function saveCards(cards) { try { localStorage.setItem(CARD_SETTINGS_KEY, JSON.stringify(cards)); return true; } catch { return false; } }
function getOrder() {
  try {
    const stored = JSON.parse(getStored(CARD_ORDER_KEY) || "[]");
    return [...stored.filter(key => DEFAULT_ORDER.includes(key)), ...DEFAULT_ORDER.filter(key => !stored.includes(key))];
  } catch { return [...DEFAULT_ORDER]; }
}
function saveOrder(order) { try { localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(order)); return true; } catch { return false; } }

function installCardMarkers() {
  const panels = document.querySelectorAll("#jarvisRoot .panels > .panel");
  const keys = ["energy", "voice", "music", "system", "console"];
  panels.forEach((panel, index) => { if (keys[index]) panel.dataset.cardKey = keys[index]; });
  applyCardLayout();
}

function applyCardLayout() {
  const cards = getCards();
  const order = getOrder();
  const container = document.querySelector("#jarvisRoot .panels");
  if (!container) return;
  const panels = new Map([...container.querySelectorAll(":scope > .panel")].map(panel => [panel.dataset.cardKey, panel]));
  order.forEach(key => { const panel = panels.get(key); if (panel) { panel.style.display = cards[key] ? "" : "none"; container.appendChild(panel); } });
}

function installSettingsUI() {
  if (document.getElementById("jarvisAccountButton")) return;
  const style = document.createElement("style");
  style.textContent = `
    .jarvisTopIcon{position:fixed;top:max(12px,env(safe-area-inset-top));right:12px;z-index:1000;width:38px;height:38px;padding:0;border:0;background:transparent;color:#7eefff;border-radius:0;font-size:18px;line-height:38px;text-align:center;box-shadow:none}
    #jarvisSettingsButton{top:max(54px,calc(env(safe-area-inset-top) + 46px));font-size:16px}
    .jarvisModal{position:fixed;inset:0;z-index:1100;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.72);padding:20px}.jarvisModal.open{display:flex}
    .jarvisModalCard{width:min(520px,100%);max-height:85vh;overflow:auto;background:#07111f;border:1px solid rgba(0,220,255,.55);border-radius:16px;padding:20px;box-shadow:0 0 40px rgba(0,180,255,.18);color:#dffaff;font-family:Rajdhani,Arial}
    .jarvisModalCard h2{margin:0 0 14px;font:900 18px Orbitron,Arial;letter-spacing:1px;color:#7eefff}.jarvisModalCard label{display:block;margin:12px 0 6px;font-weight:700;font-size:12px;letter-spacing:.8px}
    .jarvisModalCard input{width:100%;box-sizing:border-box;background:#020812;color:#fff;border:1px solid #24516b;border-radius:8px;padding:11px;font-size:14px}.jarvisModalActions{display:flex;gap:8px;margin-top:16px}.jarvisModalActions button{flex:1;padding:11px;border-radius:8px;border:1px solid #24516b;background:#0a1b2a;color:#dffaff;font-weight:700}.jarvisPrimary{background:#063b4a!important;border-color:#00c8ee!important}.jarvisNote{margin-top:12px;font-size:11px;opacity:.72;line-height:1.35}
    .jarvisCardList{display:flex;flex-direction:column;gap:6px}.jarvisCardRow{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid rgba(126,239,255,.12);border-radius:9px;background:rgba(2,8,18,.45);cursor:grab;user-select:none}.jarvisCardRow.dragging{opacity:.45}.jarvisDrag{opacity:.55;font-size:16px}.jarvisCardName{font-weight:700;font-size:14px;flex:1}.jarvisSwitch{position:relative;width:46px;height:26px;flex:0 0 46px}.jarvisSwitch input{opacity:0;width:0;height:0}.jarvisSlider{position:absolute;inset:0;border-radius:20px;background:#263746;border:1px solid #45606e;transition:.2s}.jarvisSlider:before{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;border-radius:50%;background:#9aa8b0;transition:.2s}.jarvisSwitch input:checked+.jarvisSlider{background:#064b5b;border-color:#00c8ee}.jarvisSwitch input:checked+.jarvisSlider:before{transform:translateX(20px);background:#7eefff}
  `;
  document.head.appendChild(style);

  const accountButton = document.createElement("button"); accountButton.id="jarvisAccountButton"; accountButton.className="jarvisTopIcon"; accountButton.type="button"; accountButton.title="Compte"; accountButton.setAttribute("aria-label","Compte"); accountButton.textContent="👤";
  const settingsButton = document.createElement("button"); settingsButton.id="jarvisSettingsButton"; settingsButton.className="jarvisTopIcon"; settingsButton.type="button"; settingsButton.title="Réglages"; settingsButton.setAttribute("aria-label","Réglages"); settingsButton.textContent="⚙️";

  const accountModal=document.createElement("div"); accountModal.id="jarvisAccountModal"; accountModal.className="jarvisModal"; accountModal.innerHTML=`<div class="jarvisModalCard" role="dialog" aria-modal="true"><h2>COMPTE</h2><label for="jarvisHaUrl">URL HOME ASSISTANT</label><input id="jarvisHaUrl" type="url" inputmode="url" autocomplete="url" placeholder="https://homeassistant.exemple.com"><label for="jarvisHaToken">TOKEN HOME ASSISTANT</label><input id="jarvisHaToken" type="password" autocomplete="off" placeholder="Colle ton token ici"><div class="jarvisModalActions"><button id="jarvisAccountCancel" type="button">ANNULER</button><button id="jarvisAccountSave" class="jarvisPrimary" type="button">ENREGISTRER</button></div><div class="jarvisNote">Le token reste uniquement dans le stockage local de ce navigateur.</div></div>`;

  const settingsModal=document.createElement("div"); settingsModal.id="jarvisSettingsModal"; settingsModal.className="jarvisModal"; settingsModal.innerHTML=`<div class="jarvisModalCard" role="dialog" aria-modal="true"><h2>RÉGLAGES</h2><div class="jarvisCardList" id="jarvisCardList"></div><div class="jarvisModalActions"><button id="jarvisSettingsClose" class="jarvisPrimary" type="button">FERMER</button></div><div class="jarvisNote">Fais glisser les cartes pour les classer. Les cartes désactivées disparaissent immédiatement.</div></div>`;
  document.body.append(accountButton,settingsButton,accountModal,settingsModal);

  const urlInput=accountModal.querySelector("#jarvisHaUrl"), tokenInput=accountModal.querySelector("#jarvisHaToken"), cardList=settingsModal.querySelector("#jarvisCardList");
  function openAccount(){urlInput.value=getStored(URL_KEY);tokenInput.value=getStored(TOKEN_KEY);accountModal.classList.add("open");setTimeout(()=>urlInput.focus(),50)}
  function closeAccount(){accountModal.classList.remove("open")}
  function renderCardSettings(){const cards=getCards(),order=getOrder();cardList.innerHTML="";order.forEach(key=>{const row=document.createElement("div");row.className="jarvisCardRow";row.draggable=true;row.dataset.cardKey=key;row.innerHTML=`<span class="jarvisDrag">☷</span><span class="jarvisCardName">${CARD_LABELS[key]}</span><label class="jarvisSwitch"><input type="checkbox" ${cards[key]?"checked":""}><span class="jarvisSlider"></span></label>`;const input=row.querySelector("input");input.onchange=()=>{const next=getCards();next[key]=input.checked;saveCards(next);applyCardLayout()};row.ondragstart=()=>row.classList.add("dragging");row.ondragend=()=>{row.classList.remove("dragging");saveOrder([...cardList.querySelectorAll(".jarvisCardRow")].map(el=>el.dataset.cardKey));applyCardLayout()};row.ondragover=e=>{e.preventDefault();const dragging=cardList.querySelector(".dragging");if(dragging&&dragging!==row){const box=row.getBoundingClientRect();cardList.insertBefore(dragging,e.clientY>box.top+box.height/2?row.nextSibling:row)}};cardList.appendChild(row)})}
  function openSettings(){renderCardSettings();settingsModal.classList.add("open")}; function closeSettings(){settingsModal.classList.remove("open")}
  accountButton.onclick=openAccount;settingsButton.onclick=openSettings;accountModal.querySelector("#jarvisAccountCancel").onclick=closeAccount;settingsModal.querySelector("#jarvisSettingsClose").onclick=closeSettings;accountModal.addEventListener("click",e=>{if(e.target===accountModal)closeAccount()});settingsModal.addEventListener("click",e=>{if(e.target===settingsModal)closeSettings()});
  accountModal.querySelector("#jarvisAccountSave").onclick=()=>{const url=urlInput.value.trim().replace(/\/$/,"");const token=tokenInput.value.trim();if(url&&!/^https?:\/\//i.test(url)){urlInput.focus();return}if(!saveStored(URL_KEY,url)||!saveStored(TOKEN_KEY,token))return;closeAccount();location.reload()};
  installCardMarkers();
}
if(document.readyState==="loading")window.addEventListener("DOMContentLoaded",installSettingsUI,{once:true});else installSettingsUI();
