// JARVIS V8 — Core visual state

import { logWarn } from "./logger.js";

export function setCoreState(state) {
  const core = document.getElementById("core");
  if (!core) return;

  core.classList.remove("listening", "processing", "responding");

  const labels = {
    idle: ["OPÉRATIONNEL", "APPUYER POUR PARLER"],
    listening: ["JARVIS ÉCOUTE", "RELÂCHEZ POUR ENVOYER"],
    processing: ["JARVIS RÉFLÉCHIT", "ANALYSE EN COURS"],
    responding: ["JARVIS PARLE", "JARVIS RÉPOND"]
  };

  const [label, hint] = labels[state] || labels.idle;
  if (state === "listening" || state === "processing" || state === "responding") core.classList.add(state);

  const stateEl = document.getElementById("coreState");
  const hintEl = document.getElementById("coreHint");
  if (stateEl) stateEl.textContent = label;
  if (hintEl) hintEl.textContent = hint;

  if (!labels[state]) logWarn(`État core inconnu : ${state}`);
}
