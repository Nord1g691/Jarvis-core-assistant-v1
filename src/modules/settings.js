// JARVIS V8 — account and dashboard settings
// Secrets stay only in the browser localStorage and are never committed.

const TOKEN_KEY = "jarvis_ha_token";
const URL_KEY = "jarvis_ha_url";
const CARD_SETTINGS_KEY = "jarvis_card_visibility";
const CARD_ORDER_KEY = "jarvis_card_order";
const VOICE_TIMEOUT_KEY = "jarvis_voice_response_timeout";

const DEFAULT_CARDS = { energy: true, voice: true, music: true, system: true, console: true };
const DEFAULT_ORDER = ["energy", "voice", "music", "system", "console"];
const DEFAULT_VOICE_TIMEOUT = 10;
const CARD_LABELS = { energy: "☀️ Énergie / solaire", voice: "🎤 Commandes vocales", music: "🎵 Musique", system: "🖥️ État système", console: "📋 Console JARVIS" };
function getStored(key) { try { return localStorage.getItem(key) || ""; } catch { return ""; } }
function saveStored(key, value) { try { if (value !== "" && value != null) localStorage.setItem(key, String(value)); else localStorage.removeItem(key); return true; } catch { return false; } }
function getCards() { try { return { ...DEFAULT_CARDS, ...(JSON.parse(getStored(CARD_SETTINGS_KEY) || "{}")) }; } catch { return { ...DEFAULT_CARDS }; } }
function saveCards(cards) { try { localStorage.setItem(CARD_SETTINGS_KEY, JSON.stringify(cards)); return true; } catch { return false; } }
function getOrder() { try { const stored = JSON.parse(getStored(CARD_ORDER_KEY) || "[]"); return [...stored.filter(key => DEFAULT_ORDER.includes(key)), ...DEFAULT_ORDER.filter(key => !stored.includes(key))]; } catch { return [...DEFAULT_ORDER]; } }
function saveOrder(order) { try { localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(order)); return true; } catch { return false; } }
export function getVoiceResponseTimeout() { const value = Number.parseInt(getStored(VOICE_TIMEOUT_KEY), 10); return Number.isFinite(value) ? Math.min(60, Math.max(0, value)) : DEFAULT_VOICE_TIMEOUT; }
function installCardMarkers() { const panels = document.querySelectorAll("#jarvisRoot .panels > .panel"); if (!panels.length) return false; DEFAULT_ORDER.forEach((key,index)=>{if(panels[index]) panels[index].dataset.cardKey=key}); applyCardLayout(); return true; }
function applyCardLayout(cards=getCards(), order=getOrder()) { const container=document.querySelector("#jarvisRoot .panels"); if(!container)return; const panels=new Map([...container.querySelectorAll(":scope > .panel")].map(p=>[p.dataset.cardKey,p])); order.forEach(key=>{const p=panels.get(key);if(p){p.style.display=cards[key]?"":"none";container.appendChild(p)}}); }

function installSettingsUI() {
  if (document.getElementById("jarvisAccountButton")) return;
  const style=document.createElement("style"); style.textContent=`
    .jarvisTopIcon{position:fixed!important;top:max(12px,env(safe-area-inset-top))!important;right:12px!important;z-index:2147483000!important;width:38px!important;height:38px!important;padding:0!important;border:0!important;background:transparent!important;color:#7eefff!important;border-radius:0!important;font-size:18px!important;line-height:38px!important;text-align:center!important;box-shadow:none!important;transform:none!important}
    #jarvisSettingsButton{top:max(54px,calc(env(safe-area-inset-top) + 46px))!important;font-size:16px!important}
    .jarvisRefreshButton{position:fixed!important;top:max(96px,calc(env(safe-area-inset-top) + 88px))!important;right:12px!important;z-index:2147483000!important;width:38px!important;height:38px!important;padding:0!important;border:0!important;background:transparent!important;color:#7eefff!important;border-radius:0!important;font-size:18px!important;line-height:38px!important;text-align:center!important;box-shadow:none!important;transform:none!important}
    .jarvisModal{position:fixed;inset:0;z-index:1100;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.72);padding:20px}.jarvisModal.open{display:flex}
    .jarvisModalCard{width:min(520px,100%);max-height:85vh;overflow:auto;background:#07111f;border:1px solid rgba(0,220,255,.55);border-radius:16px;padding:20px;box-shadow:0 0 40px rgba(0,180,255,.18);color:#dffaff;font-family:Rajdhani,Arial}
    .jarvisModalCard h2{margin:0 0 14px;font:900 18px Orbitron,Arial;letter-spacing:1px;color:#7eefff}.jarvisModalCard label{display:block;margin:12px 0 6px;font-weight:700;font-size:12px;letter-spacing:.8px}
    .jarvisModalCard input{width:100%;box-sizing:border-box;background:#020812;color:#fff;border:1px solid #24516b;border-radius:8px;padding:11px;font-size:14px}.jarvisModalActions{display:flex;gap:8px;margin-top:16px}.jarvisModalActions button{flex:1;padding:11px;border-radius:8px;border:1px solid #24516b;background:#0a1b2a;color:#dffaff;font-weight:700}.jarvisPrimary{background:#063b4a!important;border-color:#00c8ee!important}.jarvisDirty{box-shadow:0 0 10px rgba(0,200,238,.25)}.jarvisNote{margin-top:12px;font-size:11px;opacity:.72;line-height:1.35}
    .jarvisCardList{display:flex;flex-direction:column;gap:6px}.jarvisCardRow{display:flex;align-items:center;gap:8px;padding:10px;border:1px solid rgba(126,239,255,.12);border-radius:9px;background:rgba(2,8,18,.45);user-select:none}.jarvisDrag{opacity:.55;font-size:16px}.jarvisCardName{font-weight:700;font-size:14px;flex:1}.jarvisSwitch{position:relative;width:46px;height:26px;flex:0 0 46px}.jarvisSwitch input{opacity:0;width:0;height:0}.jarvisSlider{position:absolute;inset:0;border-radius:20px;background:#263746;border:1px solid #45606e;transition:.2s}.jarvisSlider:before{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;border-radius:50%;background:#9aa8b0;transition:.2s}.jarvisSwitch input:checked+.jarvisSlider{background:#064b5b;border-color:#00c8ee}.jarvisSwitch input:checked+.jarvisSlider:before{transform:translateX(20px);background:#7eefff}
    .jarvisMoveButtons{display:flex;flex-direction:column;gap:3px;flex:0 0 30px}.jarvisMoveButtons button{width:30px;height:24px;padding:0;border:1px solid #24516b;border-radius:5px;background:#0a1b2a;color:#7eefff;font-size:13px;line-height:20px}.jarvisMoveButtons button:disabled{opacity:.25}
    .jarvisVoiceSetting{margin-top:16px;padding-top:14px;border-top:1px solid rgba(126,239,255,.12)}.jarvisRangeRow{display:flex;align-items:center;gap:10px}.jarvisRangeRow input[type="range"]{flex:1}.jarvisRangeValue{min-width:44px;text-align:right;color:#7eefff;font-weight:700}
    body.jarvisModalOpen .jarvisTopIcon,body.jarvisModalOpen .jarvisRefreshButton{display:none!important}
  `; document.head.appendChild(style);
  const accountButton=document.createElement("button");accountButton.id="jarvisAccountButton";accountButton.className="jarvisTopIcon";accountButton.type="button";accountButton.title="Compte";accountButton.setAttribute("aria-label","Compte");accountButton.textContent="👤";
  const settingsButton=document.createElement("button");settingsButton.id="jarvisSettingsButton";settingsButton.className="jarvisTopIcon";settingsButton.type="button";settingsButton.title="Réglages";settingsButton.setAttribute("aria-label","Réglages");settingsButton.textContent="⚙️";
  const refreshButton=document.createElement("button");refreshButton.id="jarvisRefreshButton";refreshButton.className="jarvisRefreshButton";refreshButton.type="button";refreshButton.title="Actualiser";refreshButton.setAttribute("aria-label","Actualiser");refreshButton.textContent="↻";
  const accountModal=document.createElement("div");accountModal.id="jarvisAccountModal";accountModal.className="jarvisModal";accountModal.innerHTML=`<div class="jarvisModalCard" role="dialog" aria-modal="true"><h2>COMPTE</h2><label for="jarvisHaUrl">URL HOME ASSISTANT</label><input id="jarvisHaUrl" type="url" inputmode="url" autocomplete="url" placeholder="https://homeassistant.exemple.com"><label for="jarvisHaToken">TOKEN HOME ASSISTANT</label><input id="jarvisHaToken" type="password" autocomplete="off" placeholder="Colle ton token ici"><div class="jarvisModalActions"><button id="jarvisAccountCancel" type="button">ANNULER</button><button id="jarvisAccountSave" class="jarvisPrimary" type="button">ENREGISTRER</button></div><div class="jarvisNote">Le token reste uniquement dans le stockage local de ce navigateur.</div></div>`;
  const settingsModal=document.createElement("div");settingsModal.id="jarvisSettingsModal";settingsModal.className="jarvisModal";settingsModal.innerHTML=`<div class="jarvisModalCard" role="dialog" aria-modal="true"><h2>RÉGLAGES</h2><div class="jarvisCardList" id="jarvisCardList"></div><div class="jarvisVoiceSetting"><label for="jarvisVoiceTimeout">TEMPS AVANT RETOUR À L'ÉTAT PRÊT</label><div class="jarvisRangeRow"><input id="jarvisVoiceTimeout" type="range" min="0" max="60" step="1"><span id="jarvisVoiceTimeoutValue" class="jarvisRangeValue">10 s</span></div><div class="jarvisNote">Délai de sécurité après une réponse vocale avant le retour à l'état prêt. 0 s désactive l'attente.</div></div><div class="jarvisModalActions"><button id="jarvisSettingsCancel" type="button">FERMER</button><button id="jarvisSettingsSave" class="jarvisPrimary" type="button" disabled>VALIDER</button></div><div class="jarvisNote">Les changements ne seront appliqués qu'après validation.<br>Fermer annule les modifications.</div></div>`;
  document.body.append(accountButton,settingsButton,refreshButton,accountModal,settingsModal);
  const urlInput=accountModal.querySelector("#jarvisHaUrl"),tokenInput=accountModal.querySelector("#jarvisHaToken"),cardList=settingsModal.querySelector("#jarvisCardList"),saveButton=settingsModal.querySelector("#jarvisSettingsSave"),voiceTimeoutInput=settingsModal.querySelector("#jarvisVoiceTimeout"),voiceTimeoutValue=settingsModal.querySelector("#jarvisVoiceTimeoutValue");
  let draftCards=null,draftOrder=null,draftVoiceTimeout=DEFAULT_VOICE_TIMEOUT,dirty=false;
  function markDirty(){dirty=true;saveButton.disabled=false;saveButton.classList.add("jarvisDirty")}
  function renderDraftCardSettings(){
    cardList.innerHTML="";
    draftOrder.forEach((key,index)=>{
      const row=document.createElement("div");row.className="jarvisCardRow";row.dataset.cardKey=key;
      row.innerHTML=`<span class="jarvisDrag">☷</span><span class="jarvisCardName">${CARD_LABELS[key]}</span><div class="jarvisMoveButtons"><button type="button" data-move="up" aria-label="Monter" ${index===0?"disabled":""}>▲</button><button type="button" data-move="down" aria-label="Descendre" ${index===draftOrder.length-1?"disabled":""}>▼</button></div><label class="jarvisSwitch"><input type="checkbox" ${draftCards[key]?"checked":""}><span class="jarvisSlider"></span></label>`;
      row.querySelector("input").onchange=e=>{draftCards[key]=e.target.checked;markDirty()};
      row.querySelector('[data-move="up"]').onclick=()=>moveCard(index,-1);
      row.querySelector('[data-move="down"]').onclick=()=>moveCard(index,1);
      cardList.appendChild(row);
    });
  }
  function renderCardSettings(){draftCards={...getCards()};draftOrder=[...getOrder()];draftVoiceTimeout=getVoiceResponseTimeout();dirty=false;saveButton.disabled=true;saveButton.classList.remove("jarvisDirty");voiceTimeoutInput.value=String(draftVoiceTimeout);voiceTimeoutValue.textContent=`${draftVoiceTimeout} s`;renderDraftCardSettings()}
  function moveCard(index,delta){const target=index+delta;if(target<0||target>=draftOrder.length)return;[draftOrder[index],draftOrder[target]]=[draftOrder[target],draftOrder[index]];renderDraftCardSettings();markDirty()}
  function openAccount(){urlInput.value=getStored(URL_KEY);tokenInput.value=getStored(TOKEN_KEY);document.body.classList.add("jarvisModalOpen");accountModal.classList.add("open");setTimeout(()=>urlInput.focus(),50)}
  function closeAccount(){accountModal.classList.remove("open");if(!settingsModal.classList.contains("open"))document.body.classList.remove("jarvisModalOpen")}
  function openSettings(){renderCardSettings();document.body.classList.add("jarvisModalOpen");settingsModal.classList.add("open")}
  function closeSettings(){settingsModal.classList.remove("open");if(!accountModal.classList.contains("open"))document.body.classList.remove("jarvisModalOpen")}
  accountButton.onclick=openAccount;settingsButton.onclick=openSettings;refreshButton.onclick=()=>location.reload();accountModal.querySelector("#jarvisAccountCancel").onclick=closeAccount;
  voiceTimeoutInput.oninput=()=>{draftVoiceTimeout=Number(voiceTimeoutInput.value);voiceTimeoutValue.textContent=`${draftVoiceTimeout} s`;markDirty()};
  settingsModal.querySelector("#jarvisSettingsCancel").onclick=()=>{closeSettings()};
  saveButton.onclick=()=>{if(!dirty)return;if(saveCards(draftCards)&&saveOrder(draftOrder)&&saveStored(VOICE_TIMEOUT_KEY,draftVoiceTimeout)){applyCardLayout(draftCards,draftOrder);closeSettings()}};
  accountModal.addEventListener("click",e=>{if(e.target===accountModal)closeAccount()});settingsModal.addEventListener("click",e=>{if(e.target===settingsModal)closeSettings()});
  accountModal.querySelector("#jarvisAccountSave").onclick=()=>{const url=urlInput.value.trim().replace(/\/$/,"");const token=tokenInput.value.trim();if(url&&!/^https?:\/\//i.test(url)){urlInput.focus();return}if(!saveStored(URL_KEY,url)||!saveStored(TOKEN_KEY,token))return;closeAccount();location.reload()};

  const root=document.getElementById("jarvisRoot");
  if(root){const observer=new MutationObserver(()=>{if(installCardMarkers()) observer.disconnect()});observer.observe(root,{childList:true,subtree:true});}
  installCardMarkers();
}
if(document.readyState==="loading")window.addEventListener("DOMContentLoaded",installSettingsUI,{once:true});else installSettingsUI();