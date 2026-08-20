// JARVIS V8.9 — application entry point
import { $ } from "./dom.js";
import { setCoreState } from "./core-state.js";
import { createRecognition, requestMicrophonePermission, startRecognition, stopRecognition } from "./voice.js";
import { sendToAssist } from "./assist.js";
import { testHomeAssistant } from "./ha.js";
import { updateEnergyPanel } from "./energy.js";
import { createMusicController } from "./music.js";
import { activateJarvisSatellite } from "./satellite.js";
import { log, logError, logOK } from "./logger.js";
import { getVoiceResponseTimeout } from "./settings.js";
import { JARVIS_MUSIC, MUSIC_DUCK_FACTOR } from "./config.js";

const JARVIS_VERSION = "V8.9";

function getToken() {
  const runtimeToken = typeof window.JARVIS_TOKEN === "string" ? window.JARVIS_TOKEN.trim() : "";
  if (runtimeToken) return runtimeToken;
  try { return localStorage.getItem("jarvis_ha_token")?.trim() || ""; } catch { return ""; }
}

let connected = false;
let muted = false;
let listening = false;
let recognition = null;
let music = null;
let voiceSafetyTimer = null;

function clearVoiceSafetyTimer() {
  if (voiceSafetyTimer) { clearTimeout(voiceSafetyTimer); voiceSafetyTimer = null; }
}

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
      <div class="coreLabel"><div class="coreState" id="coreState">HORS LIGNE</div><div class="coreHint" id="coreHint">HOME ASSISTANT REQUIS</div></div>
    </div></section>
    <section class="panels">
      <div class="panel"><div class="panelTitle"><span>⚡ Énergie Envoy</span><span id="energyStatus">--</span></div><div class="energyGrid"><div class="energyStat production"><div class="energyValue"><span id="energy_production">--</span><span class="energyUnit" id="energy_production_unit">W</span></div><div class="energyLabel">Production</div></div><div class="energyStat consumption"><div class="energyValue"><span id="energy_consumption">--</span><span class="energyUnit" id="energy_consumption_unit">W</span></div><div class="energyLabel">Consommation</div></div><div class="energyStat import"><div class="energyValue"><span id="energy_import">--</span><span class="energyUnit" id="energy_import_unit">W</span></div><div class="energyLabel">Import réseau</div></div><div class="energyStat export"><div class="energyValue"><span id="energy_export">--</span><span class="energyUnit" id="energy_export_unit">W</span></div><div class="energyLabel">Export réseau</div></div><div class="energyStat autoconso" style="grid-column:1/-1"><div class="energyValue"><span id="energy_autoconso">--</span><span class="energyUnit">%</span></div><div class="energyLabel">Autoconsommation solaire</div></div></div></div>
      <div class="panel"><div class="panelTitle"><span>Commandes vocales</span><span id="micStatus">SERVICE VOCAL À TESTER</span></div><div class="inputRow"><input id="ci" type="text" autocomplete="off" placeholder="Connexion HA requise..." aria-label="Commande texte à JARVIS"><button id="sendBtn">ENVOYER</button></div><div class="controls" style="margin-top:8px"><button id="voiceBtn">🎤 ÉCOUTER</button><button id="satelliteBtn">🎙️ JARVIS IPHONE</button><button id="muteBtn" class="danger">🔇 MUTE</button><button id="testBtn">📡 TEST HA</button></div></div>
      <div class="panel musicPanel"><div class="panelTitle"><span>🎵 Musique JARVIS</span><span id="musicStatus">ARRÊTÉE</span></div><div class="musicName" id="musicName">Aucun morceau</div><div class="musicControls"><button id="prevBtn">⏮</button><button id="playBtn">▶</button><button id="nextBtn">⏭</button><button id="stopBtn">⏹</button></div><div class="musicSlider"><div class="sliderLabel"><span>🎵 VOLUME MUSIQUE</span><span id="musicVolumeLabel">4%</span></div><input id="musicVolume" type="range" min="0" max="100" value="4"></div></div>
      <div class="panel"><div class="panelTitle"><span>État système</span><span id="systemState">HORS LIGNE</span></div><div class="controls"><button data-state="idle">AUTO</button><button data-state="listening">ÉCOUTE</button><button data-state="processing">RÉFLEXION</button><button data-state="responding">RÉPONSE</button></div></div>
      <div class="panel consolePanel"><div class="panelTitle"><span>Console JARVIS</span><div style="display:flex;gap:4px"><button id="copyLogsBtn" style="min-height:24px;padding:2px 8px;font-size:7px">📋 COPIER LOGS</button><button id="clearBtn" style="min-height:24px;padding:2px 8px;font-size:7px">EFFACER</button></div></div><div class="console" id="co"></div></div>
    </section><div style="position:fixed;right:8px;bottom:6px;font-size:8px;opacity:.65;z-index:9999">JARVIS ${JARVIS_VERSION}</div>`;
}

function setHeaderConnection(text, color, mode = "") {
  const header = $("connectionText");
  const status = $("connectionStatus");
  if (header) { header.textContent = text; header.style.color = color; }
  if (status) { status.dataset.state = mode; status.style.color = color; status.title = mode === "connected" ? "Home Assistant connecté" : mode === "offline" ? "Home Assistant hors ligne" : "Erreur de connexion Home Assistant"; }
}

function setState(state) {
  setCoreState(state, music);
  const systemState = $("systemState");
  if (systemState) systemState.textContent = connected ? (state === "idle" ? "CONNECTÉ" : state.toUpperCase()) : "HORS LIGNE";
}

function setConnectionVisual(ok) {
  const state = $("coreState");
  const hint = $("coreHint");
  const system = $("systemState");
  const dot = document.querySelector("#connectionStatus .statusDot");
  if (ok) {
    state.textContent = "CONNECTÉ"; state.style.color = "#6cff8d";
    hint.textContent = "HOME ASSISTANT • WEBSOCKET";
    if (system) system.textContent = "CONNECTÉ";
    if (dot) { dot.style.background = "#6cff8d"; dot.style.boxShadow = "0 0 8px #6cff8d"; }
    setHeaderConnection("CONNECTÉ", "#6cff8d", "connected");
  } else {
    state.textContent = "ERREUR DE CONNEXION"; state.style.color = "#ff5b6e";
    hint.textContent = "HOME ASSISTANT INDISPONIBLE";
    if (system) system.textContent = "HORS LIGNE";
    if (dot) { dot.style.background = "#ff5b6e"; dot.style.boxShadow = "0 0 8px #ff5b6e"; }
    setHeaderConnection("ERREUR DE CONNEXION", "#ff5b6e", "error");
  }
}

function finishVoiceResponse(reason = "") {
  clearVoiceSafetyTimer();
  if (reason) log(`🔊 ${reason}.`);
  if (muted || !connected) { setState("idle"); return; }
  const timeout = getVoiceResponseTimeout();
  const r = ensureRecognition();
  if (r && !listening) {
    setState("listening");
    $("micStatus").textContent = "🎙️ JARVIS ÉCOUTE...";
    startRecognition(r).catch(error => {
      logError(`Erreur reprise écoute : ${error.message}`);
      setState("idle");
    });
  }
  if (timeout > 0) {
    voiceSafetyTimer = setTimeout(() => {
      if (listening && recognition) stopRecognition(recognition);
      log(`⏱️ Fin de la fenêtre d'écoute automatique après ${timeout}s.`);
      setState("idle");
      $("micStatus").textContent = "SERVICE VOCAL À TESTER";
    }, timeout * 1000);
  }
}

function speak(text) {
  if (muted) return;
  if (!window.speechSynthesis) {
    logError("Synthèse vocale indisponible : réponse écrite conservée.");
    finishVoiceResponse("Sortie vocale indisponible — ouverture de la fenêtre d'écoute");
    return;
  }
  clearVoiceSafetyTimer();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = "fr-FR"; u.volume = .75; u.rate = .95; u.pitch = .85;
  u.onstart = () => {
    setState("responding");
    $("micStatus").textContent = "🔊 JARVIS PARLE...";
    logOK("🔊 Synthèse vocale démarrée.");
  };
  u.onend = () => finishVoiceResponse("Lecture terminée — ouverture de la fenêtre d'écoute");
  u.onerror = () => {
    clearVoiceSafetyTimer();
    logError("Erreur synthèse vocale : sortie audio refusée par le navigateur. Réponse écrite conservée.");
    finishVoiceResponse("Erreur audio — ouverture de la fenêtre d'écoute");
  };
  window.speechSynthesis.speak(u);
}

async function testHA() {
  const token = getToken();
  if (!token) {
    connected = false; setConnectionVisual(false);
    $("coreState").textContent = "CONFIGURATION"; $("coreState").style.color = "#ffb84d"; $("coreHint").textContent = "TOKEN HOME ASSISTANT REQUIS"; $("micStatus").textContent = "BLOQUÉ";
    setHeaderConnection("ERREUR DE CONNEXION", "#ff5b6e", "error"); logError("Token Home Assistant requis."); return false;
  }
  setHeaderConnection("CONNEXION...", "#ffb84d", "connecting");
  connected = await testHomeAssistant(token);
  if (connected) {
    setConnectionVisual(true); ensureRecognition();
    if (["BLOQUÉ", "CONNEXION..."].includes($("micStatus")?.textContent)) $("micStatus").textContent = "SERVICE VOCAL À TESTER";
    $("ci").placeholder = "Commande à JARVIS...";
  } else { setConnectionVisual(false); $("micStatus").textContent = "BLOQUÉ"; }
  return connected;
}

async function refreshEnergy(){const token=getToken();if(!token||!connected)return;await updateEnergyPanel({connected,token});}
async function send(text){if(!text?.trim())return;const command=text.trim();log(`⌨️ Commande : ${command}`);const token=getToken();await sendToAssist(command,{token,connected,testHA,music,onSpeech:async speech=>speak(speech),onNoSpeech:()=>setState("idle")});}
function ensureRecognition(){if(recognition)return recognition;recognition=createRecognition({music,onListeningChange:value=>{listening=value;if(!value&&$("micStatus")?.textContent==="ÉCOUTE...")$("micStatus").textContent="SERVICE VOCAL À TESTER"},onTranscript:transcript=>send(transcript)});return recognition;}
async function toggleVoice(){if(muted)return;if(!connected&&!(await testHA()))return;const r=ensureRecognition();if(!r)return;if(listening){stopRecognition(r);setState("idle");return;}if(!(await requestMicrophonePermission()))return;await startRecognition(r);}
function updateMusicUI(){const track=music?.getTrack?.();const player=music?.player;$("musicName").textContent=track?.name||"Aucun morceau";$("musicStatus").textContent=player?.paused?(track?"PAUSE":"ARRÊTÉE"):track?"LECTURE":"ARRÊTÉE";$("playBtn").textContent=player?.paused?"▶":track?"⏸":"▶";}
async function toggleMusic(){await music?.toggle?.();updateMusicUI();} function stopMusic(){music?.stop?.();updateMusicUI();}
async function activateSatellite(){const token=getToken();if(!connected&&!(await testHA()))return;try{await activateJarvisSatellite(token,{music,onStateChange:state=>{setState(state);$("micStatus").textContent=state==="listening"?"ÉCOUTE...":state.toUpperCase()}})}catch(error){logError(`Satellite : ${error.message}`)}}
function bind(){ $("sendBtn").onclick=async()=>{if(!connected&&!(await testHA()))return;const input=$("ci");const text=input.value;input.value="";await send(text)};$("ci").onkeydown=e=>{if(e.key==="Enter")$("sendBtn").click()};$("voiceBtn").onclick=toggleVoice;$("tapZone").onclick=toggleVoice;$("testBtn").onclick=testHA;$("satelliteBtn").onclick=activateSatellite;$("muteBtn").onclick=()=>{muted=!muted;if(muted){clearVoiceSafetyTimer();stopRecognition(recognition);window.speechSynthesis?.cancel();stopMusic();$("muteBtn").textContent="🔊 ACTIVER";$("micStatus").textContent="COUPÉ";setState("idle");log("🔇 Audio désactivé.")}else{$("muteBtn").textContent="🔇 MUTE";$("micStatus").textContent=connected?"SERVICE VOCAL À TESTER":"BLOQUÉ";logOK("🔊 Audio réactivé.")}};$("playBtn").onclick=toggleMusic;$("stopBtn").onclick=stopMusic;$("prevBtn").onclick=()=>music?.previous?.().then(updateMusicUI);$("nextBtn").onclick=()=>music?.next?.().then(updateMusicUI);$("musicVolume").oninput=e=>{music?.setVolume?.(e.target.value);$("musicVolumeLabel").textContent=`${e.target.value}%`};$("clearBtn").onclick=()=>{$("co").innerHTML=""};$("copyLogsBtn").onclick=async()=>{const text=$("co")?.innerText||"";try{await navigator.clipboard.writeText(text);logOK("📋 Logs copiés dans le presse-papiers.")}catch{logError("Impossible de copier les logs.")}};document.querySelectorAll("[data-state]").forEach(btn=>{btn.onclick=()=>setState(btn.dataset.state)});}
export function initJarvis(){render();music=createMusicController({playlist:JARVIS_MUSIC,duckFactor:MUSIC_DUCK_FACTOR});bind();log(`🤖 JARVIS ${JARVIS_VERSION} — version test`);setState("idle");testHA();refreshEnergy();setInterval(refreshEnergy,5000)}
if(document.readyState==="loading")window.addEventListener("DOMContentLoaded",initJarvis,{once:true});else initJarvis();