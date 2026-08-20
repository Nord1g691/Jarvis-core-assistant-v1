// JARVIS V8 — Voice recognition helpers

import { $ } from "./dom.js";
import { log, logError } from "./logger.js";
import { setCoreState } from "./core-state.js";

export function createRecognition({ onTranscript, onListeningChange } = {}) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    $("micStatus")?.replaceChildren(document.createTextNode("INDISPONIBLE"));
    logError("Reconnaissance vocale indisponible.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "fr-FR";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    onListeningChange?.(true);
    setCoreState("listening");
    $("micStatus")?.replaceChildren(document.createTextNode("ÉCOUTE..."));
    $("voiceBtn")?.replaceChildren(document.createTextNode("⏹ ARRÊTER"));
    log("🎙️ JARVIS écoute...");
  };

  recognition.onresult = async (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();
    if (!transcript) return;
    await onTranscript?.(transcript);
  };

  recognition.onerror = (event) => {
    onListeningChange?.(false);
    logError(`Erreur micro : ${event.error}`);
  };

  recognition.onend = () => {
    onListeningChange?.(false);
    $("voiceBtn")?.replaceChildren(document.createTextNode("🎤 ÉCOUTER"));
  };

  return recognition;
}

export async function startRecognition(recognition) {
  if (!recognition) return false;
  try {
    recognition.start();
    return true;
  } catch {
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
