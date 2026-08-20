// JARVIS V8 — application entry point
import { $ } from "./dom.js";
import { setCoreState } from "./core-state.js";
import { createRecognition, startRecognition, stopRecognition } from "./voice.js";
import { sendToAssist } from "./assist.js";
import { testHomeAssistant } from "./ha.js";
import { log, logError, logOK } from "./logger.js";

const TOKEN = "";
let connected = false;
let muted = false;
let listening = false;
let recognition = null;

function render() {
  const root = $("jarvisRoot");
  if (!root) return;
  root.innerHTML = `
    <section class="coreZone">
      <div class="core" id="core">
        <div class="tapZone" id="tapZone" role="button" tabindex="0" aria-label="Appuyer pour parler à JARVIS"></div>
        <div class="sweep"></div><div class="bars" id="bars"></div>
        <div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div><div class="ring r4"></div><div class="ring r5"></div>
        <div class="orbit"></div><div class="orbit orbit2"></div>
        <div class="center"><div class="centerGlow"></div><div class="centerCore"></div></div>
        <div class="coreLabel"><div class="coreState" id="coreState">INITIALISATION</div><div class="coreHint" id="coreHint">APPUYER POUR PARLER</div></div>
      </div>
    </section>
    <section class="panels">
      <div class="panel">
        <div class="panelTitle"><span>Commandes vocales</span><span id="micStatus">PRÊT</span></div>
        <div class="inputRow"><input id="ci" type="text" autocomplete="off" placeholder="Commande à JARVIS..." aria-label="Commande texte à JARVIS"><button id="sendBtn">ENVOYER</button></div>
        <div class="controls" style="margin-top:8px"><button id="voiceBtn">🎤 ÉCOUTER</button><button id="muteBtn" class="danger">🔇 MUTE</button><button id="testBtn">📡 TEST HA</button></div>
      </div>
      <div class="panel consolePanel"><div class="panelTitle"><span>Console JARVIS</span></div><div class="console" id="co"></div></div>
    </section>`;
}

async function testHA() {
  if (!TOKEN.trim()) {
    connected = false;
    $("connectionText").textContent = "CONFIGURATION";
    $("connectionStatus")?.classList.add("offline");
    $("tokenWarning").classList.add("show");
    logError("Token Home Assistant requis.");
    return false;
  }
  connected = await testHomeAssistant(TOKEN);
  $("connectionText").textContent = connected ? "EN LIGNE" : "HORS LIGNE";
  return connected;
}

function speak(text) {
  if (muted || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "fr-FR";
  u.volume = 0.75;
  u.rate = 0.95;
  u.pitch = 0.85;
  u.onstart = () => setCoreState("responding");
  u.onend = () => { setCoreState("idle"); $("micStatus").textContent = "PRÊT"; };
  u.onerror = () => { logError("Erreur synthèse vocale."); setCoreState("idle"); };
  window.speechSynthesis.speak(u);
}

async function send(text) {
  if (!text?.trim()) return;
  log(`⌨️ Commande : ${text}`);
  await sendToAssist(text.trim(), {
    token: TOKEN,
    connected,
    testHA,
    onSpeech: async speech => speak(speech),
    onNoSpeech: async () => setCoreState("idle")
  });
}

async function toggleVoice() {
  if (muted) return;
  if (!recognition) {
    recognition = createRecognition({
      onListeningChange: value => { listening = value; },
      onTranscript: async transcript => {
        log(`🗣️ Vous : ${transcript}`);
        await send(transcript);
      }
    });
  }
  if (!recognition) return;
  if (listening) {
    stopRecognition(recognition);
    return;
  }
  if (!connected && !(await testHA())) return;
  await startRecognition(recognition);
}

function bind() {
  $("sendBtn").onclick = async () => { const input = $("ci"); const text = input.value; input.value = ""; await send(text); };
  $("ci").onkeydown = e => { if (e.key === "Enter") $("sendBtn").click(); };
  $("voiceBtn").onclick = toggleVoice;
  $("testBtn").onclick = testHA;
  $("muteBtn").onclick = () => {
    muted = !muted;
    if (muted) { stopRecognition(recognition); window.speechSynthesis?.cancel(); setCoreState("idle"); $("muteBtn").textContent = "🔊 ACTIVER"; $("micStatus").textContent = "COUPÉ"; log("🔇 Audio désactivé."); }
    else { $("muteBtn").textContent = "🔇 MUTE"; $("micStatus").textContent = "PRÊT"; logOK("🔊 Audio réactivé."); }
  };
  $("tapZone").onclick = toggleVoice;
  $("tapZone").onkeydown = e => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); toggleVoice(); } };
}

export function initJarvis() {
  render();
  bind();
  log("🤖 JARVIS V8 initialisation...");
  setCoreState("idle");
  testHA();
}

if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", initJarvis, { once: true });
else initJarvis();
