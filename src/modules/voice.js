// JARVIS V8.5 — Voice recognition helpers

import { $ } from "./dom.js";
import { log, logError } from "./logger.js";
import { setCoreState } from "./core-state.js";

export function createRecognition({ onTranscript, onListeningChange, music } = {}) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    $("micStatus")?.replaceChildren(document.createTextNode("SERVICE VOCAL INDISPONIBLE"));
    logError("Reconnaissance vocale indisponible dans ce navigateur.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "fr-FR";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    onListeningChange?.(true);
    setCoreState("listening", music);
    $("micStatus")?.replaceChildren(document.createTextNode("ÉCOUTE..."));
    $("voiceBtn")?.replaceChildren(document.createTextNode("⏹ ARRÊTER"));
    log("🎙️ JARVIS écoute...");
  };

  recognition.onresult = async (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();
    if (!transcript) {
      logError("Micro actif, mais aucune parole détectée.");
      return;
    }
    log(`🎤 Transcription : ${transcript}`);
    await onTranscript?.(transcript);
  };

  recognition.onerror = (event) => {
    onListeningChange?.(false);
    const error = event?.error || "unknown";
    const messages = {
      "not-allowed": "Micro refusé. Autorise le micro pour ce site dans les réglages du navigateur.",
      "service-not-allowed": "Service vocal refusé par le navigateur.",
      "audio-capture": "Aucun microphone disponible.",
      "network": "Le service de reconnaissance vocale rencontre un problème réseau.",
      "no-speech": "Aucune parole détectée.",
      "aborted": "Écoute interrompue."
    };
    const status = {
      "not-allowed": "MICRO REFUSÉ",
      "service-not-allowed": "SERVICE VOCAL INDISPONIBLE",
      "audio-capture": "MICRO INDISPONIBLE",
      "network": "SERVICE VOCAL INDISPONIBLE",
      "no-speech": "AUCUNE PAROLE",
      "aborted": "ÉCOUTE INTERROMPUE"
    };
    $("micStatus")?.replaceChildren(document.createTextNode(status[error] || "ERREUR MICRO"));
    logError(`Erreur micro : ${messages[error] || error}`);
  };

  recognition.onend = () => {
    onListeningChange?.(false);
    $("voiceBtn")?.replaceChildren(document.createTextNode("🎤 ÉCOUTER"));
    if ($("micStatus")?.textContent === "ÉCOUTE...") $("micStatus").replaceChildren(document.createTextNode("SERVICE VOCAL À TESTER"));
  };

  return recognition;
}

export async function requestMicrophonePermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    $("micStatus")?.replaceChildren(document.createTextNode("MICRO INDISPONIBLE"));
    logError("Ce navigateur ne permet pas de vérifier l'accès au microphone.");
    return false;
  }

  $("micStatus")?.replaceChildren(document.createTextNode("AUTORISATION MICRO..."));
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    log("🎤 Microphone autorisé.");
    return true;
  } catch (error) {
    const name = error?.name || "Erreur inconnue";
    $("micStatus")?.replaceChildren(document.createTextNode("MICRO REFUSÉ"));
    logError(`Accès microphone refusé : ${name}.`);
    return false;
  }
}

export async function startRecognition(recognition) {
  if (!recognition) return false;
  try {
    recognition.start();
    return true;
  } catch (error) {
    $("micStatus")?.replaceChildren(document.createTextNode("SERVICE VOCAL INDISPONIBLE"));
    logError(`Impossible de démarrer le service vocal : ${error?.message || "erreur inconnue"}.`);
    return false;
  }
}

export function stopRecognition(recognition) {
  try {
    recognition?.stop();
  } catch {
    // Already stopped.
  }
}
