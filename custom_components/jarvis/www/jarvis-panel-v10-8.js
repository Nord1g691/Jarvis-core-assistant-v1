import './jarvis-panel-v10-7.js';

const SETTINGS_KEY = 'jarvis.settings.v1';

function getSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; }
}
function saveSettings(settings) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }

function installJarvisSettings() {
  const panel = document.querySelector('jarvis-native-panel-v107');
  const root = panel?.shadowRoot;
  if (!root || root.querySelector('#jarvis-settings-button')) return !!root;
  const style = document.createElement('style');
  style.textContent = `#jarvis-settings-button{position:fixed;right:14px;top:14px;z-index:9999;width:38px;height:38px;border:1px solid rgba(0,220,255,.35);border-radius:50%;background:rgba(2,14,26,.92);color:#c8f7ff;cursor:pointer;font-size:18px;box-shadow:0 0 18px rgba(0,234,255,.18)}#jarvis-settings-button:hover{box-shadow:0 0 24px rgba(0,234,255,.38)}#jarvis-settings-panel{position:fixed;right:14px;top:60px;z-index:10000;width:min(330px,calc(100vw - 28px));padding:14px;border:1px solid rgba(0,220,255,.3);border-radius:12px;background:rgba(2,12,22,.97);box-shadow:0 12px 45px rgba(0,0,0,.55);color:#d9faff;font-family:Arial,sans-serif;display:none}#jarvis-settings-panel.open{display:block}.j-setting{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid rgba(0,200,255,.12);font-size:10px}.j-setting input[type=range]{width:145px}.j-setting input[type=checkbox]{width:18px;height:18px}.j-volume{display:flex;align-items:center;gap:8px}.j-volume-value{min-width:38px;text-align:right;color:#8fefff}#jarvis-settings-panel h3{margin:0 0 12px;font-size:12px;letter-spacing:2px;color:#8fefff}#jarvis-settings-close{margin-top:10px;width:100%;height:32px;border:1px solid rgba(0,220,255,.25);border-radius:7px;background:rgba(0,80,110,.2);color:#c8f7ff;cursor:pointer}`;
  root.appendChild(style);
  const settings = getSettings();
  const volume = Number.isFinite(Number(settings.volume)) ? Number(settings.volume) : 70;
  const voiceEnabled = settings.voiceEnabled !== false;
  const continuous = settings.continuousConversation !== false;
  const button = document.createElement('button');
  button.id='jarvis-settings-button'; button.type='button'; button.title='Réglages JARVIS'; button.textContent='⚙️';
  const box = document.createElement('div');
  box.id='jarvis-settings-panel';
  box.innerHTML=`<h3>⚙️ RÉGLAGES JARVIS</h3><div class="j-setting"><span>🔊 Volume Assist</span><div class="j-volume"><input id="j-volume" type="range" min="0" max="100" step="1" value="${volume}"><span id="j-volume-value" class="j-volume-value">${volume}%</span></div></div><div class="j-setting"><span>🎙️ Voix active</span><input id="j-voice" type="checkbox" ${voiceEnabled?'checked':''}></div><div class="j-setting"><span>💬 Conversation continue</span><input id="j-continuous" type="checkbox" ${continuous?'checked':''}></div><button id="jarvis-settings-close" type="button">FERMER</button>`;
  root.appendChild(button); root.appendChild(box);
  const update=()=>{const s=getSettings();s.volume=Number(root.querySelector('#j-volume')?.value??70);s.voiceEnabled=!!root.querySelector('#j-voice')?.checked;s.continuousConversation=!!root.querySelector('#j-continuous')?.checked;saveSettings(s);document.querySelectorAll('audio').forEach(a=>{a.volume=s.volume/100});root.querySelector('#j-volume-value').textContent=`${s.volume}%`};
  button.addEventListener('click',()=>box.classList.toggle('open'));
  root.querySelector('#jarvis-settings-close').addEventListener('click',()=>box.classList.remove('open'));
  root.querySelector('#j-volume').addEventListener('input',update);
  root.querySelector('#j-voice').addEventListener('change',update);
  root.querySelector('#j-continuous').addEventListener('change',update);
  return true;
}
customElements.whenDefined('jarvis-native-panel-v107').then(()=>{let tries=0;const timer=setInterval(()=>{if(installJarvisSettings()||++tries>40)clearInterval(timer)},100)});
