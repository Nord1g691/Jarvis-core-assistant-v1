// JARVIS V8 — application entry point
import { $ } from "./dom.js";
import { setCoreState } from "./core-state.js";
import { createRecognition, startRecognition, stopRecognition } from "./voice.js";
import { sendToAssist } from "./assist.js";
import { testHomeAssistant } from "./ha.js";
import { log, logError, logOK } from "./logger.js";
import { HA_URL, JARVIS_SATELLITE, JARVIS_MUSIC, ENERGY_SENSORS } from "./config.js";

const TOKEN = "";
let connected = false;
let muted = false;
let listening = false;
let recognition = null;
let musicPlayer = null;
let musicIndex = -1;

function render() {
  const root = $("jarvisRoot");
  if (!root) return;
  root.innerHTML = `
    <section class="coreZone"><div class="core" id="core">
      <div class="tapZone" id="tapZone" role="button" tabindex="0" aria-label="Appuyer pour parler à JARVIS"></div>
      <div class="sweep"></div><div class="bars" id="bars"></div>
      <div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div><div class="ring r4"></div><div class="ring r5"></div>
      <div class="orbit"></div><div class="orbit orbit2"></div>
      <div class="center"><div class="centerGlow"></div><div class="centerCore"></div></div>
      <div class="coreLabel"><div class="coreState" id="coreState">INITIALISATION</div><div class="coreHint" id="coreHint">APPUYER POUR PARLER</div></div>
    </div></section>
    <section class="panels">
      <div class="panel"><div class="panelTitle"><span>⚡ Énergie Envoy</span><span id="energyStatus">--</span></div>
        <div class="energyGrid"><div class="energyStat production"><div class="energyValue"><span id="energy_production">--</span><span class="energyUnit" id="energy_production_unit">W</span></div><div class="energyLabel">Production</div></div>
        <div class="energyStat consumption"><div class="energyValue"><span id="energy_consumption">--</span><span class="energyUnit" id="energy_consumption_unit">W</span></div><div class="energyLabel">Consommation</div></div>
        <div class="energyStat import"><div class="energyValue"><span id="energy_import">--</span><span class="energyUnit" id="energy_import_unit">W</span></div><div class="energyLabel">Import réseau</div></div>
        <div class="energyStat export"><div class="energyValue"><span id="energy_export">--</span><span class="energyUnit" id="energy_export_unit">W</span></div><div class="energyLabel">Export réseau</div></div>
        <div class="energyStat autoconso" style="grid-column:1/-1"><div class="energyValue"><span id="energy_autoconso">--</span><span class="energyUnit">%</span></div><div class="energyLabel">Autoconsommation solaire</div></div></div>
      </div>
      <div class="panel"><div class="panelTitle"><span>Commandes vocales</span><span id="micStatus">PRÊT</span></div>
        <div class="inputRow"><input id="ci" type="text" autocomplete="off" placeholder="Commande à JARVIS..." aria-label="Commande texte à JARVIS"><button id="sendBtn">ENVOYER</button></div>
        <div class="controls" style="margin-top:8px"><button id="voiceBtn">🎤 ÉCOUTER</button><button id="satelliteBtn">🎙️ JARVIS IPHONE</button><button id="muteBtn" class="danger">🔇 MUTE</button><button id="testBtn">📡 TEST HA</button></div>
      </div>
      <div class="panel musicPanel"><div class="panelTitle"><span>🎵 Musique JARVIS</span><span id="musicStatus">ARRÊTÉE</span></div><div class="musicName" id="musicName">Aucun morceau</div>
        <div class="musicControls"><button id="prevBtn">⏮</button><button id="playBtn">▶</button><button id="nextBtn">⏭</button><button id="stopBtn">⏹</button></div>
        <div class="musicSlider"><div class="sliderLabel"><span>🎵 VOLUME MUSIQUE</span><span id="musicVolumeLabel">4%</span></div><input id="musicVolume" type="range" min="0" max="100" value="4"></div>
      </div>
      <div class="panel"><div class="panelTitle"><span>État système</span><span id="systemState">INITIALISATION</span></div><div class="controls"><button data-state="idle">AUTO</button><button data-state="listening">ÉCOUTE</button><button data-state="processing">RÉFLEXION</button><button data-state="responding">RÉPONSE</button></div></div>
      <div class="panel consolePanel"><div class="panelTitle"><span>Console JARVIS</span><button id="clearBtn" style="min-height:24px;padding:2px 8px;font-size:7px">EFFACER</button></div><div class="console" id="co"></div></div>
    </section>`;
}

function speak(text) {
  if (muted || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "fr-FR"; u.volume = 0.75; u.rate = 0.95; u.pitch = 0.85;
  u.onstart = () => setCoreState("responding");
  u.onend = () => { setCoreState("idle"); $("micStatus").textContent = "PRÊT"; };
  u.onerror = () => { logError("Erreur synthèse vocale."); setCoreState("idle"); };
  window.speechSynthesis.speak(u);
}

async function testHA() {
  if (!TOKEN.trim()) { connected = false; $("connectionText").textContent = "CONFIGURATION"; $("connectionStatus")?.classList.add("offline"); $("tokenWarning").classList.add("show"); $("systemState").textContent = "TOKEN"; logError("Token Home Assistant requis."); return false; }
  connected = await testHomeAssistant(TOKEN); $("connectionText").textContent = connected ? "EN LIGNE" : "HORS LIGNE"; $("systemState").textContent = connected ? "ONLINE" : "OFFLINE"; return connected;
}

async function send(text) {
  if (!text?.trim()) return;
  log(`⌨️ Commande : ${text.trim()}`);
  await sendToAssist(text.trim(), { token: TOKEN, connected, testHA, onSpeech: speak, onNoSpeech: () => setCoreState("idle") });
}

function ensureRecognition() {
  if (recognition) return recognition;
  recognition = createRecognition({ onListeningChange: value => { listening = value; }, onTranscript: transcript => send(transcript) });
  return recognition;
}

async function toggleVoice() {
  if (muted) return;
  const r = ensureRecognition(); if (!r) return;
  if (listening) { stopRecognition(r); return; }
  if (!connected && !(await testHA())) return;
  await startRecognition(r);
}

async function playMusic(index = 0) {
  if (!JARVIS_MUSIC.length) return;
  if (!musicPlayer) { musicPlayer = new Audio(); musicPlayer.preload = "auto"; musicPlayer.addEventListener("ended", () => playMusic((musicIndex + 1) % JARVIS_MUSIC.length)); }
  musicIndex = (index + JARVIS_MUSIC.length) % JARVIS_MUSIC.length;
  const track = JARVIS_MUSIC[musicIndex]; musicPlayer.src = track.file; $("musicName").textContent = track.name;
  try { await musicPlayer.play(); $("musicStatus").textContent = "LECTURE"; $("playBtn").textContent = "⏸"; } catch { $("musicStatus").textContent = "APPUI REQUIS"; }
}

function toggleMusic() { if (!musicPlayer?.src) return playMusic(0); if (musicPlayer.paused) { musicPlayer.play().catch(() => {}); $("musicStatus").textContent = "LECTURE"; $("playBtn").textContent = "⏸"; } else { musicPlayer.pause(); $("musicStatus").textContent = "PAUSE"; $("playBtn").textContent = "▶"; } }
function stopMusic() { musicPlayer?.pause(); if (musicPlayer) musicPlayer.currentTime = 0; $("musicStatus").textContent = "ARRÊTÉE"; $("playBtn").textContent = "▶"; }

async function updateEnergy() {
  if (!connected || !TOKEN.trim()) return;
  let ok = false; const values = {};
  for (const [key, entity] of Object.entries(ENERGY_SENSORS)) {
    try { const r = await fetch(`${HA_URL}/api/states/${entity}`, { headers: { Authorization: `Bearer ${TOKEN}` } }); if (!r.ok) throw new Error(); const d = await r.json(); const n = Number.parseFloat(d.state); if (!Number.isNaN(n)) { values[key] = n; ok = true; $("energy_" + key).textContent = n.toFixed(1).replace(".", ","); $("energy_" + key + "_unit").textContent = d.attributes?.unit_of_measurement || "W"; } } catch {}
  }
  if (values.production != null && values.consumption > 0) $("energy_autoconso").textContent = Math.min(100, values.production / values.consumption * 100).toFixed(0);
  $("energyStatus").textContent = ok ? "LIVE" : "N/A";
}

async function activateSatellite() {
  if (!connected && !(await testHA())) return;
  const ws = new WebSocket(HA_URL.replace(/^https:/, "wss:").replace(/^http:/, "ws:") + "/api/websocket");
  ws.onmessage = event => { const msg = JSON.parse(event.data); if (msg.type === "auth_required") ws.send(JSON.stringify({ type: "auth", access_token: TOKEN })); else if (msg.type === "auth_ok") ws.send(JSON.stringify({ id: Date.now(), type: "call_service", domain: "assist_satellite", service: "start_conversation", target: { entity_id: JARVIS_SATELLITE }, service_data: { start_message: "", preannounce: true } })); else if (msg.type === "result") { if (msg.success) { logOK("🎙️ JARVIS iPhone activé."); setCoreState("listening"); } else logError("Activation du satellite refusée."); ws.close(); } };
  ws.onerror = () => logError("WebSocket Home Assistant indisponible.");
}

function bind() {
  $("sendBtn").onclick = async () => { const input = $("ci"); const text = input.value; input.value = ""; await send(text); };
  $("ci").onkeydown = e => { if (e.key === "Enter") $("sendBtn").click(); };
  $("voiceBtn").onclick = toggleVoice; $("tapZone").onclick = toggleVoice; $("testBtn").onclick = testHA; $("satelliteBtn").onclick = activateSatellite;
  $("muteBtn").onclick = () => { muted = !muted; if (muted) { stopRecognition(recognition); window.speechSynthesis?.cancel(); stopMusic(); $("muteBtn").textContent = "🔊 ACTIVER"; $("micStatus").textContent = "COUPÉ"; log("🔇 Audio désactivé."); } else { $("muteBtn").textContent = "🔇 MUTE"; $("micStatus").textContent = "PRÊT"; logOK("🔊 Audio réactivé."); } };
  $("playBtn").onclick = toggleMusic; $("stopBtn").onclick = stopMusic; $("prevBtn").onclick = () => playMusic(musicIndex - 1); $("nextBtn").onclick = () => playMusic(musicIndex + 1);
  $("musicVolume").oninput = e => { if (musicPlayer) musicPlayer.volume = Number(e.target.value) / 100; $("musicVolumeLabel").textContent = `${e.target.value}%`; };
  $("clearBtn").onclick = () => { $("co").innerHTML = ""; };
  document.querySelectorAll("[data-state]").forEach(btn => btn.onclick = () => setCoreState(btn.dataset.state));
}

export function initJarvis() { render(); bind(); log("🤖 JARVIS V8 initialisation..."); setCoreState("idle"); testHA(); updateEnergy(); setInterval(updateEnergy, 5000); }
if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", initJarvis, { once: true }); else initJarvis();
