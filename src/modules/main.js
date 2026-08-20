// JARVIS V8 — application entry point
import { $ } from "./dom.js";
import { setCoreState } from "./core-state.js";
import { createRecognition, startRecognition, stopRecognition } from "./voice.js";
import { sendToAssist } from "./assist.js";
import { testHomeAssistant } from "./ha.js";
import { updateEnergyPanel } from "./energy.js";
import { createMusicController } from "./music.js";
import { activateJarvisSatellite } from "./satellite.js";
import { log, logError, logOK } from "./logger.js";
import { HA_URL, JARVIS_SATELLITE, JARVIS_MUSIC, MUSIC_DUCK_FACTOR } from "./config.js";

// Intentionally empty in the shared repository. Provide a token locally at runtime.
const TOKEN = "";

let connected = false;
let muted = false;
let listening = false;
let recognition = null;
let music = null;

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

function setState(state) {
  setCoreState(state, music);
  const systemState = $("systemState");
  if (systemState) systemState.textContent = state === "idle" ? "ONLINE" : state.toUpperCase();
}

function speak(text) {
  if (muted || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "fr-FR";
  u.volume = 0.75;
  u.rate = 0.95;
  u.pitch = 0.85;
  u.onstart = () => {
    setState("responding");
    $("micStatus").textContent = "JARVIS PARLE...";
  };
  u.onend = () => {
    setState("idle");
    $("micStatus").textContent = "PRÊT";
  };
  u.onerror = () => {
    logError("Erreur synthèse vocale.");
    setState("idle");
    $("micStatus").textContent = "ERREUR";
  };
  window.speechSynthesis.speak(u);
}

async function testHA() {
  if (!TOKEN.trim()) {
    connected = false;
    $("connectionText").textContent = "CONFIGURATION";
    $("connectionStatus")?.classList.remove("online");
    $("connectionStatus")?.classList.add("offline");
    $("tokenWarning")?.classList.add("show");
    $("systemState").textContent = "TOKEN";
    logError("Token Home Assistant requis.");
    return false;
  }

  $("tokenWarning")?.classList.remove("show");
  connected = await testHomeAssistant(TOKEN);
  $("connectionText").textContent = connected ? "EN LIGNE" : "HORS LIGNE";
  $("connectionStatus")?.classList.toggle("online", connected);
  $("connectionStatus")?.classList.toggle("offline", !connected);
  $("systemState").textContent = connected ? "ONLINE" : "OFFLINE";
  if (connected) setState("idle");
  return connected;
}

async function refreshEnergy() {
  await updateEnergyPanel({ connected, token: TOKEN });
}

async function send(text) {
  if (!text?.trim()) return;

  const command = text.trim();
  log(`⌨️ Commande : ${command}`);

  await sendToAssist(command, {
    token: TOKEN,
    connected,
    testHA,
    onSpeech: async (speech) => speak(speech),
    onNoSpeech: () => setState("idle")
  });
}

function ensureRecognition() {
  if (recognition) return recognition;

  recognition = createRecognition({
    onListeningChange: value => {
      listening = value;
      if (!value && $("micStatus")?.textContent === "ÉCOUTE...") {
        $("micStatus").textContent = "PRÊT";
      }
    },
    onTranscript: transcript => send(transcript)
  });

  return recognition;
}

async function toggleVoice() {
  if (muted) return;

  const r = ensureRecognition();
  if (!r) return;

  if (listening) {
    stopRecognition(r);
    setState("idle");
    return;
  }

  if (!connected && !(await testHA())) return;
  await startRecognition(r);
}

function updateMusicUI() {
  const track = music?.getTrack?.();
  $("musicName").textContent = track?.name || "Aucun morceau";
  $("musicStatus").textContent = music?.player?.paused ? "PAUSE" : track ? "LECTURE" : "ARRÊTÉE";
  $("playBtn").textContent = music?.player?.paused ? "▶" : track ? "⏸" : "▶";
}

async function toggleMusic() {
  await music?.toggle?.();
  updateMusicUI();
}

async function playMusic(index) {
  await music?.player?.pause?.();
  await music?.next?.();
  updateMusicUI();
}

function stopMusic() {
  music?.stop?.();
  updateMusicUI();
}

async function activateSatellite() {
  if (!connected && !(await testHA())) return;

  try {
    await activateJarvisSatellite(TOKEN, {
      onStateChange: state => {
        setState(state);
        $("micStatus").textContent = state === "listening" ? "ÉCOUTE..." : state.toUpperCase();
      }
    });
  } catch (error) {
    logError(`Satellite : ${error.message}`);
  }
}

function bind() {
  $("sendBtn").onclick = async () => {
    const input = $("ci");
    const text = input.value;
    input.value = "";
    await send(text);
  };

  $("ci").onkeydown = e => {
    if (e.key === "Enter") $("sendBtn").click();
  };

  $("voiceBtn").onclick = toggleVoice;
  $("tapZone").onclick = toggleVoice;
  $("testBtn").onclick = testHA;
  $("satelliteBtn").onclick = activateSatellite;

  $("muteBtn").onclick = () => {
    muted = !muted;

    if (muted) {
      stopRecognition(recognition);
      window.speechSynthesis?.cancel();
      stopMusic();
      $("muteBtn").textContent = "🔊 ACTIVER";
      $("micStatus").textContent = "COUPÉ";
      setState("idle");
      log("🔇 Audio désactivé.");
    } else {
      $("muteBtn").textContent = "🔇 MUTE";
      $("micStatus").textContent = "PRÊT";
      logOK("🔊 Audio réactivé.");
    }
  };

  $("playBtn").onclick = toggleMusic;
  $("stopBtn").onclick = stopMusic;
  $("prevBtn").onclick = () => music?.previous?.().then(updateMusicUI);
  $("nextBtn").onclick = () => music?.next?.().then(updateMusicUI);

  $("musicVolume").oninput = e => {
    music?.setVolume?.(e.target.value);
    $("musicVolumeLabel").textContent = `${e.target.value}%`;
  };

  $("clearBtn").onclick = () => { $("co").innerHTML = ""; };

  document.querySelectorAll("[data-state]").forEach(btn => {
    btn.onclick = () => setState(btn.dataset.state);
  });
}

export function initJarvis() {
  render();
  music = createMusicController({ playlist: JARVIS_MUSIC, duckFactor: MUSIC_DUCK_FACTOR });
  bind();
  log("🤖 JARVIS V8 initialisation...");
  setState("idle");
  testHA();
  refreshEnergy();
  setInterval(refreshEnergy, 5000);
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initJarvis, { once: true });
} else {
  initJarvis();
}
