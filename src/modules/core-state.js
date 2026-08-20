// JARVIS V8 — Core visual state

import { $ } from "./dom.js";

export function setCoreState(state, music) {
  const core = $("core");
  if (!core) return;

  core.classList.remove("listening", "processing", "responding");

  let label = "OPÉRATIONNEL";
  let hint = "APPUYER POUR PARLER";

  if (state === "listening") {
    core.classList.add("listening");
    label = "JARVIS ÉCOUTE";
    hint = "RELÂCHEZ POUR ENVOYER";
    music?.duck?.();
  } else if (state === "processing") {
    core.classList.add("processing");
    label = "JARVIS RÉFLÉCHIT";
    hint = "ANALYSE EN COURS";
    music?.duck?.();
  } else if (state === "responding") {
    core.classList.add("responding");
    label = "JARVIS PARLE";
    hint = "JARVIS RÉPOND";
    music?.duck?.();
  } else {
    music?.restore?.();
  }

  const stateEl = $("coreState");
  const hintEl = $("coreHint");
  if (stateEl) stateEl.innerText = label;
  if (hintEl) hintEl.innerText = hint;
}
