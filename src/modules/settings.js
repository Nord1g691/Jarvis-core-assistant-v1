// JARVIS V8 — local connection settings
// Secrets stay only in the browser localStorage and are never committed.

const TOKEN_KEY = "jarvis_ha_token";
const URL_KEY = "jarvis_ha_url";

function getStored(key) {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
}

function saveStored(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

function installSettingsUI() {
  if (document.getElementById("jarvisSettingsButton")) return;

  const style = document.createElement("style");
  style.textContent = `
    #jarvisSettingsButton{position:fixed;top:max(12px,env(safe-area-inset-top));right:12px;z-index:1000;border:1px solid rgba(0,220,255,.55);background:rgba(2,8,18,.88);color:#7eefff;border-radius:10px;padding:8px 11px;font:700 11px Rajdhani,Arial;letter-spacing:1px}
    #jarvisSettings{position:fixed;inset:0;z-index:1100;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.72);padding:20px}
    #jarvisSettings.open{display:flex}
    #jarvisSettingsCard{width:min(520px,100%);background:#07111f;border:1px solid rgba(0,220,255,.55);border-radius:16px;padding:20px;box-shadow:0 0 40px rgba(0,180,255,.18);color:#dffaff;font-family:Rajdhani,Arial}
    #jarvisSettingsCard h2{margin:0 0 14px;font:900 18px Orbitron,Arial;letter-spacing:1px;color:#7eefff}
    #jarvisSettingsCard label{display:block;margin:12px 0 6px;font-weight:700;font-size:12px;letter-spacing:.8px}
    #jarvisSettingsCard input{width:100%;box-sizing:border-box;background:#020812;color:#fff;border:1px solid #24516b;border-radius:8px;padding:11px;font-size:14px}
    #jarvisSettingsActions{display:flex;gap:8px;margin-top:16px}
    #jarvisSettingsActions button{flex:1;padding:11px;border-radius:8px;border:1px solid #24516b;background:#0a1b2a;color:#dffaff;font-weight:700}
    #jarvisSettingsSave{background:#063b4a!important;border-color:#00c8ee!important}
    #jarvisSettingsNote{margin-top:12px;font-size:11px;opacity:.72;line-height:1.35}
  `;
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.id = "jarvisSettingsButton";
  button.type = "button";
  button.textContent = "⚙ RÉGLAGES";

  const modal = document.createElement("div");
  modal.id = "jarvisSettings";
  modal.innerHTML = `
    <div id="jarvisSettingsCard" role="dialog" aria-modal="true" aria-label="Réglages Home Assistant">
      <h2>RÉGLAGES JARVIS</h2>
      <label for="jarvisHaUrl">URL HOME ASSISTANT</label>
      <input id="jarvisHaUrl" type="url" inputmode="url" autocomplete="url" placeholder="https://homeassistant.exemple.com">
      <label for="jarvisHaToken">TOKEN HOME ASSISTANT</label>
      <input id="jarvisHaToken" type="password" autocomplete="off" placeholder="Colle ton token ici">
      <div id="jarvisSettingsActions">
        <button id="jarvisSettingsCancel" type="button">ANNULER</button>
        <button id="jarvisSettingsSave" type="button">ENREGISTRER</button>
      </div>
      <div id="jarvisSettingsNote">Le token reste uniquement dans le stockage local de cet iPhone. Il n'est pas enregistré dans GitHub.</div>
    </div>`;

  document.body.append(button, modal);

  const urlInput = modal.querySelector("#jarvisHaUrl");
  const tokenInput = modal.querySelector("#jarvisHaToken");

  function open() {
    urlInput.value = getStored(URL_KEY);
    tokenInput.value = getStored(TOKEN_KEY);
    modal.classList.add("open");
    setTimeout(() => urlInput.focus(), 50);
  }

  function close() { modal.classList.remove("open"); }

  button.onclick = open;
  modal.querySelector("#jarvisSettingsCancel").onclick = close;
  modal.addEventListener("click", event => { if (event.target === modal) close(); });

  modal.querySelector("#jarvisSettingsSave").onclick = () => {
    const url = urlInput.value.trim().replace(/\/$/, "");
    const token = tokenInput.value.trim();

    if (!url || !/^https?:\/\//i.test(url)) {
      urlInput.focus();
      return;
    }
    if (!token) {
      tokenInput.focus();
      return;
    }

    if (!saveStored(URL_KEY, url) || !saveStored(TOKEN_KEY, token)) {
      return;
    }

    close();
    location.reload();
  };
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", installSettingsUI, { once: true });
} else {
  installSettingsUI();
}
